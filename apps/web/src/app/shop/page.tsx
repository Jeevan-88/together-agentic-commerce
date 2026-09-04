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

          {/* Request Card: Rotating Monochrome Default -> Rainbow on Voice Active */}
          <div className={isListening ? "gemini-rainbow-card" : "gemini-monochrome-card"}>
            <div className="gemini-rainbow-inner p-6 sm:p-7">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="shopping-request"
                    className="text-xs font-bold uppercase tracking-[0.16em] text-slate-900"
                  >
                    SHOPPING REQUEST
                  </label>
                </div>
              </div>

              {/* Inner Curved Rectangle with Inward 3D Shadowy Texture & Black Border */}
              <div className="relative rounded-2xl border-2 border-black/20 bg-[#f4f4f2] p-1 shadow-[inset_0_3px_8px_rgba(0,0,0,0.09),inset_0_1px_3px_rgba(0,0,0,0.14)] transition-all focus-within:border-black focus-within:bg-white">
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
                  className="w-full resize-none bg-transparent p-3 text-base text-slate-950 outline-none placeholder:text-black/35"
                />
              </div>

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

              {/* Validation, Status & Cute Doodle Microphone Circle beside 0/500 */}
              <div className="mt-4 flex flex-col gap-2 border-t border-black/5 pt-3 sm:flex-row sm:items-center sm:justify-between">
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
                      Include your budget, capacity, weight, or preferences.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <span className="text-xs font-mono text-black/40">
                    {request.length}/500
                  </span>

                  {/* Black Circle with Cute Doodle Microphone Icon */}
                  <button
                    type="button"
                    onClick={toggleVoiceInput}
                    className={`flex h-10 w-10 items-center justify-center rounded-full shadow-md transition-all ${
                      isListening
                        ? "bg-red-600 text-white animate-pulse ring-4 ring-red-200"
                        : "bg-black text-white hover:bg-black/80 hover:scale-105 active:scale-95"
                    }`}
                    title={speechSupported ? "Speak using microphone" : "Speech recognition not supported"}
                    aria-label="Voice input microphone"
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="9" y="3" width="6" height="10" rx="3" ry="3" />
                      <path d="M5 10a7 7 0 0 0 14 0" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Selection with Solid Black Outward 3D and Rupee Coin Video on Select */}
          <div className="mt-8">
            <h2 className="mb-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-black/55">
              How do you want to buy?
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                aria-pressed={mode === "solo"}
                onClick={() => setMode("solo")}
                className={`rounded-2xl p-6 text-left transition-all ${
                  mode === "solo"
                    ? "border-2 border-black bg-black text-white outward-3d"
                    : "border-2 border-black/15 bg-white text-slate-900 hover:border-black/40"
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

                  {mode === "solo" ? (
                    <video
                      src="/rupee-coin.webm"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-7 w-7 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/20 text-transparent">
                      •
                    </span>
                  )}
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
                className={`rounded-2xl p-6 text-left transition-all ${
                  mode === "group"
                    ? "border-2 border-black bg-black text-white outward-3d"
                    : "border-2 border-black/15 bg-white text-slate-900 hover:border-black/40"
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

                  {mode === "group" ? (
                    <video
                      src="/rupee-coin.webm"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="h-7 w-7 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border border-black/20 text-transparent">
                      •
                    </span>
                  )}
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

          {/* Continue Action with Inward 3D Effect */}
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
              className={`oval-pill-btn inward-3d px-10 py-3.5 text-xs font-bold uppercase tracking-wider transition ${
                canContinue
                  ? "border-2 border-black bg-black text-white hover:bg-black/90"
                  : "cursor-not-allowed border-black/10 bg-black/10 text-black/30"
              }`}
            >
              Continue to catalog &rarr;
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
