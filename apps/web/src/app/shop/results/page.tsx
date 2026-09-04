"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ProductMetadata = {
  capacity?: string;
  weight?: string;
  feature?: string;
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

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const request = searchParams.get("request") || "";
  const mode = searchParams.get("mode") || "solo";
  const groupId = searchParams.get("groupId") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/products`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load products");
        }

        setProducts(data.products || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

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
    params.set("request", request);
    params.set("mode", mode);

    if (mode === "group" && groupId) {
      params.set("groupId", groupId);
    }

    router.push(`/shop/proposal?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6 sm:px-10">
        <Header currentStep="Product Options" />

        <div className="py-10">
          <div className="mb-8">
            <Link
              href={`/shop?${new URLSearchParams({ mode, ...(groupId ? { groupId } : {}) }).toString()}`}
              className="text-xs font-semibold uppercase tracking-wider text-black/50 transition hover:text-black"
            >
              Back to Request
            </Link>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              Compare options
            </h1>

            <p className="mt-3 max-w-2xl text-base text-black/60">
              We evaluated your request against available merchant products.
              Choose an option to continue to approval and checkout.
            </p>

            {/* Request Summary Tag */}
            <div className="surface-card mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-black/45">
                  Request
                </span>
                <span className="text-sm font-medium text-black/80">
                  &ldquo;{request || "Any suitable option"}&rdquo;
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
                  {mode === "group" ? "Group Shopping" : "Solo Shopping"}
                </span>
                {mode === "group" && groupId && (
                  <span className="rounded-full border border-black/15 bg-white px-3 py-1 text-xs font-medium text-black/60">
                    Group Connected
                  </span>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div className="surface-inset rounded-3xl p-12 text-center">
              <p className="text-sm font-medium text-black/50">
                Finding the best matching products...
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              <p className="font-semibold">Unable to load catalog</p>
              <p className="mt-1">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-4 rounded-xl bg-black px-4 py-2 text-xs font-semibold text-white"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="surface-inset rounded-3xl p-12 text-center">
              <p className="text-base font-semibold">No products currently match</p>
              <p className="mt-2 text-sm text-black/50">
                Try adjusting your request parameters or price range.
              </p>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const merchantName =
                  typeof product.merchant === "string"
                    ? product.merchant
                    : product.merchant?.name || "Merchant";

                const metadata = product.metadata || {};
                const highlights = [
                  metadata.capacity ? `Capacity: ${metadata.capacity}` : null,
                  metadata.weight ? `Weight: ${metadata.weight}` : null,
                  metadata.feature ? metadata.feature : null,
                ].filter(Boolean) as string[];

                return (
                  <article
                    key={product.id}
                    className="surface-card surface-card-interactive flex flex-col justify-between rounded-3xl p-6 sm:p-7"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-black/45">
                          {merchantName}
                        </span>

                        <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold text-black/60">
                          ₹{(product.pricePaise / 100).toLocaleString("en-IN")}
                        </span>
                      </div>

                      <h2 className="mt-2 text-xl font-semibold text-slate-950">
                        {product.name}
                      </h2>

                      {product.description && (
                        <p className="mt-2.5 text-xs leading-5 text-black/60">
                          {product.description}
                        </p>
                      )}

                      {highlights.length > 0 && (
                        <div className="mt-5 space-y-1.5 border-t border-black/5 pt-4">
                          {highlights.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-black/70">
                              <span className="h-1 w-1 rounded-full bg-black/40"></span>
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-7 pt-4 border-t border-black/5">
                      <button
                        type="button"
                        onClick={() => handleChoose(product)}
                        className="w-full rounded-xl bg-black py-3.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-black/80"
                      >
                        Select this product
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
          <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6">
            <p className="text-sm text-black/50">Loading results...</p>
          </div>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
