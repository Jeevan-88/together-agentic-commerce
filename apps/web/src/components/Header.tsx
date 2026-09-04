"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface HeaderProps {
  currentStep?: string;
}

export default function Header({ currentStep }: HeaderProps) {
  const [accessible, setAccessible] = useState(false);

  useEffect(() => {
    const isAccessible = localStorage.getItem("together_a11y") === "true";
    if (isAccessible) {
      setAccessible(true);
      document.documentElement.classList.add("accessible-mode");
    }
  }, []);

  function toggleAccessibility() {
    const nextState = !accessible;
    setAccessible(nextState);
    if (nextState) {
      document.documentElement.classList.add("accessible-mode");
      localStorage.setItem("together_a11y", "true");
    } else {
      document.documentElement.classList.remove("accessible-mode");
      localStorage.setItem("together_a11y", "false");
    }
  }

  return (
    <div className="w-full">
      {/* Top Bar matching reference: CO-WATCH  CO-PLAY  CO-SHOP  CO-STUDY */}
      <div className="-mx-6 -mt-6 mb-5 bg-black px-6 py-2.5 sm:-mx-10 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6 overflow-x-auto text-[11px] font-bold uppercase tracking-[0.22em] text-white/55 sm:gap-10 sm:text-xs">
            <span className="transition hover:text-white cursor-pointer">CO-WATCH</span>
            <span className="transition hover:text-white cursor-pointer">CO-PLAY</span>
            <span className="rounded-full border border-white/60 bg-white/10 px-3 py-0.5 text-white shadow-sm">
              CO-SHOP
            </span>
            <span className="transition hover:text-white cursor-pointer">CO-STUDY</span>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
              Live Razorpay Commerce
            </span>
          </div>
        </div>
      </div>

      {/* Main Header with Center TOGETHER branding and oval pill buttons */}
      <header className="relative flex items-center justify-between border-b border-black/10 pb-5 pt-1">
        {/* Left: Navigation in Oval Pill format */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/shop"
            className="oval-pill-btn border-black/20 bg-white text-slate-900 shadow-sm transition hover:border-black hover:bg-black hover:text-white"
          >
            Shop
          </Link>
          <Link
            href="/group"
            className="oval-pill-btn border-black/20 bg-white text-slate-900 shadow-sm transition hover:border-black hover:bg-black hover:text-white"
          >
            Groups
          </Link>
        </div>

        {/* Center: Large bold brand */}
        <div className="absolute left-1/2 -translate-x-1/2 text-center">
          <Link
            href="/"
            className="group flex flex-col items-center"
            aria-label="TOGETHER Home"
          >
            <span className="text-xl font-black tracking-[0.28em] text-black transition group-hover:opacity-80 sm:text-2xl">
              TOGETHER
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-black/40">
              Collaborative Commerce
            </span>
          </Link>
        </div>

        {/* Right: Actions & Step */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentStep && (
            <span className="hidden rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-black/60 md:inline-block">
              {currentStep}
            </span>
          )}

          <button
            type="button"
            onClick={toggleAccessibility}
            aria-pressed={accessible}
            className={`oval-pill-btn transition ${
              accessible
                ? "border-black bg-black text-white shadow-sm"
                : "border-black/25 bg-white text-black hover:border-black"
            }`}
            title="Toggle High Contrast and Accessibility mode"
            aria-label="Toggle Accessibility high-contrast mode"
          >
            A11y {accessible ? "ON" : "OFF"}
          </button>
        </div>
      </header>
    </div>
  );
}
