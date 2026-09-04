"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Product = {
  id: string;
  name: string;
  description: string | null;
  pricePaise: number;
  currency: string;
  merchant: {
    id: string;
    name: string;
    slug: string;
  };
  metadata: {
    capacity?: string;
    weight?: string;
    feature?: string;
  } | null;
};

function formatPrice(pricePaise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(pricePaise / 100);
}

function getScore(index: number) {
  const scores = ["Best overall", "Best for space", "Best value"];
  return scores[index] || "Good match";
}

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const request =
    searchParams.get("request") ||
    "Lightweight backpack under ₹6,000 for a weekend trip";

  const mode = searchParams.get("mode") || "solo";

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/products`,
        );

        if (!response.ok) {
          throw new Error("Unable to load products");
        }

        const data = await response.json();

        if (!data.success || !Array.isArray(data.products)) {
          throw new Error("Invalid product response");
        }

        setProducts(data.products);
      } catch (error) {
        console.error("Product loading failed:", error);
        setError("We couldn't load the available products.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  function handleChoose(product: Product) {
    const params = new URLSearchParams({
      productId: product.id,
      product: product.name,
      merchant: product.merchant.name,
      pricePaise: String(product.pricePaise),
      price: formatPrice(product.pricePaise),
      request,
      mode,
    });

    router.push(`/shop/proposal?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto min-h-screen max-w-6xl px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between border-b border-black/10 pb-5">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Go to TOGETHER home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
              T
            </div>

            <span className="text-lg font-semibold tracking-tight">
              TOGETHER
            </span>
          </Link>

          <Link
            href="/shop"
            className="text-sm text-black/50 transition hover:text-black"
          >
            New purchase
          </Link>
        </header>

        <section className="py-14">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-black/45">
                Your options
              </p>

              <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                We found a few good matches.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-black/60 sm:text-lg">
                Based on your request, these options fit the budget and
                requirements we could identify.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 lg:max-w-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                Your request
              </p>

              <p className="mt-1 text-sm leading-6">
                {request}
              </p>
            </div>
          </div>

          {loading && (
            <div className="mt-12 rounded-3xl border border-black/10 bg-white p-10 text-center">
              <p className="text-sm text-black/55">
                Loading available products...
              </p>
            </div>
          )}

          {error && (
            <div className="mt-12 rounded-3xl border border-red-200 bg-white p-10 text-center">
              <p className="text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-medium text-white"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {products.map((product, index) => {
                const highlights = [
                  product.metadata?.capacity,
                  product.metadata?.weight,
                  product.metadata?.feature,
                ].filter(Boolean) as string[];

                return (
                  <article
                    key={product.id}
                    className="flex flex-col rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                          {product.merchant.name}
                        </p>

                        <h2 className="mt-2 text-xl font-semibold tracking-tight">
                          {product.name}
                        </h2>
                      </div>

                      <span className="rounded-full bg-[#f1f1ef] px-3 py-1 text-xs font-medium text-black/60">
                        {getScore(index)}
                      </span>
                    </div>

                    <div className="mt-8 flex h-36 items-center justify-center rounded-2xl bg-[#f3f3f1]">
                      <div className="flex h-20 w-16 items-center justify-center rounded-2xl border border-black/15 bg-white shadow-sm">
                        <span className="text-xs font-semibold text-black/40">
                          BAG
                        </span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-semibold">
                          {formatPrice(product.pricePaise)}
                        </span>

                        <span className="text-xs text-black/40">
                          Test purchase
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-black/55">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {highlights.map((highlight) => (
                        <span
                          key={highlight}
                          className="rounded-full border border-black/10 px-3 py-1.5 text-xs text-black/55"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleChoose(product)}
                      className="mt-6 w-full rounded-xl bg-black py-3.5 text-sm font-medium text-white transition hover:bg-black/80"
                    >
                      Choose this
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="mt-12 rounded-3xl border border-black/10 bg-white p-10 text-center">
              <p className="text-sm text-black/55">
                No products are currently available.
              </p>
            </div>
          )}

          <div className="mt-10 rounded-3xl border border-black/10 bg-white p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  Want to compare before choosing?
                </p>

                <p className="mt-1 text-sm text-black/50">
                  Look at price, weight, capacity and the reasons each option
                  matches your request.
                </p>
              </div>

              <button
                type="button"
                className="rounded-xl border border-black/15 px-5 py-3 text-sm font-medium transition hover:bg-black/5"
              >
                Compare options
              </button>
            </div>
          </div>
        </section>
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
            <p className="text-sm text-black/50">
              Loading results...
            </p>
          </div>
        </main>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}