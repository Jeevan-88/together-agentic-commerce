import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-10">
        <header className="flex items-center justify-between border-b border-black/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
              T
            </div>

            <span className="text-lg font-semibold tracking-tight">
              TOGETHER
            </span>
          </div>

          <div className="hidden items-center gap-6 text-sm text-black/60 sm:flex">
            <button className="transition hover:text-black">
              How it works
            </button>
            <button className="transition hover:text-black">
              Activity
            </button>
          </div>
        </header>

        <section className="flex flex-1 items-center py-20">
          <div className="grid w-full gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <p className="mb-5 text-sm font-medium uppercase tracking-[0.2em] text-black/50">
                Group commerce
              </p>

              <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Decide together.
                <br />
                Buy with confidence.
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-black/60">
                Tell TOGETHER what you are looking for, compare the options,
                bring everyone into the decision, and complete the purchase
                when the group is ready.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/shop"
                  className="rounded-xl bg-black px-6 py-3.5 text-center text-sm font-medium text-white transition hover:bg-black/80"
                >
                  Start shopping
                </Link>

                <button className="rounded-xl border border-black/15 bg-white px-6 py-3.5 text-sm font-medium transition hover:bg-black/5">
                  Create a group
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Weekend trip</p>
                  <p className="mt-1 text-xs text-black/45">
                    4 people deciding together
                  </p>
                </div>

                <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
                  Group
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-black/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">Carry-on backpack</p>
                      <p className="mt-1 text-sm text-black/50">
                        Lightweight, cabin friendly
                      </p>
                    </div>

                    <span className="text-sm font-semibold">₹4,999</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">Travel backpack</p>
                      <p className="mt-1 text-sm text-black/50">
                        More space, stronger build
                      </p>
                    </div>

                    <span className="text-sm font-semibold">₹5,499</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f4f4f2] p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-black/45">
                    Group decision
                  </p>

                  <p className="mt-2 text-sm leading-6">
                    The first option fits the shared budget and keeps the
                    weight low for everyone.
                  </p>
                </div>
              </div>

              <button className="mt-5 w-full rounded-xl bg-black py-3 text-sm font-medium text-white">
                Review purchase
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-black/10 py-5 text-xs text-black/40">
          TOGETHER · A simpler way to make purchases as a group
        </footer>
      </div>
    </main>
  );
}