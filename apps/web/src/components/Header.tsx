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
    <header className="flex items-center justify-between border-b border-black/10 pb-5 pt-2">
      <Link
        href="/"
        className="flex items-center gap-3 transition hover:opacity-80"
        aria-label="TOGETHER Home"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white shadow-sm">
          T
        </div>
        <span className="text-lg font-semibold tracking-tight text-slate-950">
          TOGETHER
        </span>
      </Link>

      <div className="flex items-center gap-3 sm:gap-6">
        {currentStep && (
          <span className="hidden text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 sm:inline-block">
            {currentStep}
          </span>
        )}

        <nav className="flex items-center gap-2 text-sm font-medium sm:gap-4">
          <Link
            href="/shop"
            className="rounded-lg px-2.5 py-1.5 text-slate-600 transition hover:bg-black/5 hover:text-slate-950"
          >
            Shop
          </Link>
          <Link
            href="/group"
            className="rounded-lg px-2.5 py-1.5 text-slate-600 transition hover:bg-black/5 hover:text-slate-950"
          >
            Groups
          </Link>
        </nav>

        <button
          type="button"
          onClick={toggleAccessibility}
          aria-pressed={accessible}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
            accessible
              ? "border-black bg-black text-white"
              : "border-black/15 bg-white text-slate-700 hover:border-black/30"
          }`}
          title="Toggle High Contrast and Accessibility mode"
          aria-label="Toggle Accessibility high-contrast mode"
        >
          <span className="font-semibold">A11y</span>
          <span className="text-[10px] opacity-75">{accessible ? "ON" : "OFF"}</span>
        </button>
      </div>
    </header>
  );
}
