import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { matchProducts } from "../services/productMatching.js";

const router = Router();

const recommendationSchema = z.object({
  requestText: z
    .string()
    .trim()
    .min(3, "Request must contain at least 3 characters")
    .max(500, "Request is too long"),
});

router.get("/", async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        merchant: {
          active: true,
        },
      },
      include: {
        merchant: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("Product listing failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load products",
    });
  }
});

router.post("/recommendations", async (req, res) => {
  const parsed = recommendationSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid request",
    });

    return;
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        merchant: {
          active: true,
        },
      },
      include: {
        merchant: true,
      },
    });

    const result = matchProducts(products, parsed.data.requestText);

    res.json({
      success: true,
      request: {
        text: parsed.data.requestText,
        quantity: result.request.quantity,
        budgetPaise: result.request.budgetPaise ?? null,
        capacityLitres: result.request.capacityLitres ?? null,
        maxWeightKg: result.request.maxWeightKg ?? null,
        keywords: result.request.keywords,
      },
      recommendation: result.matches[0] ?? null,
      alternatives: result.matches.slice(1),
    });
  } catch (error) {
    console.error("Product recommendation failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to evaluate products",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: req.params.id,
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
      res.status(404).json({
        success: false,
        message: "Product not found",
      });

      return;
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Product lookup failed:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load product",
    });
  }
});

export default router;