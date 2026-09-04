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
    <header className="relative mb-6 flex items-center justify-between rounded-full border border-black/10 bg-white/90 px-6 py-3.5 shadow-sm backdrop-blur-md">
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

      {/* Center: Large bold TOGETHER brand inside oval box */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center">
        <Link
          href="/"
          className="group inline-flex items-center justify-center rounded-full border-2 border-black bg-white px-6 py-1.5 shadow-sm transition hover:bg-black hover:text-white"
          aria-label="TOGETHER Home"
        >
          <span className="text-lg sm:text-xl font-black tracking-[0.25em] text-black group-hover:text-white transition">
            TOGETHER
          </span>
        </Link>
      </div>

      {/* Right: Step Indicator if provided */}
      <div className="flex items-center gap-2 sm:gap-3">
        {currentStep && (
          <span className="rounded-full bg-black/5 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-black/70">
            {currentStep}
          </span>
        )}
      </div>
    </header>
  );
}
