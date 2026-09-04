"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";

type PurchaseMode = "solo" | "group" | null;

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialMode = (searchParams.get("mode") as PurchaseMode) || null;
  const initialGroupId = searchParams.get("groupId") || "";

  const [request, setRequest] = useState("");
  const [mode, setMode] = useState<PurchaseMode>(initialMode);
  const [groupId, setGroupId] = useState(initialGroupId);

  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceNotice, setVoiceNotice] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
      }
    }
  }, []);

  useEffect(() => {
    const qMode = searchParams.get("mode") as PurchaseMode;
    const qGroupId = searchParams.get("groupId");
    if (qMode && (qMode === "solo" || qMode === "group")) {
      setMode(qMode);
    }
    if (qGroupId) {
      setGroupId(qGroupId);
    }
  }, [searchParams]);

  const hasEnteredText = request.trim().length > 0;
  const isTextValid = request.trim().length >= 3;
  const canContinue = isTextValid && mode !== null;

  const quickPrompts = [
    "Lightweight travel backpack under ₹5,000",
    "Active noise cancelling wireless headphones",
    "Running sneakers with cushion sole",
    "Fitness smartwatch with GPS battery",
    "Foldable magnetic 3-in-1 travel charger",
  ];

  function toggleVoiceInput() {
    if (!speechSupported) {
      setVoiceNotice("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognitionConstructor =
        (window as unknown as { SpeechRecognition?: new () => any }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) {
        setVoiceNotice("Speech recognition is unavailable.");
        return;
      }

      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice("Listening... speak your request now.");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setRequest((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
          setVoiceNotice("Speech converted to text.");
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "not-allowed") {
          setVoiceNotice("Microphone permission was denied.");
        } else {
          setVoiceNotice("Speech was not detected. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
      setVoiceNotice("Unable to activate microphone.");
    }
  }

  function handleContinue() {
    if (!canContinue || !mode) {
      return;
    }

    const params = new URLSearchParams({
      request: request.trim(),
      mode,
    });

    if (mode === "group" && groupId) {
      params.set("groupId", groupId);
    }

    router.push(`/shop/results?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6 sm:px-10">
        <Header currentStep="CO-SHOP" />

        <section className="mx-auto w-full max-w-3xl py-10 sm:py-14">
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="oval-pill-btn mb-4 border-black/20 bg-white text-[10px] text-black/60 transition hover:border-black hover:text-black"
            >
              &larr; Back to Home
            </Link>

            <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              What are you looking for?
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-base text-black/65">
              Tell us what you want to buy. Shop solo or invite your group to compare
              options and decide together.
            </p>
          </div>

          {/* Google Gemini Rainbow Glowing Chat / Request Box */}
          <div className="gemini-rainbow-card">
            <div className="gemini-rainbow-inner p-6 sm:p-7">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <label
                    htmlFor="shopping-request"
                    className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900"
                  >
                    Shopping Request &bull; Intent Engine
                  </label>
                </div>

                {/* Speak Button in Oval Pill */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`oval-pill-btn text-xs transition ${
                    isListening
                      ? "border-red-500 bg-red-50 text-red-700 animate-pulse"
                      : "border-black/20 bg-white text-slate-800 hover:border-black hover:bg-black/5"
                  }`}
                  aria-pressed={isListening}
                  title={speechSupported ? "Speak using your microphone" : "Speech not supported"}
                >
                  <span className={`mr-1.5 h-2 w-2 rounded-full ${isListening ? "bg-red-600 animate-ping" : "bg-black/40"}`}></span>
                  <span>{isListening ? "Listening..." : "Speak"}</span>
                </button>
              </div>

              <textarea
                id="shopping-request"
                name="shopping-request"
                rows={4}
                value={request}
                onChange={(e) => {
                  setRequest(e.target.value);
                  if (voiceNotice) setVoiceNotice("");
                }}
                placeholder="For example: I need a lightweight travel backpack under ₹6,000, or noise-cancelling headphones for flights."
                className="w-full resize-none rounded-2xl border border-black/10 bg-[#fafaf9] p-4 text-base text-slate-950 outline-none transition placeholder:text-black/35 focus:border-black/30 focus:bg-white"
              />

              {/* Quick Prompts Suggestion Chips */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-black/45">Try:</span>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRequest(prompt);
                      if (voiceNotice) setVoiceNotice("");
                    }}
                    className="rounded-full border border-black/10 bg-white px-2.5 py-1 text-[11px] text-black/70 transition hover:border-black/30 hover:bg-black/5"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Validation & Status Messages */}
              <div className="mt-4 flex flex-col gap-1 border-t border-black/5 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {hasEnteredText && !isTextValid && (
                    <p className="text-xs font-medium text-red-600">
                      Please enter at least 3 characters.
                    </p>
                  )}
                  {voiceNotice && (
                    <p className="text-xs font-medium text-sky-700">
                      {voiceNotice}
                    </p>
                  )}
                  {!hasEnteredText && !voiceNotice && (
                    <p className="text-xs text-black/45">
                      Include your budget, category, weight, or preferences.
                    </p>
                  )}
                </div>

                <span className="shrink-0 text-right text-xs font-mono text-black/40">
                  {request.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="mt-8">
            <h2 className="mb-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-black/55">
              How do you want to buy?
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={mode === "solo"}
                onClick={() => setMode("solo")}
                className={`surface-card rounded-2xl p-6 text-left transition ${
                  mode === "solo"
                    ? "border-black bg-black text-white shadow-md ring-2 ring-black"
                    : "hover:border-black/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`oval-pill-btn text-[10px] ${
                      mode === "solo"
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-black/20 text-black/60"
                    }`}
                  >
                    Solo Mode
                  </span>

                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      mode === "solo" ? "bg-white text-black" : "border border-black/20 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  Buy for myself
                </h3>

                <p
                  className={`mt-1.5 text-xs leading-5 ${
                    mode === "solo" ? "text-white/75" : "text-black/60"
                  }`}
                >
                  Direct catalog discovery, instant product recommendation, and single-click checkout.
                </p>
              </button>

              <button
                type="button"
                aria-pressed={mode === "group"}
                onClick={() => setMode("group")}
                className={`surface-card rounded-2xl p-6 text-left transition ${
                  mode === "group"
                    ? "border-black bg-black text-white shadow-md ring-2 ring-black"
                    : "hover:border-black/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`oval-pill-btn text-[10px] ${
                      mode === "group"
                        ? "border-white/40 bg-white/10 text-white"
                        : "border-black/20 text-black/60"
                    }`}
                  >
                    Group Mode
                  </span>

                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      mode === "group" ? "bg-white text-black" : "border border-black/20 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-bold">
                  Buy together
                </h3>

                <p
                  className={`mt-1.5 text-xs leading-5 ${
                    mode === "group" ? "text-white/75" : "text-black/60"
                  }`}
                >
                  Link your shopping group, bring everyone into consensus, and approve together.
                </p>
              </button>
            </div>
          </div>

          {/* Continue Action in Oval Pill */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-black/10 pt-6 sm:flex-row">
            <p className="text-xs font-medium text-black/50">
              {mode === "solo"
                ? "Solo mode selected"
                : mode === "group"
                  ? groupId
                    ? "Group mode selected (group connected)"
                    : "Group mode selected"
                  : "Please choose Solo or Group mode"}
            </p>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className={`oval-pill-btn px-8 py-3 text-sm font-bold transition ${
                canContinue
                  ? "border-black bg-black text-white shadow-sm hover:bg-black/80"
                  : "cursor-not-allowed border-black/10 bg-black/10 text-black/30"
              }`}
            >
              Continue to Catalog &rarr;
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
          <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
            <p className="text-sm text-black/50">Loading shopping...</p>
          </div>
        </main>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
