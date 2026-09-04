"use client";

import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";

interface HeaderProps {
  currentStep?: string;
}

export default function Header({ currentStep }: HeaderProps) {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("together_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.name && parsed.email) {
          setUser(parsed);
          setAuthName(parsed.name);
          setAuthEmail(parsed.email);
        }
      } catch (e) {}
    }
  }, []);

  function handleSaveUser(e: FormEvent) {
    e.preventDefault();
    if (!authName.trim() || !authEmail.trim()) return;
    const userData = { name: authName.trim(), email: authEmail.trim() };
    setUser(userData);
    localStorage.setItem("together_user", JSON.stringify(userData));
    setShowAuthModal(false);
  }

  function handleSignOut() {
    setUser(null);
    setAuthName("");
    setAuthEmail("");
    localStorage.removeItem("together_user");
    setShowAuthModal(false);
  }

  return (
    <>
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

        {/* Right: User Auth & Step Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="oval-pill-btn border-black bg-black text-white text-[11px] font-bold shadow-sm transition hover:bg-black/80"
            >
              👤 {user.name}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="oval-pill-btn border-black/20 bg-white text-slate-900 text-[11px] font-bold shadow-sm transition hover:border-black hover:bg-black hover:text-white"
            >
              Sign In / Sign Up
            </button>
          )}

          {currentStep && (
            <span className="rounded-full bg-black/5 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-black/70 hidden sm:inline-block">
              {currentStep}
            </span>
          )}
        </div>
      </header>

      {/* Interactive Sign In / Sign Up Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="surface-card w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-black/45">
                  Account Management
                </span>
                <h2 className="text-xl font-bold text-slate-950">
                  {user ? "Your Profile" : "Sign In or Sign Up"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-sm font-bold text-black/60 hover:bg-black/10"
              >
                ✕
              </button>
            </div>

            {user ? (
              <div className="py-6 space-y-4">
                <div className="surface-inset rounded-2xl p-4">
                  <p className="text-xs text-black/50">Signed in as:</p>
                  <p className="text-base font-bold text-slate-950">{user.name}</p>
                  <p className="text-xs text-black/60 font-mono">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="oval-pill-btn w-full border-red-600 bg-red-600 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 transition shadow-sm"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveUser} className="py-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-black/60">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="e.g. Jeevan Yadav"
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-black/60">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. jeevan@example.com"
                    className="w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-black"
                  />
                </div>

                <button
                  type="submit"
                  className="oval-pill-btn w-full border-black bg-black py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-black/80 transition shadow-sm"
                >
                  Continue & Save Account
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
