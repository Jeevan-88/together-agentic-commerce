import Link from "next/link";
import Header from "../components/Header";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-10">
        <Header />

        <section className="flex flex-1 items-center py-16 sm:py-20">
          <div className="grid w-full gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black/60 shadow-sm backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-black"></span>
                Group and Solo Commerce
              </div>

              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Decide together.
                <br />
                Buy with confidence.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-black/65">
                Tell TOGETHER what you are looking for, compare the options,
                bring everyone into the decision, and complete the purchase
                when the group is ready.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/shop"
                  className="oval-pill-btn border-black bg-black px-8 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-black/80"
                >
                  Start shopping &rarr;
                </Link>

                <Link
                  href="/group"
                  className="oval-pill-btn border-black/20 bg-white px-8 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-900 shadow-sm transition hover:border-black"
                >
                  Create a group
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-6 text-xs text-black/45">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  Razorpay Test Mode integrated
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                  Real-time webhook audit
                </span>
              </div>
            </div>

            {/* Product Decision Card */}
            <div className="surface-card rounded-3xl p-6 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Weekend trip</p>
                  <p className="mt-1 text-xs text-black/45">
                    4 people deciding together
                  </p>
                </div>

                <span className="rounded-full bg-black px-3 py-1 text-xs font-medium text-white">
                  Group
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
                        TrailWorks
                      </span>
                      <p className="font-medium text-slate-900">Carry-on backpack</p>
                      <p className="mt-1 text-xs text-black/50">
                        25L capacity, lightweight, cabin friendly
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-slate-950">₹4,999</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-black/40">
                        Northline
                      </span>
                      <p className="font-medium text-slate-900">Travel backpack</p>
                      <p className="mt-1 text-xs text-black/50">
                        28L capacity, laptop sleeve, durable build
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-slate-950">₹5,499</span>
                  </div>
                </div>

                <div className="surface-inset rounded-2xl p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-black/50">
                    Group recommendation
                  </p>

                  <p className="mt-2 text-sm leading-6 text-black/75">
                    The 25L option fits the shared budget of ₹5,000 and keeps the
                    cabin weight low for everyone on the trip.
                  </p>
                </div>
              </div>

              <Link
                href="/shop?mode=group"
                className="oval-pill-btn mt-6 block w-full border-black bg-black py-3.5 text-center text-xs font-bold uppercase tracking-wider text-white transition hover:bg-black/80"
              >
                Try group shopping &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="border-t border-black/10 py-16 sm:py-20">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
              How it works
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              From shopping intent to verified checkout
            </h2>
            <p className="mt-3 max-w-2xl text-base text-black/60">
              A transparent four-step flow built for clarity, group consensus and fast settlement.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="surface-card rounded-2xl p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
                1
              </div>
              <h3 className="mt-5 text-base font-semibold">State intent</h3>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Describe what you want to buy by typing or using your voice. Shop solo or invite your group.
              </p>
            </div>

            <div className="surface-card rounded-2xl p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
                2
              </div>
              <h3 className="mt-5 text-base font-semibold">Compare products</h3>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Explore real catalog items with transparent pricing, specifications, and merchant details.
              </p>
            </div>

            <div className="surface-card rounded-2xl p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
                3
              </div>
              <h3 className="mt-5 text-base font-semibold">Group approval</h3>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Review item details and secure agreement before proceeding to checkout.
              </p>
            </div>

            <div className="surface-card rounded-2xl p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
                4
              </div>
              <h3 className="mt-5 text-base font-semibold">Razorpay settlement</h3>
              <p className="mt-2 text-sm leading-6 text-black/60">
                Complete payment in Razorpay Test Mode with webhook confirmation and live audit trail.
              </p>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-4 border-t border-black/10 py-6 text-xs text-black/45 sm:flex-row sm:items-center sm:justify-between">
          <p>TOGETHER (c) 2026. A simpler way to make purchases as a group.</p>
          <div className="flex items-center gap-5">
            <Link href="/shop" className="hover:text-black">Shop</Link>
            <Link href="/group" className="hover:text-black">Groups</Link>
            <span>Razorpay Buildathon</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
