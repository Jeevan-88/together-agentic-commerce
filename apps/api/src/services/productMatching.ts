import type { Product, Merchant } from "../../generated/prisma/client.js";

type ProductWithMerchant = Product & {
  merchant: Merchant;
};

export type ProductMatch = {
  product: {
    id: string;
    name: string;
    description: string | null;
    pricePaise: number;
    currency: string;
    merchant: string;
    metadata: unknown;
  };
  score: number;
  reasons: string[];
  matchedCriteria: string[];
};

type ParsedRequest = {
  budgetPaise?: number;
  quantity: number;
  capacityLitres?: number;
  maxWeightKg?: number;
  keywords: string[];
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBudget(text: string): number | undefined {
  const normalized = normalizeText(text);

  const patterns = [
    /(?:under|below|less than|within|upto|up to|max(?:imum)?)[^\d]{0,10}(\d+(?:\.\d+)?)\s*(k|thousand)?/,
    /(?:₹|rs|inr)\s*(\d+(?:\.\d+)?)\s*(k|thousand)?/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);

    if (!match) {
      continue;
    }

    let amount = Number(match[1]);

    if (!Number.isFinite(amount)) {
      continue;
    }

    if (match[2] === "k" || match[2] === "thousand") {
      amount *= 1000;
    }

    return Math.round(amount * 100);
  }

  return undefined;
}

function extractQuantity(text: string): number {
  const normalized = normalizeText(text);

  const match = normalized.match(
    /(?:need|want|buy|get|order|for)\s+(\d+)\s+(?:units?|items?|pieces?|bags?|packs?|people|persons?)/,
  );

  if (!match) {
    return 1;
  }

  const quantity = Number(match[1]);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return 1;
  }

  return Math.min(quantity, 20);
}

function extractCapacity(text: string): number | undefined {
  const normalized = normalizeText(text);

  const match = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:l|litre|litres|liter|liters)\b/,
  );

  if (!match) {
    return undefined;
  }

  const capacity = Number(match[1]);

  return Number.isFinite(capacity) ? capacity : undefined;
}

function extractWeight(text: string): number | undefined {
  const normalized = normalizeText(text);

  const match = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram|kilograms)\b/,
  );

  if (!match) {
    return undefined;
  }

  const weight = Number(match[1]);

  return Number.isFinite(weight) ? weight : undefined;
}

function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);

  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "have",
    "has",
    "want",
    "need",
    "looking",
    "buy",
    "get",
    "find",
    "please",
    "can",
    "you",
    "something",
    "under",
    "below",
    "less",
    "than",
    "within",
    "upto",
    "maximum",
    "max",
    "price",
    "budget",
    "rupees",
    "rs",
    "inr",
    "around",
    "about",
  ]);

  return [
    ...new Set(
      normalized
        .split(" ")
        .filter((word) => word.length >= 3)
        .filter((word) => !stopWords.has(word))
        .filter((word) => !/^\d+$/.test(word)),
    ),
  ];
}

function parseRequest(requestText: string): ParsedRequest {
  return {
    budgetPaise: extractBudget(requestText),
    quantity: extractQuantity(requestText),
    capacityLitres: extractCapacity(requestText),
    maxWeightKg: extractWeight(requestText),
    keywords: extractKeywords(requestText),
  };
}

function metadataValue(
  metadata: unknown,
  key: string,
): string | number | boolean | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const value = (metadata as Record<string, unknown>)[key];

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return undefined;
}

function productSearchText(product: ProductWithMerchant): string {
  const metadata =
    product.metadata && typeof product.metadata === "object"
      ? JSON.stringify(product.metadata)
      : "";

  return normalizeText(
    [
      product.name,
      product.description ?? "",
      product.merchant.name,
      metadata,
    ].join(" "),
  );
}

function scoreProduct(
  product: ProductWithMerchant,
  request: ParsedRequest,
): ProductMatch {
  const searchText = productSearchText(product);

  let score = 0;

  const reasons: string[] = [];
  const matchedCriteria: string[] = [];

  if (request.budgetPaise !== undefined) {
    if (product.pricePaise <= request.budgetPaise) {
      score += 30;
      matchedCriteria.push("within budget");
      reasons.push("The price is within your stated budget.");
    } else {
      score -= 35;
      reasons.push("The price is above your stated budget.");
    }
  }

  if (request.capacityLitres !== undefined) {
    const capacity = metadataValue(product.metadata, "capacityLitres");

    if (typeof capacity === "number") {
      if (capacity >= request.capacityLitres) {
        score += 25;
        matchedCriteria.push("capacity");
        reasons.push(
          `It has ${capacity}L capacity, meeting your ${request.capacityLitres}L requirement.`,
        );
      } else {
        score -= 20;
        reasons.push(
          `Its ${capacity}L capacity is below your ${request.capacityLitres}L requirement.`,
        );
      }
    }
  }

  if (request.maxWeightKg !== undefined) {
    const weight = metadataValue(product.metadata, "weightKg");

    if (typeof weight === "number") {
      if (weight <= request.maxWeightKg) {
        score += 20;
        matchedCriteria.push("weight");
        reasons.push(
          `Its ${weight}kg weight is within your ${request.maxWeightKg}kg limit.`,
        );
      } else {
        score -= 15;
        reasons.push(
          `Its ${weight}kg weight is above your ${request.maxWeightKg}kg limit.`,
        );
      }
    }
  }

  let keywordMatches = 0;

  for (const keyword of request.keywords) {
    if (searchText.includes(keyword)) {
      keywordMatches += 1;
    }
  }

  if (keywordMatches > 0) {
    const keywordScore = Math.min(keywordMatches * 8, 25);

    score += keywordScore;
    matchedCriteria.push("request keywords");

    reasons.push(
      `It matches ${keywordMatches} part${keywordMatches === 1 ? "" : "s"} of your request.`,
    );
  }

  const totalPricePaise = product.pricePaise * request.quantity;

  if (
    request.budgetPaise !== undefined &&
    totalPricePaise <= request.budgetPaise
  ) {
    score += 10;
    matchedCriteria.push("total quantity within budget");

    reasons.push(
      `Buying ${request.quantity} item${request.quantity === 1 ? "" : "s"} stays within the stated budget.`,
    );
  }

  if (request.budgetPaise === undefined) {
    score += 5;
    reasons.push(
      "No price limit was specified, so the other requirements were used for comparison.",
    );
  }

  return {
    product: {
      id: product.id,
      name: product.name,
      description: product.description,
      pricePaise: product.pricePaise,
      currency: product.currency,
      merchant: product.merchant.name,
      metadata: product.metadata,
    },
    score: Math.max(0, Math.min(100, score)),
    reasons: [...new Set(reasons)],
    matchedCriteria: [...new Set(matchedCriteria)],
  };
}

export function matchProducts(
  products: ProductWithMerchant[],
  requestText: string,
): {
  request: ParsedRequest;
  matches: ProductMatch[];
} {
  const request = parseRequest(requestText);

  const matches = products
    .map((product) => scoreProduct(product, request))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.product.pricePaise - b.product.pricePaise;
    });

  return {
    request,
    matches,
  };
}