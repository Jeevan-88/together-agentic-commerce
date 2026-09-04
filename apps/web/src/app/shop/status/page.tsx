"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "../../../components/Header";

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
  details?: unknown;
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
      return "Payment confirmed";
    case "FAILED":
      return "Payment failed";
    case "CANCELLED":
      return "Purchase cancelled";
    case "PAYMENT_PROCESSING":
      return "Payment processing";
    case "PENDING_PAYMENT":
      return "Ready for payment";
    default:
      return status.replaceAll("_", " ");
  }
}

function statusDescription(status: string) {
  switch (status) {
    case "PAID":
      return "Your payment has been reconciled and settled successfully through Razorpay.";
    case "FAILED":
      return "The transaction could not be completed or was rejected.";
    case "CANCELLED":
      return "This purchase order has been cancelled.";
    case "PAYMENT_PROCESSING":
      return "Payment was received. Awaiting final webhook reconciliation.";
    case "PENDING_PAYMENT":
      return "The purchase has been approved and is awaiting payment checkout.";
    default:
      return "The purchase order is being processed.";
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
      setError("Purchase ID was not specified.");
      setIsLoading(false);
      return;
    }

    let active = true;

    const loadStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const response = await fetch(
          `${apiUrl}/api/audit/purchases/${purchaseId}`,
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to load purchase status");
        }

        if (!active) return;

        setPurchase(data.purchase);
        setAudit(Array.isArray(data.audit) ? data.audit : []);
        setError("");
      } catch (err) {
        if (!active) return;
        console.error("Failed to load purchase status:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load purchase status.",
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
          <div className="surface-card rounded-2xl p-8 text-center">
            <p className="text-sm font-medium text-black/60">
              Loading purchase audit records...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !purchase) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6">
          <div className="surface-card w-full max-w-lg rounded-3xl p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold">Status unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-black/55">
              {error || "Could not find record of this purchase."}
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white"
            >
              Start shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isPaid = purchase.status === "PAID";
  const isFailed = purchase.status === "FAILED" || purchase.status === "CANCELLED";
  const approvalComplete = purchase.approval?.status === "APPROVED";
  const paymentVerified =
    purchase.payment?.status === "AUTHORIZED" ||
    purchase.payment?.status === "CAPTURED";

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-6 sm:px-10">
        <Header currentStep="Order Status" />

        <section className="mx-auto w-full max-w-3xl py-10 sm:py-14">
          {/* Hero Status Badge */}
          <div className="text-center">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm text-2xl font-bold ${
                isPaid
                  ? "bg-black text-white"
                  : isFailed
                    ? "bg-red-100 text-red-700"
                    : "bg-white text-black border border-black/10"
              }`}
            >
              {isPaid ? "✓" : isFailed ? "!" : "•"}
            </div>

            <span className="mt-5 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-black/45">
              Purchase Lifecycle
            </span>

            <h1 className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
              {statusLabel(purchase.status)}
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-base text-black/60">
              {statusDescription(purchase.status)}
            </p>
          </div>

          {/* Main Card */}
          <div className="surface-card mt-10 overflow-hidden rounded-3xl shadow-sm">
            {/* Header: Item & Total */}
            <div className="border-b border-black/10 p-6 sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-black/45">
                    {purchase.items[0]?.merchantName || "Merchant"}
                  </span>
                  <h2 className="mt-1 text-2xl font-semibold text-slate-950">
                    {purchase.items[0]?.productName || "Purchase Item"}
                  </h2>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium text-black/65">
                      {purchase.mode === "GROUP" ? "Group purchase" : "Solo purchase"}
                    </span>
                    {purchase.payment?.razorpayPaymentId && (
                      <span className="text-xs font-mono text-black/50">
                        Payment: {purchase.payment.razorpayPaymentId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs text-black/40">Total</span>
                  <p className="mt-0.5 text-3xl font-semibold text-slate-950">
                    {formatAmount(purchase.totalPaise, purchase.currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Flow */}
            <div className="border-b border-black/10 p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-black/45">
                Verification Progress
              </span>

              <div className="mt-5 space-y-4">
                {[
                  { label: "Purchase intent created and validated", done: true },
                  { label: "Approval recorded", done: approvalComplete },
                  { label: "Payment order authorized", done: paymentVerified },
                  { label: "Settlement confirmed via webhook / capture", done: isPaid },
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3.5">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        step.done
                          ? "bg-black text-white"
                          : "border border-black/15 bg-black/5 text-transparent"
                      }`}
                    >
                      {step.done ? "✓" : ""}
                    </div>
                    <span
                      className={`text-sm ${
                        step.done ? "font-medium text-slate-950" : "text-black/40"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Group Members Section if Group Mode */}
            {purchase.group && (
              <div className="border-b border-black/10 p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-black/45">
                    Shopping Group
                  </span>
                  <span className="text-xs font-medium text-black/50">
                    {purchase.group.members.length} members
                  </span>
                </div>

                <h3 className="mt-1 text-lg font-semibold text-slate-950">
                  {purchase.group.name}
                </h3>

                <div className="mt-4 space-y-2">
                  {purchase.group.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-xl border border-black/5 bg-black/[0.02] px-4 py-2.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-black">
                          {member.name}
                        </p>
                        <p className="text-xs text-black/45">{member.email}</p>
                      </div>

                      <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-[11px] font-semibold text-black/60">
                        {member.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Original Request */}
            <div className="border-b border-black/10 p-6 sm:p-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-black/45">
                Initial Request
              </span>
              <div className="surface-inset mt-3 rounded-2xl p-4">
                <p className="text-sm leading-6 text-black/75">
                  {purchase.requestText}
                </p>
              </div>
            </div>

            {/* Activity Audit Timeline */}
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-black/45">
                  Audit Trail
                </span>
                <span className="text-[11px] text-black/40">
                  Auto-updating live
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {audit.length === 0 ? (
                  <p className="text-xs text-black/40">No audit events logged yet.</p>
                ) : (
                  audit.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 border-b border-black/5 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-black/40" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-900">
                          {entry.action.replaceAll("_", " ")}
                        </p>
                        <p className="mt-0.5 text-[11px] text-black/45">
                          {new Date(entry.createdAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/shop"
              className="rounded-xl border border-black/15 bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-black/5"
            >
              Start another purchase
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
            <p className="text-sm text-black/50">Loading purchase status...</p>
          </div>
        </main>
      }
    >
      <StatusContent />
    </Suspense>
  );
}
