"use client";

import Script from "next/script";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  async function startPayment() {
    if (!purchaseId) {
      setError("Purchase ID is missing.");
      return;
    }

    if (!window.Razorpay) {
      setError("Payment checkout is still loading. Please try again.");
      return;
    }

    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency,
        name: "TOGETHER",
        description: "Purchase through TOGETHER",
        order_id: orderData.orderId,

        handler: async (response) => {
          try {
            setMessage("Verifying payment...");
            setError("");

            const verifyResponse = await fetch(
              `${apiUrl}/api/purchases/${purchaseId}/verify-payment`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpayPaymentId:
                    response.razorpay_payment_id,
                  razorpayOrderId:
                    response.razorpay_order_id,
                  razorpaySignature:
                    response.razorpay_signature,
                }),
              },
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(
                verifyData.message ||
                  "Payment verification failed.",
              );
            }

            router.push(
              `/shop/status?purchaseId=${encodeURIComponent(
                purchaseId,
              )}`,
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
        err instanceof Error
          ? err.message
          : "Unable to start payment.",
      );

      setIsLoading(false);
    }
  }

  if (!purchaseId) {
    return (
      <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
        <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-6">
          <div className="w-full rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold">
              Purchase ID missing
            </h1>

            <p className="mt-3 text-sm text-black/50">
              We could not identify the purchase to continue.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />

      <main className="min-h-screen bg-[#f7f7f5] text-[#171717]">
        <div className="mx-auto min-h-screen max-w-4xl px-6 py-8 sm:px-10">
          <header className="border-b border-black/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
                T
              </div>

              <span className="text-lg font-semibold tracking-tight">
                TOGETHER
              </span>
            </div>
          </header>

          <section className="mx-auto max-w-xl py-20 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-black/40">
              Secure checkout
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em]">
              Complete your purchase
            </h1>

            <p className="mt-4 text-base leading-7 text-black/55">
              Your purchase has been approved. Continue to Razorpay
              Test Mode to complete the payment.
            </p>

            <button
              type="button"
              onClick={startPayment}
              disabled={isLoading}
              className="mt-10 w-full rounded-2xl bg-black px-6 py-4 text-sm font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Opening checkout..." : "Pay securely"}
            </button>

            {message && (
              <p className="mt-5 text-sm text-black/55">
                {message}
              </p>
            )}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <p className="mt-8 text-xs leading-5 text-black/35">
              This demo uses Razorpay Test Mode. No real money is
              charged.
            </p>
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
          <div className="flex min-h-screen items-center justify-center">
            <p className="text-sm text-black/50">
              Loading payment...
            </p>
          </div>
        </main>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}