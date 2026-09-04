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
        <Header currentStep="New Request" />

        <section className="mx-auto w-full max-w-3xl py-12 sm:py-16">
          <div className="mb-8">
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-wider text-black/50 transition hover:text-black"
            >
              Back to Home
            </Link>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
              What are you looking for?
            </h1>

            <p className="mt-3 max-w-2xl text-base text-black/60 sm:text-lg">
              Tell us what you want to buy. You can shop for yourself or decide
              together with a group.
            </p>
          </div>

          {/* Request Input Card */}
          <div className="surface-card rounded-3xl p-6 sm:p-7">
            <div className="mb-3 flex items-center justify-between">
              <label
                htmlFor="shopping-request"
                className="text-xs font-semibold uppercase tracking-wider text-black/60"
              >
                Shopping request
              </label>

              {/* Speak Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  isListening
                    ? "border-red-500 bg-red-50 text-red-700 animate-pulse"
                    : "border-black/15 bg-white text-slate-700 hover:border-black/30 hover:bg-black/5"
                }`}
                aria-pressed={isListening}
                title={speechSupported ? "Speak your request using your microphone" : "Speech not supported"}
              >
                <span className={`h-2 w-2 rounded-full ${isListening ? "bg-red-600 animate-ping" : "bg-black/40"}`}></span>
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
              placeholder="For example: I need a lightweight backpack for a weekend trip under ₹6,000."
              className="w-full resize-none rounded-2xl border border-black/15 bg-white p-4 text-base outline-none transition placeholder:text-black/30 focus:border-black/40"
            />

            {/* Validation & Status Messages */}
            <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
                  <p className="text-xs text-black/40">
                    Include your budget, capacity, weight, or preferences.
                  </p>
                )}
              </div>

              <span className="shrink-0 text-right text-xs text-black/35">
                {request.length}/500
              </span>
            </div>
          </div>

          {/* Mode Selection */}
          <div className="mt-8">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-black/60">
              How do you want to buy?
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={mode === "solo"}
                onClick={() => setMode("solo")}
                className={`surface-card rounded-2xl p-5 text-left transition ${
                  mode === "solo"
                    ? "border-black bg-black text-white shadow-sm ring-1 ring-black"
                    : "hover:border-black/30"
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
                    className={`text-xs font-semibold ${
                      mode === "solo" ? "text-white/60" : "text-black/40"
                    }`}
                  >
                    Solo
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold">
                  Buy for myself
                </h3>

                <p
                  className={`mt-1.5 text-xs leading-5 ${
                    mode === "solo" ? "text-white/70" : "text-black/55"
                  }`}
                >
                  Direct discovery, instant recommendation, and single-approval payment.
                </p>
              </button>

              <button
                type="button"
                aria-pressed={mode === "group"}
                onClick={() => setMode("group")}
                className={`surface-card rounded-2xl p-5 text-left transition ${
                  mode === "group"
                    ? "border-black bg-black text-white shadow-sm ring-1 ring-black"
                    : "hover:border-black/30"
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
                    className={`text-xs font-semibold ${
                      mode === "group" ? "text-white/60" : "text-black/40"
                    }`}
                  >
                    Group
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-semibold">
                  Buy together
                </h3>

                <p
                  className={`mt-1.5 text-xs leading-5 ${
                    mode === "group" ? "text-white/70" : "text-black/55"
                  }`}
                >
                  Link your shopping group, evaluate together, and confirm before paying.
                </p>
              </button>
            </div>
          </div>

          {/* Continue Action */}
          <div className="mt-10 flex items-center justify-between gap-4 border-t border-black/10 pt-6">
            <p className="text-xs font-medium text-black/45">
              {mode === "solo"
                ? "Solo mode selected"
                : mode === "group"
                  ? groupId
                    ? "Group mode selected (group connected)"
                    : "Group mode selected"
                  : "Please select Solo or Group mode"}
            </p>

            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className={`rounded-xl px-6 py-3.5 text-sm font-semibold transition ${
                canContinue
                  ? "bg-black text-white shadow-sm hover:bg-black/80"
                  : "cursor-not-allowed bg-black/10 text-black/35"
              }`}
            >
              Continue to products
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
