"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ProductMetadata = {
  imageUrl?: string;
  category?: string;
  originalPricePaise?: number;
  discountPercent?: number;
  rating?: number;
  reviewsCount?: number;
  capacity?: string;
  weight?: string;
  feature?: string;
  keywords?: string[];
  [key: string]: unknown;
};

type Product = {
  id: string;
  name: string;
  description?: string | null;
  merchant: string | {
    id: string;
    name: string;
    slug: string;
    active: boolean;
  };
  pricePaise: number;
  metadata?: ProductMetadata | null;
};

type RecommendationMatch = {
  product: Product;
  score: number;
  reasons: string[];
  matchedCriteria: string[];
};

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const request = searchParams.get("request") || "";
  const mode = searchParams.get("mode") || "solo";
  const groupId = searchParams.get("groupId") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [recommendation, setRecommendation] = useState<RecommendationMatch | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = ["All", "Bags", "Audio", "Wearables", "Footwear", "Tech"];

  useEffect(() => {
    async function loadCatalogAndRecommendations() {
      try {
        setLoading(true);
        setError("");

        // 1. Fetch entire active catalog
        const productsResponse = await fetch(`${API_URL}/api/products`);
        const productsData = await productsResponse.json();

        if (!productsResponse.ok) {
          throw new Error(productsData.message || "Unable to load products");
        }

        const allProducts: Product[] = productsData.products || [];
        setProducts(allProducts);

        // 2. If request text is provided, fetch scored recommendations
        if (request && request.trim().length >= 3) {
          try {
            const recResponse = await fetch(`${API_URL}/api/products/recommendations`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ requestText: request.trim() }),
            });
            const recData = await recResponse.json();
            if (recResponse.ok && recData.recommendation) {
              setRecommendation(recData.recommendation);
            }
          } catch (e) {
            console.error("Failed to fetch recommendation:", e);
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Unable to load product catalog",
        );
      } finally {
        setLoading(false);
      }
    }

    loadCatalogAndRecommendations();
  }, [request]);

  function handleChoose(product: Product) {
    const merchantName =
      typeof product.merchant === "string"
        ? product.merchant
        : product.merchant?.name || "Merchant";

    const params = new URLSearchParams();
    params.set("productId", product.id);
    params.set("product", product.name);
    params.set("merchant", merchantName);
    params.set("pricePaise", String(product.pricePaise));
    params.set(
      "price",
      `₹${(product.pricePaise / 100).toLocaleString("en-IN")}`,
    );
    params.set("request", request || "Direct catalog purchase");
    params.set("mode", mode);

    if (mode === "group" && groupId) {
      params.set("groupId", groupId);
    }

    if (product.metadata?.imageUrl) {
      params.set("imageUrl", product.metadata.imageUrl);
    }
    if (product.metadata?.originalPricePaise) {
      params.set("originalPricePaise", String(product.metadata.originalPricePaise));
    }
    if (product.metadata?.discountPercent) {
      params.set("discountPercent", String(product.metadata.discountPercent));
    }
    if (product.metadata?.category) {
      params.set("category", product.metadata.category);
    }
    if (product.metadata?.rating) {
      params.set("rating", String(product.metadata.rating));
    }

    router.push(`/shop/proposal?${params.toString()}`);
  }

  // Filter products by selected category
  const filteredProducts = products.filter((p) => {
    if (activeCategory === "All") return true;
    const cat = p.metadata?.category;
    return cat?.toLowerCase() === activeCategory.toLowerCase();
  });

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-10">
        <Header currentStep="Catalog & Matching" />

        <div className="py-10">
          {/* Header row with back button and title */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/shop?${new URLSearchParams({ mode, ...(groupId ? { groupId } : {}) }).toString()}`}
                className="oval-pill-btn mb-3 border-black/20 bg-white text-[10px] text-black/60 transition hover:border-black hover:text-black"
              >
                &larr; Back to Search
              </Link>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Product Catalog & Recommendations
              </h1>
              <p className="mt-1 text-sm text-black/60">
                Explore real products with real-time discounts, verified pricing, and instant Razorpay checkout.
              </p>
            </div>

            {/* Shopping context tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="oval-pill-btn border-black bg-black text-white text-[11px]">
                {mode === "group" ? "Group Shopping" : "Solo Shopping"}
              </span>
              {mode === "group" && groupId && (
                <span className="oval-pill-btn border-black/20 bg-white text-black text-[11px]">
                  Group Connected
                </span>
              )}
            </div>
          </div>

          {/* Active Query Banner with Monochrome Gradient & Full Height Splitting Black Circle Animation */}
          {request && (
            <div className="gemini-monochrome-card relative mb-8 overflow-hidden">
              {/* Full Height Splitting Black Circles */}
              <span className="animate-split-left absolute top-1/2 h-12 w-12 rounded-full bg-black shadow-xl z-0 pointer-events-none sm:h-14 sm:w-14" />
              <span className="animate-split-right absolute top-1/2 h-12 w-12 rounded-full bg-black shadow-xl z-0 pointer-events-none sm:h-14 sm:w-14" />

              <div className="gemini-rainbow-inner relative z-10 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/45">
                    Evaluated Intent
                  </span>
                  <p className="text-sm font-extrabold text-slate-950">
                    &ldquo;{request}&rdquo;
                  </p>
                </div>

                {recommendation && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="oval-pill-btn border-black/20 bg-white text-slate-900 text-[11px] font-bold shadow-sm">
                      Top Match: {recommendation.score}% Match
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Filter Pills (Oval Pill Format) */}
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-black/40 mr-1 shrink-0">
              Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`oval-pill-btn text-xs shrink-0 transition ${
                  activeCategory === cat
                    ? "border-black bg-black text-white shadow-sm"
                    : "border-black/15 bg-white text-black/70 hover:border-black hover:text-black"
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="ml-auto text-xs text-black/45 font-medium shrink-0">
              Showing {filteredProducts.length} items
            </span>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="surface-inset rounded-3xl p-16 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
              <p className="mt-4 text-sm font-semibold text-black/60">
                Matching catalog with real-time discounts...
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              <p className="font-semibold">Unable to load catalog</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="oval-pill-btn mt-4 border-red-700 bg-red-700 text-white text-xs"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredProducts.length === 0 && (
            <div className="surface-inset rounded-3xl p-16 text-center">
              <p className="text-base font-semibold">No products in this category</p>
              <p className="mt-2 text-sm text-black/50">
                Try selecting &ldquo;All&rdquo; to browse the full catalog.
              </p>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && filteredProducts.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => {
                const merchantName =
                  typeof product.merchant === "string"
                    ? product.merchant
                    : product.merchant?.name || "Merchant";

                const metadata = product.metadata || {};
                const imageUrl = metadata.imageUrl || "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80";
                const originalPricePaise = metadata.originalPricePaise;
                const discountPercent = metadata.discountPercent;
                const rating = metadata.rating || 4.8;
                const reviewsCount = metadata.reviewsCount || 120;
                const category = metadata.category || "Commerce";

                const isTopMatch = recommendation && recommendation.product.id === product.id;

                return (
                  <article
                    key={product.id}
                    className={`surface-card surface-card-interactive flex flex-col justify-between overflow-hidden rounded-3xl border transition ${
                      isTopMatch ? "ring-2 ring-blue-500 shadow-lg" : "border-black/10"
                    }`}
                  >
                    <div>
                      {/* Product Image Container */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                        <img
                          src={imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover transition duration-300 hover:scale-105"
                          loading="lazy"
                        />

                        {/* Badges on Image */}
                        <div className="absolute left-3 top-3 flex items-center gap-1.5">
                          <span className="rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                            {category}
                          </span>
                          {discountPercent && (
                            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase text-white shadow-sm">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </div>

                        {isTopMatch && (
                          <div className="absolute right-3 top-3">
                            <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md">
                              AI Best Match
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="p-6">
                        <div className="flex items-center justify-between text-xs text-black/50">
                          <span className="font-semibold uppercase tracking-wider text-slate-700">
                            {merchantName}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-amber-600">
                            ★ {rating} <span className="text-black/35 font-normal">({reviewsCount})</span>
                          </span>
                        </div>

                        <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                          {product.name}
                        </h2>

                        {product.description && (
                          <p className="mt-2 text-xs leading-relaxed text-black/60 line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        {/* Price Display */}
                        <div className="mt-4 flex items-baseline gap-2.5">
                          <span className="text-2xl font-extrabold text-slate-950">
                            ₹{(product.pricePaise / 100).toLocaleString("en-IN")}
                          </span>
                          {originalPricePaise && (
                            <span className="text-xs text-black/40 line-through">
                              ₹{(originalPricePaise / 100).toLocaleString("en-IN")}
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-black/50">
                            Test Checkout
                          </span>
                        </div>

                        {/* Specs & Highlights */}
                        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-black/5 pt-3">
                          {metadata.capacity && (
                            <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] text-black/70">
                              {metadata.capacity}
                            </span>
                          )}
                          {metadata.weight && (
                            <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] text-black/70">
                              {metadata.weight}
                            </span>
                          )}
                          {metadata.feature && (
                            <span className="rounded-md bg-black/5 px-2 py-0.5 text-[11px] text-black/70">
                              {metadata.feature}
                            </span>
                          )}
                        </div>

                        {/* Match Reasons if available */}
                        {isTopMatch && recommendation.reasons?.length > 0 && (
                          <div className="mt-3.5 rounded-xl bg-blue-50/70 p-2.5 text-[11px] text-blue-900">
                            <span className="font-bold uppercase tracking-wider">Match Reason: </span>
                            {recommendation.reasons[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Choose Button in Oval Pill */}
                    <div className="p-6 pt-0">
                      <button
                        type="button"
                        onClick={() => handleChoose(product)}
                        className="oval-pill-btn w-full border-black bg-black py-3 text-xs font-bold text-white shadow-sm transition hover:bg-black/80"
                      >
                        Choose this product &rarr;
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
          <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
            <p className="text-sm text-black/50">Loading catalog results...</p>
          </div>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
