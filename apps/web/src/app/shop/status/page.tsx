"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type PurchaseStatus = {
  id: string;
  mode: "SOLO" | "GROUP";
  status: string;
  totalPaise: number;
  currency: string;
  requestText: string;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productName: string;
    merchantName: string;
    unitPricePaise: number;
    quantity: number;
  }>;
  approval: {
    status: string;
    approvedAt: string | null;
  } | null;
  payment: {
    status: string;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    capturedAt: string | null;
  } | null;
  group: {
    id: string;
    name: string;
    members: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
    }>;
  } | null;
};

type AuditEntry = {
  id: string;
  action: string;
  createdAt: string;
};

function formatAmount(amountPaise: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountPaise / 100);
}

function statusLabel(status: string) {
  switch (status) {
    case "PAID":
      return "Payment complete";
    case "FAILED":
      return "Payment failed";
    case "CANCELLED":
      return "Purchase cancelled";
    case "PAYMENT_PROCESSING":
      return "Payment processing";
    case "PENDING_PAYMENT":
      return "Approved for payment";
    default:
      return status.replaceAll("_", " ");
  }
}

function statusDescription(status: string) {
  switch (status) {
    case "PAID":
      return "The payment has been confirmed successfully.";
    case "FAILED":
      return "The payment could not be completed.";
    case "CANCELLED":
      return "This purchase has been cancelled.";
    case "PAYMENT_PROCESSING":
      return "The payment was verified. We are waiting for final confirmation.";
    case "PENDING_PAYMENT":
      return "The purchase is approved and ready for payment.";
    default:
      return "The purchase is being processed.";
  }
}

function StatusContent() {
  const searchParams = useSearchParams();
  const purchaseId = searchParams.get("purchaseId");

  const [purchase, setPurchase] = useState<PurchaseStatus | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!purchaseId) {
      setError("Purchase ID is missing.");
      setIsLoading(false);
      return;
    }

    let active = true;

    const loadStatus = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/audit/purchases/${purchaseId}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Failed to load purchase status",
          );
        }

        if (!active) return;

        setPurchase(data.purchase);
        setAudit(Array.isArray(data.audit) ? data.audit : []);
        setError("");
      } catch (err) {
        if (!active) return;

        console.error("Failed to load purchase status:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load purchase status.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadStatus();

    const interval = window.setInterval(loadStatus, 3000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [purchaseId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
          <p className="text-sm text-black/50">
            Loading purchase status...
          </p>
        </div>
      </main>
    );
  }

  if (error || !purchase) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold">
              Purchase status unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-black/50">
              {error || "We could not find this purchase."}
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 text-sm font-medium text-white"
            >
              Start again
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isPaid = purchase.status === "PAID";
  const isFailed =
    purchase.status === "FAILED" ||
    purchase.status === "CANCELLED";

  const approvalComplete =
    purchase.approval?.status === "APPROVED";

  const paymentVerified =
    purchase.payment?.status === "AUTHORIZED" ||
    purchase.payment?.status === "CAPTURED";

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto min-h-screen max-w-5xl px-6 py-8 sm:px-10">
        <header className="flex items-center justify-between border-b border-black/10 pb-5">
          <Link
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
          </Link>

          <Link
            href="/shop"
            className="text-sm text-black/50 transition hover:text-black"
          >
            New purchase
          </Link>
        </header>

        <section className="mx-auto max-w-3xl py-14">
          <div className="text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
                isPaid
                  ? "bg-black text-white"
                  : isFailed
                    ? "bg-red-100 text-red-700"
                    : "bg-black/5 text-black"
              }`}
            >
              {isPaid ? "✓" : isFailed ? "!" : "…"}
            </div>

            <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-black/40">
              Purchase status
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
              {statusLabel(purchase.status)}
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-black/55">
              {statusDescription(purchase.status)}
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
            <div className="border-b border-black/10 p-6 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                    {purchase.items[0]?.merchantName || "Merchant"}
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {purchase.items[0]?.productName || "Purchase"}
                  </h2>

                  <p className="mt-2 text-sm text-black/50">
                    {purchase.mode === "GROUP"
                      ? "Group purchase"
                      : "Solo purchase"}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-black/40">
                    Total
                  </p>

                  <p className="mt-1 text-3xl font-semibold tracking-tight">
                    {formatAmount(
                      purchase.totalPaise,
                      purchase.currency,
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-b border-black/10 p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                Purchase progress
              </p>

              <div className="mt-6 space-y-5">
                {[
                  {
                    label: "Purchase created",
                    done: true,
                  },
                  {
                    label: "Approval granted",
                    done: approvalComplete,
                  },
                  {
                    label: "Payment verified",
                    done: paymentVerified,
                  },
                  {
                    label: "Payment confirmed",
                    done: isPaid,
                  },
                ].map((step) => (
                  <div
                    key={step.label}
                    className="flex items-center gap-4"
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        step.done
                          ? "bg-black text-white"
                          : "bg-black/5 text-black/35"
                      }`}
                    >
                      {step.done ? "✓" : ""}
                    </div>

                    <span
                      className={`text-sm ${
                        step.done
                          ? "font-medium text-black"
                          : "text-black/35"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {purchase.group && (
              <div className="border-b border-black/10 p-6 sm:p-8">
                <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                  Group
                </p>

                <h3 className="mt-2 text-lg font-semibold">
                  {purchase.group.name}
                </h3>

                <div className="mt-5 space-y-3">
                  {purchase.group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-2xl bg-[#f5f5f3] p-4"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {member.name}
                        </p>

                        <p className="mt-1 text-xs text-black/45">
                          {member.email}
                        </p>
                      </div>

                      <span className="text-xs font-medium uppercase tracking-wide text-black/40">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-b border-black/10 p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                Request
              </p>

              <div className="mt-4 rounded-2xl bg-[#f5f5f3] p-5">
                <p className="text-sm leading-7 text-black/65">
                  {purchase.requestText}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-black/40">
                Activity
              </p>

              <div className="mt-6 space-y-4">
                {audit.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex gap-4 border-b border-black/5 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-black/30" />

                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {entry.action.replaceAll("_", " ")}
                      </p>

                      <p className="mt-1 text-xs text-black/40">
                        {new Date(entry.createdAt).toLocaleString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/shop"
              className="text-sm font-medium text-black/45 transition hover:text-black"
            >
              Start a new purchase
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-sm text-black/50">
              Loading purchase status...
            </p>
          </div>
        </main>
      }
    >
      <StatusContent />
    </Suspense>
  );
}