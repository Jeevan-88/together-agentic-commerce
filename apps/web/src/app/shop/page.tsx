"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PurchaseMode = "solo" | "group" | null;

export default function ShopPage() {
  const router = useRouter();

  const [request, setRequest] = useState("");
  const [mode, setMode] = useState<PurchaseMode>(null);

  const canContinue = request.trim().length > 0 && mode !== null;

  function handleContinue() {
    if (!canContinue || !mode) {
      return;
    }

    const params = new URLSearchParams({
      request: request.trim(),
      mode,
    });

    router.push(`/shop/results?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto min-h-screen max-w-5xl px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between border-b border-black/10 pb-5">
          <a
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
          </a>

          <span className="text-sm text-black/50">
            New purchase
          </span>
        </header>

        <section className="mx-auto max-w-3xl py-20">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-black/45">
            Start here
          </p>

          <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
            What are you looking for?
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-black/60 sm:text-lg">
            Tell us what you want to buy. You can make the purchase yourself
            or bring other people into the decision.
          </p>

          <div className="mt-10">
            <label
              htmlFor="shopping-request"
              className="mb-3 block text-sm font-medium"
            >
              Your request
            </label>

            <textarea
              id="shopping-request"
              name="shopping-request"
              rows={5}
              value={request}
              onChange={(event) => setRequest(event.target.value)}
              placeholder="For example: I need a lightweight backpack for a weekend trip under ₹6,000."
              className="w-full resize-none rounded-2xl border border-black/15 bg-white px-5 py-4 text-base outline-none transition placeholder:text-black/30 focus:border-black/40"
            />

            <div className="mt-2 flex justify-between gap-4">
              <p className="text-xs text-black/40">
                Include your budget, preferences, quantity, or anything
                important to you.
              </p>

              <span className="shrink-0 text-xs text-black/35">
                {request.length}/500
              </span>
            </div>
          </div>

          <div className="mt-10">
            <p className="mb-4 text-sm font-medium">
              How do you want to buy?
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={mode === "solo"}
                onClick={() => setMode("solo")}
                className={`rounded-2xl border p-5 text-left transition ${
                  mode === "solo"
                    ? "border-black bg-black text-white shadow-sm"
                    : "border-black/15 bg-white hover:border-black/40 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${
                      mode === "solo"
                        ? "bg-white text-black"
                        : "bg-black text-white"
                    }`}
                  >
                    S
                  </div>

                  <span
                    className={`text-xs ${
                      mode === "solo" ? "text-white/60" : "text-black/40"
                    }`}
                  >
                    Solo
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-semibold">
                  Buy for myself
                </h2>

                <p
                  className={`mt-2 text-sm leading-6 ${
                    mode === "solo" ? "text-white/65" : "text-black/55"
                  }`}
                >
                  Find the right option and complete the purchase yourself.
                </p>
              </button>

              <button
                type="button"
                aria-pressed={mode === "group"}
                onClick={() => setMode("group")}
                className={`rounded-2xl border p-5 text-left transition ${
                  mode === "group"
                    ? "border-black bg-black text-white shadow-sm"
                    : "border-black/15 bg-white hover:border-black/40 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold ${
                      mode === "group"
                        ? "bg-white text-black"
                        : "bg-black text-white"
                    }`}
                  >
                    G
                  </div>

                  <span
                    className={`text-xs ${
                      mode === "group" ? "text-white/60" : "text-black/40"
                    }`}
                  >
                    Group
                  </span>
                </div>

                <h2 className="mt-5 text-lg font-semibold">
                  Buy together
                </h2>

                <p
                  className={`mt-2 text-sm leading-6 ${
                    mode === "group" ? "text-white/65" : "text-black/55"
                  }`}
                >
                  Bring people into the decision and agree before buying.
                </p>
              </button>
            </div>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4">
            <p className="text-sm text-black/40">
              {mode === "solo"
                ? "Solo purchase selected"
                : mode === "group"
                  ? "Group purchase selected"
                  : "Choose a purchase type"}
            </p>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className={`rounded-xl px-6 py-3.5 text-sm font-medium transition ${
                canContinue
                  ? "bg-black text-white hover:bg-black/80"
                  : "cursor-not-allowed bg-black/10 text-black/30"
              }`}
            >
              Continue
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}