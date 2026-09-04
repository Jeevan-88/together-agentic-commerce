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
    originalPricePaise?: number | null;
    imageUrl?: string | null;
    productUrl?: string | null;
    category?: string | null;
    rating?: number | null;
    reviewsCount?: number | null;
    currency: string;
    merchant: string;
    metadata: unknown;
  };
  score: number;
  reasons: string[];
  matchedCriteria: string[];
  budgetAnalysis: {
    statedBudgetPaise: number | null;
    itemPricePaise: number;
    exceedsBudget: boolean;
    differencePaise: number;
    budgetText: string;
  };
  matchedKeywords: string[];
};

type ParsedRequest = {
  budgetPaise?: number;
  quantity: number;
  capacityLitres?: number;
  maxWeightKg?: number;
  keywords: string[];
  intents?: {
    preferCheaper: boolean;
    preferBestRated: boolean;
    preferLightweight: boolean;
  };
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBudget(text: string): number | undefined {
  const patterns = [
    /(?:under|below|less than|within|upto|up to|max(?:imum)?)[^\d]{0,10}([\d,]+(?:\.\d+)?)\s*(k|thousand)?/i,
    /(?:₹|rs|inr)\s*([\d,]+(?:\.\d+)?)\s*(k|thousand)?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (!match) {
      continue;
    }

    const raw = match[1].replace(/,/g, "");
    let amount = Number(raw);

    if (!Number.isFinite(amount)) {
      continue;
    }

    if (
      match[2]?.toLowerCase() === "k" ||
      match[2]?.toLowerCase() === "thousand"
    ) {
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

function extractIntents(text: string): {
  preferCheaper: boolean;
  preferBestRated: boolean;
  preferLightweight: boolean;
} {
  const normalized = normalizeText(text);
  return {
    preferCheaper: /\b(cheap|cheaper|cheapest|budget|affordable|low price|lowest price|economic|economical|value)\b/i.test(
      normalized,
    ),
    preferBestRated: /\b(best|best rated|top rated|highest rated|popular|top|rated|five star|5 star)\b/i.test(
      normalized,
    ),
    preferLightweight: /\b(light|lightweight|featherlight|easy to carry|portable|ultralight)\b/i.test(
      normalized,
    ),
  };
}

function parseRequest(requestText: string): ParsedRequest {
  return {
    budgetPaise: extractBudget(requestText),
    quantity: extractQuantity(requestText),
    capacityLitres: extractCapacity(requestText),
    maxWeightKg: extractWeight(requestText),
    keywords: extractKeywords(requestText),
    intents: extractIntents(requestText),
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

function resolveProductCapacity(metadata: unknown): number | undefined {
  const capLitres = metadataValue(metadata, "capacityLitres");
  if (typeof capLitres === "number") return capLitres;
  const capStr = metadataValue(metadata, "capacity");
  if (typeof capStr === "string") {
    const m = capStr.match(/(\d+(?:\.\d+)?)\s*(?:l|litre|litres|liter|liters)?/i);
    if (m) {
      const val = Number(m[1]);
      if (Number.isFinite(val)) return val;
    }
  }
  return undefined;
}

function resolveProductWeight(metadata: unknown): number | undefined {
  const wtKg = metadataValue(metadata, "weightKg");
  if (typeof wtKg === "number") return wtKg;
  const wtStr = metadataValue(metadata, "weight");
  if (typeof wtStr === "string") {
    const m = wtStr.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilogram|kilograms)?/i);
    if (m) {
      const val = Number(m[1]);
      if (Number.isFinite(val)) return val;
    }
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
      product.category ?? "",
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
    const capacity = resolveProductCapacity(product.metadata);

    if (capacity !== undefined) {
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
    const weight = resolveProductWeight(product.metadata);

    if (weight !== undefined) {
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
    const keywordScore = Math.min(keywordMatches * 15, 50);

    score += keywordScore;
    matchedCriteria.push("request keywords");

    reasons.push(
      `It matches ${keywordMatches} part${keywordMatches === 1 ? "" : "s"} of your request.`,
    );
  }

  const rating =
    product.rating ??
    (typeof metadataValue(product.metadata, "rating") === "number"
      ? (metadataValue(product.metadata, "rating") as number)
      : undefined);

  if (typeof rating === "number") {
    score += Math.round(rating * 3);
  }

  if (request.intents?.preferCheaper) {
    const originalPrice =
      product.originalPricePaise ??
      metadataValue(product.metadata, "originalPricePaise");
    if (typeof originalPrice === "number" && originalPrice > product.pricePaise) {
      score += 20;
      matchedCriteria.push("high discount value");
      reasons.push("Prioritized for competitive discount and value pricing.");
    } else {
      score += 10;
      reasons.push("Identified as an economical option for budget-conscious shopping.");
    }
  }

  if (request.intents?.preferBestRated) {
    if (typeof rating === "number" && rating >= 4.7) {
      score += 25;
      matchedCriteria.push("top rated");
      reasons.push(`Ranked highly with an outstanding customer rating (★ ${rating}).`);
    }
  }

  if (request.intents?.preferLightweight) {
    const weight = resolveProductWeight(product.metadata);
    if (weight !== undefined && weight <= 1.2) {
      score += 20;
      matchedCriteria.push("lightweight");
      reasons.push(`Lightweight construction (${weight}kg) optimized for portable use.`);
    }
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

  const matchedKeywordsList = request.keywords.filter((kw) =>
    searchText.includes(kw),
  );

  const statedBudgetPaise = request.budgetPaise ?? null;
  const itemPricePaise = product.pricePaise;
  let exceedsBudget = false;
  let differencePaise = 0;
  let budgetText = "No budget specified";

  if (statedBudgetPaise !== null) {
    exceedsBudget = itemPricePaise > statedBudgetPaise;
    differencePaise = itemPricePaise - statedBudgetPaise;
    if (exceedsBudget) {
      const diffFormatted = `₹${(Math.abs(differencePaise) / 100).toLocaleString("en-IN")}`;
      budgetText = `Exceeds Budget (by ${diffFormatted})`;
    } else {
      const underFormatted = `₹${(Math.abs(differencePaise) / 100).toLocaleString("en-IN")}`;
      budgetText = `Within Budget (${underFormatted} under limit)`;
    }
  }

  return {
    product: {
      id: product.id,
      name: product.name,
      description: product.description,
      pricePaise: product.pricePaise,
      originalPricePaise: product.originalPricePaise,
      imageUrl: product.imageUrl,
      productUrl: product.productUrl,
      category: product.category,
      rating: product.rating,
      reviewsCount: product.reviewsCount,
      currency: product.currency,
      merchant: product.merchant.name,
      metadata: product.metadata,
    },
    score: Math.max(0, Math.min(100, score)),
    reasons: [...new Set(reasons)],
    matchedCriteria: [...new Set(matchedCriteria)],
    budgetAnalysis: {
      statedBudgetPaise,
      itemPricePaise,
      exceedsBudget,
      differencePaise,
      budgetText,
    },
    matchedKeywords: matchedKeywordsList,
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