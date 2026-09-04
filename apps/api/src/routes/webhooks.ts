import crypto from "node:crypto";
import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

const router = Router();

router.post("/razorpay", async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    console.log("Webhook secret loaded:", Boolean(secret));
console.log("Webhook secret length:", secret?.length ?? 0);
console.log(
  "Webhook secret fingerprint:",
  secret
    ? crypto.createHash("sha256").update(secret).digest("hex").slice(0, 12)
    : "missing",
);

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay webhook secret is not configured",
      });
    }

    const signature = req.header("X-Razorpay-Signature");
    const eventId = req.header("x-razorpay-event-id");

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay webhook signature",
      });
    }

    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay event ID",
      });
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Webhook body must be received as raw data",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    const receivedSignature = Buffer.from(signature, "utf8");
    const calculatedSignature = Buffer.from(expectedSignature, "utf8");
    console.log("Webhook signature received:", signature);
console.log("Webhook signature calculated:", expectedSignature);
console.log("Webhook body length:", req.body.length);
    if (
      receivedSignature.length !== calculatedSignature.length ||
      !crypto.timingSafeEqual(receivedSignature, calculatedSignature)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const payload = JSON.parse(req.body.toString("utf8")) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            order_id?: string;
            amount?: number;
            currency?: string;
            status?: string;
          };
        };
      };
    };

    const eventType = payload.event;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: "Missing webhook event type",
      });
    }

    const paymentEntity = payload.payload?.payment?.entity;

    const razorpayPaymentId = paymentEntity?.id;
    const razorpayOrderId = paymentEntity?.order_id;

    let paymentRecord = null;

    if (razorpayOrderId) {
      paymentRecord = await prisma.payment.findUnique({
        where: {
          razorpayOrderId,
        },
        include: {
          purchase: true,
        },
      });
    }

    if (paymentRecord?.purchaseId) {
      await prisma.auditLog.create({
        data: {
          purchaseId: paymentRecord.purchaseId,
          action: "WEBHOOK_RECEIVED",
          details: {
            eventId,
            eventType,
            razorpayPaymentId,
            razorpayOrderId,
          },
        },
      });
    }

    try {
      await prisma.webhookEvent.create({
        data: {
          eventId,
          eventType,
          payloadHash: crypto
            .createHash("sha256")
            .update(req.body)
            .digest("hex"),
        },
      });
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes("unique")
      ) {
        if (paymentRecord?.purchaseId) {
          await prisma.auditLog.create({
            data: {
              purchaseId: paymentRecord.purchaseId,
              action: "WEBHOOK_DUPLICATE",
              details: {
                eventId,
                eventType,
                razorpayPaymentId,
                razorpayOrderId,
              },
            },
          });
        }

        return res.status(200).json({
          success: true,
          duplicate: true,
          message: "Webhook already processed",
        });
      }

      throw error;
    }

    if (!paymentRecord) {
      await prisma.webhookEvent.update({
        where: {
          eventId,
        },
        data: {
          processedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        ignored: true,
        message: "No matching payment found",
      });
    }

    if (
      paymentEntity?.amount !== undefined &&
      paymentEntity.amount !== paymentRecord.amountPaise
    ) {
      await prisma.auditLog.create({
        data: {
          purchaseId: paymentRecord.purchaseId,
          action: "PAYMENT_FAILED",
          details: {
            reason: "Webhook amount does not match purchase amount",
            expectedAmount: paymentRecord.amountPaise,
            receivedAmount: paymentEntity.amount,
            eventId,
          },
        },
      });

      return res.status(400).json({
        success: false,
        message: "Webhook amount does not match payment amount",
      });
    }

    if (
      paymentEntity?.currency &&
      paymentEntity.currency !== paymentRecord.currency
    ) {
      await prisma.auditLog.create({
        data: {
          purchaseId: paymentRecord.purchaseId,
          action: "PAYMENT_FAILED",
          details: {
            reason: "Webhook currency does not match purchase currency",
            expectedCurrency: paymentRecord.currency,
            receivedCurrency: paymentEntity.currency,
            eventId,
          },
        },
      });

      return res.status(400).json({
        success: false,
        message: "Webhook currency does not match payment currency",
      });
    }

    if (eventType === "payment.captured") {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) =>  {
        await tx.payment.update({
          where: {
            purchaseId: paymentRecord!.purchaseId,
          },
          data: {
            status: "CAPTURED",
            razorpayPaymentId:
              razorpayPaymentId ?? paymentRecord!.razorpayPaymentId,
            capturedAt: new Date(),
          },
        });

        await tx.purchase.update({
          where: {
            id: paymentRecord!.purchaseId,
          },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            purchaseId: paymentRecord!.purchaseId,
            action: "PAYMENT_CONFIRMED",
            details: {
              source: "razorpay_webhook",
              eventId,
              eventType,
              razorpayPaymentId,
              razorpayOrderId,
            },
          },
        });

        await tx.webhookEvent.update({
          where: {
            eventId,
          },
          data: {
            processedAt: new Date(),
          },
        });
      });
    } else if (eventType === "payment.failed") {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) =>  {
        await tx.payment.update({
          where: {
            purchaseId: paymentRecord!.purchaseId,
          },
          data: {
            status: "FAILED",
            razorpayPaymentId:
              razorpayPaymentId ?? paymentRecord!.razorpayPaymentId,
          },
        });

        await tx.purchase.update({
          where: {
            id: paymentRecord!.purchaseId,
          },
          data: {
            status: "FAILED",
          },
        });

        await tx.auditLog.create({
          data: {
            purchaseId: paymentRecord!.purchaseId,
            action: "PAYMENT_FAILED",
            details: {
              source: "razorpay_webhook",
              eventId,
              eventType,
              razorpayPaymentId,
              razorpayOrderId,
            },
          },
        });

        await tx.webhookEvent.update({
          where: {
            eventId,
          },
          data: {
            processedAt: new Date(),
          },
        });
      });
    } else {
      await prisma.webhookEvent.update({
        where: {
          eventId,
        },
        data: {
          processedAt: new Date(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      event: eventType,
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
});

export default router;