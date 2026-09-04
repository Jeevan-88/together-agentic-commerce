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
  originalPricePaise?: number | null;
  imageUrl?: string | null;
  productUrl?: string | null;
  category?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedForCompare, setSelectedForCompare] = useState<Product[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  function toggleCompare(product: Product) {
    setSelectedForCompare((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 products at a time.");
        return prev;
      }
      return [...prev, product];
    });
  }

  function clearCompare() {
    setSelectedForCompare([]);
    setShowCompareModal(false);
  }

  const categories = ["All", "Bags", "Audio", "Wearables", "Footwear", "Tech"];
  const itemsPerPage = 20;

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

    const imageUrl =
      product.imageUrl ||
      product.metadata?.imageUrl ||
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80";

    const originalPricePaise =
      product.originalPricePaise ??
      product.metadata?.originalPricePaise ??
      Math.round(product.pricePaise * 1.3);

    const discountPercent =
      product.metadata?.discountPercent ??
      (originalPricePaise
        ? Math.round(
            ((originalPricePaise - product.pricePaise) / originalPricePaise) *
              100,
          )
        : null);

    const category =
      product.category || product.metadata?.category || "Commerce";
    const rating = product.rating ?? product.metadata?.rating ?? 4.8;

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

    if (imageUrl) {
      params.set("imageUrl", imageUrl);
    }
    if (originalPricePaise) {
      params.set("originalPricePaise", String(originalPricePaise));
    }
    if (discountPercent) {
      params.set("discountPercent", String(discountPercent));
    }
    if (category) {
      params.set("category", category);
    }
    if (rating) {
      params.set("rating", String(rating));
    }

    router.push(`/shop/proposal?${params.toString()}`);
  }

  // Filter products by selected category
  const filteredProducts = products.filter((p) => {
    if (activeCategory === "All") return true;
    const cat = p.category || p.metadata?.category;
    return cat?.toLowerCase() === activeCategory.toLowerCase();
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Voice Speech Assistant for results page
  const [hasSpoken, setHasSpoken] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const storedMute = localStorage.getItem("together_voice_muted") === "true";
    if (storedMute) setIsMuted(true);
  }, []);

  function toggleMute() {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    localStorage.setItem("together_voice_muted", String(nextMute));
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }

  function speakResultsSummary(productName?: string, priceStr?: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (isMuted) return;
    const text = productName
      ? `I evaluated your request for ${request}. The top recommendation is ${productName} for ${priceStr}. Click any item to select it.`
      : `Here are the top catalog results for ${request}. Click any item to continue.`;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (!request || hasSpoken || loading) return;
    const topItem = recommendation?.product || paginatedProducts[0];
    if (topItem) {
      const priceStr = `₹${(topItem.pricePaise / 100).toLocaleString("en-IN")}`;
      speakResultsSummary(topItem.name, priceStr);
      setHasSpoken(true);
    }
  }, [request, recommendation, paginatedProducts, loading, hasSpoken]);

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

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {recommendation && (
                    <span className="oval-pill-btn border-black/20 bg-white text-slate-900 text-[11px] font-bold shadow-sm">
                      Top Match: {recommendation.score}% Match
                    </span>
                  )}

                  {/* Interactive Mute / Unmute & Voice Assistant Buttons */}
                  <button
                    type="button"
                    onClick={toggleMute}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition shadow-sm ${
                      isMuted
                        ? "border border-red-300 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border border-black/20 bg-white text-slate-900 hover:bg-black hover:text-white"
                    }`}
                    title={isMuted ? "Unmute Voice AI" : "Mute Voice AI"}
                  >
                    {isMuted ? "🔇 Muted" : "🔊 Sound On"}
                  </button>
                </div>
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
                onClick={() => {
                  setActiveCategory(cat);
                  setCurrentPage(1);
                }}
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
              Showing {filteredProducts.length} total items (Page {currentPage} of {totalPages})
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
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProducts.map((product) => {
                const merchantName =
                  typeof product.merchant === "string"
                    ? product.merchant
                    : product.merchant?.name || "Merchant";

                const metadata = product.metadata || {};
                const imageUrl =
                  product.imageUrl ||
                  metadata.imageUrl ||
                  "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80";
                const originalPricePaise =
                  product.originalPricePaise || metadata.originalPricePaise;
                const discountPercent =
                  metadata.discountPercent ||
                  (originalPricePaise
                    ? Math.round(
                        ((originalPricePaise - product.pricePaise) /
                          originalPricePaise) *
                          100,
                      )
                    : null);
                const rating = product.rating || metadata.rating || 4.8;
                const reviewsCount =
                  product.reviewsCount || metadata.reviewsCount || 120;
                const category =
                  product.category || metadata.category || "Commerce";

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

                        {/* Budget Analysis: Exact Price vs Stated Limit (Exceeds: Yes / No) */}
                        {(() => {
                          const budgetMatch = request.match(
                            /(?:under|below|less than|within|upto|up to|max|maximum|₹|rs|inr)[^\d]{0,10}([\d,]+(?:\.\d+)?)\s*(k|thousand)?/i,
                          );
                          if (!budgetMatch) return null;
                          let val = Number(budgetMatch[1].replace(/,/g, ""));
                          if (
                            budgetMatch[2]?.toLowerCase().startsWith("k") ||
                            budgetMatch[2]?.toLowerCase().startsWith("thousand")
                          ) {
                            val *= 1000;
                          }
                          const budgetPaise = val * 100;
                          const exceeds = product.pricePaise > budgetPaise;
                          const diff = Math.abs(product.pricePaise - budgetPaise) / 100;
                          const diffFormatted = `₹${diff.toLocaleString("en-IN")}`;
                          const limitFormatted = `₹${val.toLocaleString("en-IN")}`;

                          return (
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              {exceeds ? (
                                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 shadow-xs">
                                  ⚠️ Exceeds Budget (by {diffFormatted} over {limitFormatted} limit)
                                </span>
                              ) : (
                                <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-900 shadow-xs">
                                  ✓ Within Budget ({diffFormatted} under {limitFormatted} limit)
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Match Reasons if available */}
                        {isTopMatch && recommendation.reasons?.length > 0 && (
                          <div className="mt-3.5 rounded-xl bg-blue-50/70 p-2.5 text-[11px] text-blue-900">
                            <span className="font-bold uppercase tracking-wider">Match Reason: </span>
                            {recommendation.reasons[0]}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons: Compare + Choose in Oval Pill */}
                    <div className="p-6 pt-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCompare(product)}
                        aria-pressed={selectedForCompare.some((p) => p.id === product.id)}
                        className={`oval-pill-btn px-3.5 py-3 text-xs font-bold transition ${
                          selectedForCompare.some((p) => p.id === product.id)
                            ? "border-black bg-black text-white shadow-xs"
                            : "border-black/20 bg-white text-slate-800 hover:border-black hover:bg-black/5"
                        }`}
                        title={
                          selectedForCompare.some((p) => p.id === product.id)
                            ? "Remove from comparison"
                            : "Add to comparison (up to 3)"
                        }
                      >
                        {selectedForCompare.some((p) => p.id === product.id)
                          ? "✓ In Compare"
                          : "+ Compare"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChoose(product)}
                        className="oval-pill-btn flex-1 border-black bg-black py-3 text-xs font-bold text-white shadow-sm transition hover:bg-black/80"
                      >
                        Choose this product &rarr;
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* 5-Page Pagination Control Bar */}
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-black/10 pt-6">
              <p className="text-xs text-black/50 font-medium">
                Showing {(currentPage - 1) * itemsPerPage + 1} &ndash;{" "}
                {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of{" "}
                {filteredProducts.length} items (Page {currentPage} of {totalPages})
              </p>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="oval-pill-btn border-black/15 bg-white px-3 py-1.5 text-xs text-slate-900 transition hover:border-black disabled:opacity-30"
                >
                  &larr; Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`oval-pill-btn h-8 w-8 text-xs font-bold transition ${
                      currentPage === pageNum
                        ? "border-black bg-black text-white shadow-sm"
                        : "border-black/15 bg-white text-black/70 hover:border-black"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="oval-pill-btn border-black/15 bg-white px-3 py-1.5 text-xs text-slate-900 transition hover:border-black disabled:opacity-30"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>

      {/* Floating Sticky Comparison Tray */}
      {selectedForCompare.length > 0 && (
        <aside
          aria-label="Product comparison tray"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 rounded-full border border-black/15 bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-md max-w-[95vw] sm:max-w-xl"
        >
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {selectedForCompare.map((p) => (
              <div
                key={p.id}
                className="relative flex items-center gap-1.5 rounded-full border border-black/10 bg-black/5 px-3 py-1 text-xs font-bold text-slate-900"
              >
                <span className="max-w-[80px] sm:max-w-[120px] truncate">{p.name}</span>
                <button
                  type="button"
                  onClick={() => toggleCompare(p)}
                  className="ml-1 text-black/50 hover:text-black font-black"
                  aria-label={`Remove ${p.name} from comparison`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-l border-black/10 pl-3">
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="oval-pill-btn border-black bg-black px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-black/80 transition"
            >
              Compare ({selectedForCompare.length})
            </button>
            <button
              type="button"
              onClick={clearCompare}
              className="text-xs text-black/50 hover:text-black font-semibold"
            >
              Clear
            </button>
          </div>
        </aside>
      )}

      {/* Side-by-Side Product Comparison Modal */}
      {showCompareModal && selectedForCompare.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="surface-card w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-black/45">
                  Side-by-Side Comparison
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-950">
                  Compare Products ({selectedForCompare.length} selected)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCompareModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-sm font-bold text-black/60 hover:bg-black/10 transition"
                aria-label="Close comparison modal"
              >
                ✕
              </button>
            </div>

            {/* Side-by-side Table/Grid */}
            {(() => {
              const lowestPrice = Math.min(
                ...selectedForCompare.map((p) => p.pricePaise)
              );
              const highestRating = Math.max(
                ...selectedForCompare.map(
                  (p) => p.rating || p.metadata?.rating || 0
                )
              );

              return (
                <div
                  className={`mt-6 grid gap-6 ${
                    selectedForCompare.length === 2
                      ? "grid-cols-1 md:grid-cols-2"
                      : "grid-cols-1 md:grid-cols-3"
                  }`}
                >
                  {selectedForCompare.map((p) => {
                    const merchantName =
                      typeof p.merchant === "string"
                        ? p.merchant
                        : p.merchant?.name || "Merchant";
                    const imageUrl =
                      p.imageUrl ||
                      p.metadata?.imageUrl ||
                      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80";
                    const originalPricePaise =
                      p.originalPricePaise ??
                      p.metadata?.originalPricePaise ??
                      Math.round(p.pricePaise * 1.3);
                    const discountPercent =
                      p.metadata?.discountPercent ??
                      (originalPricePaise && originalPricePaise > p.pricePaise
                        ? Math.round(
                            ((originalPricePaise - p.pricePaise) /
                              originalPricePaise) *
                              100
                          )
                        : null);
                    const rating = p.rating || p.metadata?.rating || 4.8;
                    const reviewsCount =
                      p.reviewsCount || p.metadata?.reviewsCount || 120;
                    const category =
                      p.category || p.metadata?.category || "Commerce";
                    const capacity =
                      p.metadata?.capacity ||
                      (p.metadata?.capacityLitres
                        ? `${p.metadata.capacityLitres}L`
                        : undefined);
                    const weight =
                      p.metadata?.weight ||
                      (p.metadata?.weightKg
                        ? `${p.metadata.weightKg}kg`
                        : undefined);
                    const feature = p.metadata?.feature;

                    const isLowestPrice = p.pricePaise === lowestPrice;
                    const isHighestRated = rating === highestRating;

                    return (
                      <div
                        key={p.id}
                        className="surface-card flex flex-col justify-between rounded-2xl border border-black/10 p-5 shadow-sm"
                      >
                        <div className="space-y-4">
                          {/* Image & Badges */}
                          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-slate-100">
                            <img
                              src={imageUrl}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                              {isLowestPrice && (
                                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                                  Lowest Price
                                </span>
                              )}
                              {isHighestRated && (
                                <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs">
                                  Top Rated
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Merchant & Title */}
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-black/50">
                              {merchantName}
                            </span>
                            <h3 className="text-base font-bold text-slate-950 line-clamp-2">
                              {p.name}
                            </h3>
                          </div>

                          {/* Price & Discount */}
                          <div className="rounded-xl bg-black/5 p-3">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xl font-extrabold text-slate-950">
                                ₹{(p.pricePaise / 100).toLocaleString("en-IN")}
                              </span>
                              {originalPricePaise && (
                                <span className="text-xs text-black/40 line-through">
                                  ₹
                                  {(
                                    originalPricePaise / 100
                                  ).toLocaleString("en-IN")}
                                </span>
                              )}
                              {discountPercent && (
                                <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Attribute Comparison Rows */}
                          <div className="space-y-2 text-xs border-t border-black/10 pt-3">
                            <div className="flex justify-between py-1 border-b border-black/5">
                              <span className="text-black/50">Rating</span>
                              <span className="font-semibold text-amber-700">
                                ★ {rating} ({reviewsCount} reviews)
                              </span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-black/5">
                              <span className="text-black/50">Category</span>
                              <span className="font-semibold text-slate-900">
                                {category}
                              </span>
                            </div>

                            {capacity && (
                              <div className="flex justify-between py-1 border-b border-black/5">
                                <span className="text-black/50">Capacity</span>
                                <span className="font-semibold text-slate-900">
                                  {capacity}
                                </span>
                              </div>
                            )}

                            {weight && (
                              <div className="flex justify-between py-1 border-b border-black/5">
                                <span className="text-black/50">Weight</span>
                                <span className="font-semibold text-slate-900">
                                  {weight}
                                </span>
                              </div>
                            )}

                            {feature && (
                              <div className="py-1">
                                <span className="text-black/50 block mb-0.5">
                                  Key Feature
                                </span>
                                <span className="font-medium text-slate-900">
                                  {feature}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="pt-5 mt-4 border-t border-black/10">
                          <button
                            type="button"
                            onClick={() => {
                              setShowCompareModal(false);
                              handleChoose(p);
                            }}
                            className="oval-pill-btn w-full border-black bg-black py-3 text-xs font-bold text-white shadow-sm hover:bg-black/80 transition"
                          >
                            Choose this product &rarr;
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
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
