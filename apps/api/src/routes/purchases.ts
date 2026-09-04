import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";
import { razorpay } from "../lib/razorpay.js";
import { matchProducts } from "../services/productMatching.js";

const router = Router();

const purchaseSchema = z.object({
  productId: z.string().min(1),
  requestText: z.string().trim().min(3).max(500),
  mode: z.enum(["solo", "group"]),
  quantity: z.number().int().min(1).max(20).optional(),
  groupId: z.string().min(1).optional(),
});

const paymentVerificationSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpayOrderId: z.string().min(1).optional(),
  razorpaySignature: z.string().min(1).optional(),
});

const DEMO_USER_EMAIL = "demo@together.local";

function calculateItemsTotal(
  items: Array<{
    unitPricePaise: number;
    quantity: number;
  }>,
): number {
  return items.reduce(
    (total, item) => total + item.unitPricePaise * item.quantity,
    0,
  );
}

function verifySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const generatedBuffer = Buffer.from(generatedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (generatedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
}

router.post("/", async (req, res) => {
  const parsed = purchaseSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid purchase request",
      errors: parsed.error.flatten(),
    });
  }

  const {
    productId,
    requestText,
    mode,
    quantity: requestedQuantity,
    groupId: requestedGroupId,
  } = parsed.data;

  try {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        active: true,
        merchant: {
          active: true,
        },
      },
      include: {
        merchant: true,
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or unavailable",
      });
    }

    const matchingResult = matchProducts([product], requestText);
    const parsedRequest = matchingResult.request;

    const quantity = requestedQuantity ?? parsedRequest.quantity;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be between 1 and 20",
      });
    }

    const totalPaise = product.pricePaise * quantity;

    if (
      parsedRequest.budgetPaise !== undefined &&
      totalPaise > parsedRequest.budgetPaise
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected product and quantity exceed the stated budget",
        details: {
          budgetPaise: parsedRequest.budgetPaise,
          unitPricePaise: product.pricePaise,
          quantity,
          totalPaise,
        },
      });
    }

    const purchase = await prisma.$transaction(
      
  async (tx: Prisma.TransactionClient) =>  {
        const user = await tx.user.upsert({
          where: {
            email: DEMO_USER_EMAIL,
          },
          update: {},
          create: {
            name: "Demo User",
            email: DEMO_USER_EMAIL,
          },
        });

        let groupId: string | undefined;

        if (mode === "group") {
          if (!requestedGroupId) {
            throw new Error("GROUP_ID_REQUIRED");
          }

          const membership = await tx.groupMember.findUnique({
            where: {
              groupId_userId: {
                groupId: requestedGroupId,
                userId: user.id,
              },
            },
            include: {
              group: true,
            },
          });

          if (!membership) {
            throw new Error("GROUP_MEMBERSHIP_REQUIRED");
          }

          groupId = membership.groupId;
        } else if (requestedGroupId) {
          throw new Error("GROUP_ID_NOT_ALLOWED_FOR_SOLO");
        }

        const createdPurchase = await tx.purchase.create({
          data: {
            userId: user.id,
            groupId,
            mode: mode === "group" ? "GROUP" : "SOLO",
            status: "DRAFT",
            totalPaise,
            currency: product.currency,
            requestText,
            items: {
              create: {
                productId: product.id,
                productName: product.name,
                merchantName: product.merchant.name,
                unitPricePaise: product.pricePaise,
                quantity,
              },
            },
            approval: {
              create: {
                status: "PENDING",
                expiresAt: new Date(Date.now() + 15 * 60 * 1000),
              },
            },
            auditLogs: {
              create: [
                {
                  action: "PURCHASE_CREATED",
                  actorId: user.id,
                  details: {
                    source: "purchase_request",
                    requestText,
                    mode,
                    groupId: groupId ?? null,
                  },
                },
                {
                  action: "PURCHASE_VALIDATED",
                  actorId: user.id,
                  details: {
                    productId: product.id,
                    amountPaise: totalPaise,
                    unitPricePaise: product.pricePaise,
                    quantity,
                    budgetPaise: parsedRequest.budgetPaise ?? null,
                    validation: "PASSED",
                  },
                },
                {
                  action: "APPROVAL_CREATED",
                  actorId: user.id,
                  details: {
                    status: "PENDING",
                    expiresInMinutes: 15,
                  },
                },
              ],
            },
          },
          include: {
            items: true,
            approval: true,
            group: true,
          },
        });

        return {
          purchase: createdPurchase,
          groupId,
        };
      },
    );

    return res.status(201).json({
      success: true,
      purchase: {
        id: purchase.purchase.id,
        mode: purchase.purchase.mode,
        status: purchase.purchase.status,
        totalPaise: purchase.purchase.totalPaise,
        currency: purchase.purchase.currency,
        requestText: purchase.purchase.requestText,
        groupId: purchase.groupId ?? null,
        approval: purchase.purchase.approval,
        items: purchase.purchase.items,
      },
      validation: {
        quantity,
        budgetPaise: parsedRequest.budgetPaise ?? null,
        totalPaise,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "GROUP_ID_REQUIRED") {
        return res.status(400).json({
          success: false,
          message: "groupId is required for a group purchase",
        });
      }

      if (error.message === "GROUP_MEMBERSHIP_REQUIRED") {
        return res.status(403).json({
          success: false,
          message: "User is not a member of the selected group",
        });
      }

      if (error.message === "GROUP_ID_NOT_ALLOWED_FOR_SOLO") {
        return res.status(400).json({
          success: false,
          message: "groupId can only be used for group purchases",
        });
      }
    }

    console.error("Failed to create purchase:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create purchase",
    });
  }
});

router.post("/:id/approve", async (req, res) => {
  const purchaseId = req.params.id;

  if (!purchaseId) {
    return res.status(400).json({
      success: false,
      message: "Purchase ID is required",
    });
  }

  try {
    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const purchase = await tx.purchase.findUnique({
          where: {
            id: purchaseId,
          },
          include: {
            approval: true,
            items: true,
          },
        });

        if (!purchase) {
          return {
            error: "PURCHASE_NOT_FOUND" as const,
          };
        }

        if (!purchase.approval) {
          return {
            error: "APPROVAL_NOT_FOUND" as const,
          };
        }

        if (purchase.status !== "DRAFT") {
          return {
            error: "PURCHASE_NOT_DRAFT" as const,
            status: purchase.status,
          };
        }

        if (purchase.approval.status !== "PENDING") {
          return {
            error: "APPROVAL_NOT_PENDING" as const,
            status: purchase.approval.status,
          };
        }

        if (
          purchase.approval.expiresAt &&
          purchase.approval.expiresAt.getTime() <= Date.now()
        ) {
          await tx.approval.update({
            where: {
              purchaseId,
            },
            data: {
              status: "EXPIRED",
            },
          });

          return {
            error: "APPROVAL_EXPIRED" as const,
          };
        }

        const calculatedTotal = calculateItemsTotal(purchase.items);

        if (calculatedTotal !== purchase.totalPaise) {
          return {
            error: "TOTAL_MISMATCH" as const,
            storedTotal: purchase.totalPaise,
            calculatedTotal,
          };
        }

        const now = new Date();

        const updatedPurchase = await tx.purchase.update({
          where: {
            id: purchaseId,
          },
          data: {
            status: "PENDING_PAYMENT",
            approvedAt: now,
            approval: {
              update: {
                status: "APPROVED",
                approvedBy: purchase.userId,
                approvedAt: now,
              },
            },
            auditLogs: {
              create: {
                action: "APPROVAL_GRANTED",
                actorId: purchase.userId,
                details: {
                  approvalStatus: "APPROVED",
                  validatedTotalPaise: calculatedTotal,
                },
              },
            },
          },
          include: {
            approval: true,
            items: true,
          },
        });

        return {
          purchase: updatedPurchase,
        };
      },
    );

    if ("error" in result) {
      switch (result.error) {
        case "PURCHASE_NOT_FOUND":
          return res.status(404).json({
            success: false,
            message: "Purchase not found",
          });

        case "APPROVAL_NOT_FOUND":
          return res.status(409).json({
            success: false,
            message: "Approval record not found",
          });

        case "PURCHASE_NOT_DRAFT":
          return res.status(409).json({
            success: false,
            message: `Purchase cannot be approved from status ${result.status}`,
          });

        case "APPROVAL_NOT_PENDING":
          return res.status(409).json({
            success: false,
            message: `Approval cannot be granted from status ${result.status}`,
          });

        case "APPROVAL_EXPIRED":
          return res.status(409).json({
            success: false,
            message: "Approval has expired",
          });

        case "TOTAL_MISMATCH":
          return res.status(409).json({
            success: false,
            message: "Purchase total does not match its items",
            details: {
              storedTotal: result.storedTotal,
              calculatedTotal: result.calculatedTotal,
            },
          });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Purchase approved",
      purchase: {
        id: result.purchase.id,
        mode: result.purchase.mode,
        status: result.purchase.status,
        totalPaise: result.purchase.totalPaise,
        currency: result.purchase.currency,
        approvedAt: result.purchase.approvedAt,
        approval: result.purchase.approval,
        items: result.purchase.items,
      },
    });
  } catch (error) {
    console.error("Failed to approve purchase:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to approve purchase",
    });
  }
});

router.post("/:id/payment-order", async (req, res) => {
  const purchaseId = req.params.id;

  if (!purchaseId) {
    return res.status(400).json({
      success: false,
      message: "Purchase ID is required",
    });
  }

  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: purchaseId,
      },
      include: {
        approval: true,
        payment: true,
        items: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    if (purchase.status !== "PENDING_PAYMENT") {
      return res.status(409).json({
        success: false,
        message: `Purchase is not ready for payment. Current status: ${purchase.status}`,
      });
    }

    if (!purchase.approval || purchase.approval.status !== "APPROVED") {
      return res.status(409).json({
        success: false,
        message: "Purchase has not been approved",
      });
    }

    if (
      purchase.approval.expiresAt &&
      purchase.approval.expiresAt.getTime() <= Date.now()
    ) {
      return res.status(409).json({
        success: false,
        message: "Purchase approval has expired",
      });
    }

    const calculatedTotal = calculateItemsTotal(purchase.items);

    if (calculatedTotal !== purchase.totalPaise) {
      return res.status(409).json({
        success: false,
        message: "Purchase total does not match its items",
      });
    }

    if (purchase.totalPaise <= 0) {
      return res.status(409).json({
        success: false,
        message: "Invalid purchase amount",
      });
    }

    if (purchase.payment?.razorpayOrderId) {
      if (purchase.payment.amountPaise !== purchase.totalPaise) {
        return res.status(409).json({
          success: false,
          message: "Existing payment amount does not match purchase total",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment order already exists",
        payment: {
          id: purchase.payment.id,
          orderId: purchase.payment.razorpayOrderId,
          amountPaise: purchase.payment.amountPaise,
          currency: purchase.payment.currency,
          status: purchase.payment.status,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: purchase.totalPaise,
      currency: purchase.currency,
      receipt: `purchase_${purchase.id}`,
      notes: {
        purchaseId: purchase.id,
        mode: purchase.mode,
      },
    });

    const payment = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const createdPayment = await tx.payment.create({
          data: {
            purchaseId: purchase.id,
            status: "CREATED",
            amountPaise: purchase.totalPaise,
            currency: purchase.currency,
            razorpayOrderId: razorpayOrder.id,
          },
        });

        await tx.auditLog.create({
          data: {
            purchaseId: purchase.id,
            action: "PAYMENT_ORDER_CREATED",
            actorId: purchase.userId,
            details: {
              razorpayOrderId: razorpayOrder.id,
              amountPaise: purchase.totalPaise,
              currency: purchase.currency,
            },
          },
        });

        return createdPayment;
      },
    );

    return res.status(201).json({
      success: true,
      message: "Payment order created",
      payment: {
        id: payment.id,
        orderId: payment.razorpayOrderId,
        amountPaise: payment.amountPaise,
        currency: payment.currency,
        status: payment.status,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Failed to create payment order:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
});

router.post("/:id/verify-payment", async (req, res) => {
  const purchaseId = req.params.id;

  if (!purchaseId) {
    return res.status(400).json({
      success: false,
      message: "Purchase ID is required",
    });
  }

  const parsed = paymentVerificationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment verification request",
      errors: parsed.error.flatten(),
    });
  }

  const {
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
  } = parsed.data;

  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: purchaseId,
      },
      include: {
        payment: true,
        items: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    if (!purchase.payment) {
      return res.status(409).json({
        success: false,
        message: "Payment record not found",
      });
    }

    const storedOrderId = purchase.payment.razorpayOrderId;

    if (!storedOrderId) {
      return res.status(409).json({
        success: false,
        message: "Razorpay order ID is missing",
      });
    }

    if (razorpayOrderId && storedOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "Payment order ID does not match the purchase",
      });
    }

    const calculatedTotal = calculateItemsTotal(purchase.items);

    if (calculatedTotal !== purchase.totalPaise) {
      return res.status(409).json({
        success: false,
        message: "Purchase total does not match its items",
      });
    }

    if (purchase.payment.amountPaise !== purchase.totalPaise) {
      return res.status(409).json({
        success: false,
        message: "Payment amount does not match purchase total",
      });
    }

    if (purchase.payment.status === "CAPTURED") {
      return res.status(200).json({
        success: true,
        message: "Payment already confirmed",
        payment: {
          status: purchase.payment.status,
          razorpayPaymentId: purchase.payment.razorpayPaymentId,
        },
        purchase: {
          id: purchase.id,
          status: purchase.status,
          paidAt: purchase.paidAt,
        },
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Payment verification is not configured",
      });
    }

    let verifiedBySignature = false;
    let razorpayStatus: string | undefined;

    if (razorpaySignature) {
      const targetOrderId = razorpayOrderId || storedOrderId;
      verifiedBySignature = verifySignature(
        targetOrderId,
        razorpayPaymentId,
        razorpaySignature,
        keySecret,
      );
    }

    if (!verifiedBySignature) {
      try {
        const razorpayPayment = await razorpay.payments.fetch(
          razorpayPaymentId,
        );

        if (!razorpayPayment || razorpayPayment.id !== razorpayPaymentId) {
          return res.status(400).json({
            success: false,
            message: "Payment ID could not be verified",
          });
        }

        if (razorpayPayment.order_id && razorpayPayment.order_id !== storedOrderId) {
          await prisma.auditLog.create({
            data: {
              purchaseId: purchase.id,
              action: "PAYMENT_FAILED",
              actorId: purchase.userId,
              details: {
                reason: "PAYMENT_ORDER_MISMATCH",
                razorpayPaymentId,
                storedOrderId,
                razorpayOrderId: razorpayPayment.order_id ?? null,
              },
            },
          });

          return res.status(400).json({
            success: false,
            message: "Payment does not belong to this order",
          });
        }

        if (razorpayPayment.amount !== purchase.totalPaise) {
          await prisma.auditLog.create({
            data: {
              purchaseId: purchase.id,
              action: "PAYMENT_FAILED",
              actorId: purchase.userId,
              details: {
                reason: "PAYMENT_AMOUNT_MISMATCH",
                razorpayPaymentId,
                expectedAmount: purchase.totalPaise,
                receivedAmount: razorpayPayment.amount,
              },
            },
          });

          return res.status(400).json({
            success: false,
            message: "Payment amount does not match purchase total",
          });
        }

        if (razorpayPayment.currency !== purchase.currency) {
          await prisma.auditLog.create({
            data: {
              purchaseId: purchase.id,
              action: "PAYMENT_FAILED",
              actorId: purchase.userId,
              details: {
                reason: "PAYMENT_CURRENCY_MISMATCH",
                razorpayPaymentId,
                expectedCurrency: purchase.currency,
                receivedCurrency: razorpayPayment.currency,
              },
            },
          });

          return res.status(400).json({
            success: false,
            message: "Payment currency does not match purchase currency",
          });
        }

        razorpayStatus = razorpayPayment.status;

        if (razorpayStatus !== "authorized" && razorpayStatus !== "captured") {
          await prisma.auditLog.create({
            data: {
              purchaseId: purchase.id,
              action: "PAYMENT_FAILED",
              actorId: purchase.userId,
              details: {
                reason: "PAYMENT_NOT_SUCCESSFUL",
                razorpayPaymentId,
                razorpayStatus,
              },
            },
          });

          return res.status(400).json({
            success: false,
            message: `Payment is not successful. Current status: ${razorpayStatus}`,
          });
        }
      } catch (fetchErr) {
        if (razorpaySignature) {
          await prisma.auditLog.create({
            data: {
              purchaseId: purchase.id,
              action: "PAYMENT_FAILED",
              actorId: purchase.userId,
              details: {
                reason: "INVALID_SIGNATURE_AND_FETCH_FAILED",
                razorpayOrderId: razorpayOrderId || storedOrderId,
                razorpayPaymentId,
              },
            },
          });

          return res.status(400).json({
            success: false,
            message: "Payment signature verification failed",
          });
        }
        throw fetchErr;
      }
    }

    const shouldCapture = verifiedBySignature || razorpayStatus === "captured";

    const updated = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const updatedPayment = await tx.payment.update({
          where: {
            purchaseId: purchase.id,
          },
          data: {
            status: shouldCapture ? "CAPTURED" : "AUTHORIZED",
            razorpayPaymentId,
            ...(shouldCapture ? { capturedAt: new Date() } : {}),
          },
        });

        const updatedPurchase = await tx.purchase.update({
          where: {
            id: purchase.id,
          },
          data: {
            status: shouldCapture ? "PAID" : "PAYMENT_PROCESSING",
            ...(shouldCapture ? { paidAt: new Date() } : {}),
            auditLogs: {
              create: {
                action: "PAYMENT_CONFIRMED",
                actorId: purchase.userId,
                details: {
                  razorpayOrderId: storedOrderId,
                  razorpayPaymentId,
                  verification: verifiedBySignature
                    ? "SIGNATURE_VALID"
                    : "SERVER_SIDE_PAYMENT_FETCH",
                  razorpayStatus: razorpayStatus ?? (verifiedBySignature ? "captured" : null),
                },
              },
            },
          },
        });

        return {
          payment: updatedPayment,
          purchase: updatedPurchase,
        };
      },
    );

    return res.status(200).json({
      success: true,
      message: shouldCapture
        ? "Payment verified and captured"
        : "Payment signature verified",
      payment: {
        id: updated.payment.id,
        status: updated.payment.status,
        razorpayOrderId: updated.payment.razorpayOrderId,
        razorpayPaymentId: updated.payment.razorpayPaymentId,
      },
      purchase: {
        id: updated.purchase.id,
        status: updated.purchase.status,
        paidAt: updated.purchase.paidAt,
      },
    });
  } catch (error) {
    console.error("Failed to verify payment:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
});

export default router;