import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/purchases/:purchaseId", async (req, res) => {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: {
        id: req.params.purchaseId,
      },
      include: {
        items: true,
        approval: true,
        payment: true,
        group: {
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        },
        auditLogs: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    return res.json({
      success: true,
      purchase: {
        id: purchase.id,
        mode: purchase.mode,
        status: purchase.status,
        totalPaise: purchase.totalPaise,
        currency: purchase.currency,
        requestText: purchase.requestText,
        approvedAt: purchase.approvedAt,
        paidAt: purchase.paidAt,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
        items: purchase.items,
        approval: purchase.approval,
        payment: purchase.payment
          ? {
              id: purchase.payment.id,
              status: purchase.payment.status,
              amountPaise: purchase.payment.amountPaise,
              currency: purchase.payment.currency,
              razorpayOrderId: purchase.payment.razorpayOrderId,
              razorpayPaymentId: purchase.payment.razorpayPaymentId,
              capturedAt: purchase.payment.capturedAt,
              createdAt: purchase.payment.createdAt,
              updatedAt: purchase.payment.updatedAt,
            }
          : null,
        group: purchase.group
          ? {
              id: purchase.group.id,
              name: purchase.group.name,
              members: purchase.group.members.map(
                (
                  membership: (typeof purchase.group.members)[number],
                ) => ({
                  id: membership.user.id,
                  name: membership.user.name,
                  email: membership.user.email,
                  role: membership.role,
                }),
              ),
            }
          : null,
      },
      audit: purchase.auditLogs.map(
        (log: (typeof purchase.auditLogs)[number]) => ({
          id: log.id,
          action: log.action,
          actorId: log.actorId,
          details: log.details,
          createdAt: log.createdAt,
        }),
      ),
    });
  } catch (error) {
    console.error("Failed to fetch purchase audit:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase status",
    });
  }
});

export default router;