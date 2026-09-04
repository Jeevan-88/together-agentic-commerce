"use client";

import Script from "next/script";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";

declare global {
  interface Window {
    Razorpay: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description: string;
      order_id: string;
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => void;
      modal?: {
        ondismiss?: () => void;
      };
    }) => {
      open: () => void;
    };
  }
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const purchaseId = searchParams.get("purchaseId");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [purchaseDetails, setPurchaseDetails] = useState<{
    productName?: string;
    merchantName?: string;
    totalPaise?: number;
    mode?: string;
  } | null>(null);

  useEffect(() => {
    if (!purchaseId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${apiUrl}/api/audit/purchases/${purchaseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.purchase) {
          const item = data.purchase.items?.[0];
          setPurchaseDetails({
            productName: item?.productName,
            merchantName: item?.merchantName,
            totalPaise: data.purchase.totalPaise,
            mode: data.purchase.mode,
          });
        }
      })
      .catch(() => {});
  }, [purchaseId]);

  async function startPayment() {
    if (!purchaseId) {
      setError("Purchase ID is missing.");
      return;
    }

    if (!window.Razorpay) {
      setError("Payment checkout is still loading. Please wait a moment and try again.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const orderResponse = await fetch(
        `${apiUrl}/api/purchases/${purchaseId}/payment-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(
          orderData.message || "Failed to create payment order.",
        );
      }

      const checkout = new window.Razorpay({
        key: orderData.payment.keyId,
        amount: orderData.payment.amountPaise,
        currency: orderData.payment.currency,
        name: "TOGETHER",
        description: "Purchase through TOGETHER",
        order_id: orderData.orderId,

        handler: async (response) => {
          try {
            setMessage("Verifying payment with Razorpay...");
            setError("");

            const verifyResponse = await fetch(
              `${apiUrl}/api/purchases/${purchaseId}/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                }),
              },
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(
                verifyData.message || "Payment verification failed.",
              );
            }

            router.push(
              `/shop/status?purchaseId=${encodeURIComponent(purchaseId)}`,
            );
          } catch (err) {
            console.error("Payment verification failed:", err);
            setMessage("");
            setError(
              err instanceof Error
                ? err.message
                : "Payment verification failed.",
            );
            setIsLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setIsLoading(false);
            setMessage("");
          },
        },
      });

      checkout.open();
    } catch (err) {
      console.error("Payment initialization failed:", err);
      setError(
        err instanceof Error ? err.message : "Unable to start payment.",
      );
      setIsLoading(false);
    }
  }

  if (!purchaseId) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-6">
          <div className="surface-card w-full rounded-3xl p-8 text-center">
            <h1 className="text-2xl font-semibold">Purchase not identified</h1>
            <p className="mt-2 text-sm text-black/50">
              A valid purchase identifier was not provided.
            </p>
            <Link
              href="/shop"
              className="oval-pill-btn mt-6 inline-block border-black bg-black px-6 py-3 text-xs font-bold uppercase tracking-wider text-white"
            >
              Start a new purchase
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const formattedAmount = purchaseDetails?.totalPaise
    ? `₹${(purchaseDetails.totalPaise / 100).toLocaleString("en-IN")}`
    : null;

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-6 sm:px-10">
          <Header currentStep="Checkout" />

          <section className="mx-auto w-full max-w-xl py-12 text-center sm:py-16">
            <div className="mb-4 text-left">
              <button
                type="button"
                onClick={() => router.back()}
                className="oval-pill-btn mb-2 border-black/20 bg-white text-[10px] text-black/60 transition hover:border-black hover:text-black"
              >
                &larr; Back to Proposal
              </button>
            </div>

            <div className="surface-card rounded-3xl p-8 shadow-sm sm:p-10">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-black/45">
                Razorpay Checkout
              </span>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Complete your payment
              </h1>

              {purchaseDetails?.productName && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/5 px-4 py-1.5 text-xs">
                  <span className="font-bold text-slate-950">{purchaseDetails.productName}</span>
                  {purchaseDetails.merchantName && (
                    <span className="text-black/50">({purchaseDetails.merchantName})</span>
                  )}
                  {formattedAmount && (
                    <span className="font-bold text-emerald-700">&bull; {formattedAmount}</span>
                  )}
                </div>
              )}

              <p className="mt-3 text-sm leading-6 text-black/60">
                Your purchase has been approved and validated. Click below to launch
                the Razorpay Test Mode checkout modal.
              </p>

              <div className="surface-inset my-6 rounded-2xl p-4 text-left">
                <div className="flex items-center justify-between text-xs text-black/50">
                  <span>Reference ID</span>
                  <span className="font-mono text-black/75">{purchaseId.slice(0, 18)}...</span>
                </div>
                {formattedAmount && (
                  <div className="mt-2 flex items-center justify-between text-xs text-black/50">
                    <span>Order Total</span>
                    <span className="font-bold text-slate-950">{formattedAmount}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between text-xs text-black/50">
                  <span>Payment Gateway</span>
                  <span className="font-semibold text-black">Razorpay Standard</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-black/50">
                  <span>Environment</span>
                  <span className="rounded bg-black/5 px-2 py-0.5 text-[10px] font-semibold uppercase text-black/70">
                    Test Mode (Simulated)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={startPayment}
                disabled={isLoading}
                className="oval-pill-btn w-full border-black bg-black py-4 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Opening Razorpay checkout..." : `Pay ${formattedAmount || ""} securely with Razorpay`}
              </button>

              {message && (
                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs font-medium text-sky-800">
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <p className="mt-6 text-[11px] text-black/40">
                Test Mode: Use simulated card or UPI in the Razorpay modal. No real funds are debited.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
          <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
            <p className="text-sm text-black/50">Loading checkout...</p>
          </div>
        </main>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
