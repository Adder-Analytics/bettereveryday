import type { Metadata } from "next";
import Link from "next/link";
import MonthlyClient from "./MonthlyClient";

export const metadata: Metadata = {
  title: "Pay Now or Pay Monthly? — Better Every Day",
  description:
    "£649, or 12 payments of £59.99? Add up the plan, see the yearly rate it really charges, and ask the two questions that decide it: could you pay today, and would you buy it without the plan?",
  openGraph: {
    title: "Pay Now or Pay Monthly? — Better Every Day",
    description:
      "The monthly figure is the smallest number on the page. Add up the payments, turn the difference into a yearly rate, and see whether the plan is a way to pay or a reason to buy.",
    type: "website",
  },
};

export default function MonthlyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Pay now or pay monthly?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The laptop is &pound;649, or &ldquo;12 payments of &pound;59.99&rdquo;.
          The sofa is interest-free over a year. The trainers split into four
          at the checkout. The monthly figure is always in the larger type,
          and it&rsquo;s always the smallest number on the page.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Few people can see the interest rate inside a stream of payments,
          and small pieces take the sting out of a price. This tool adds the
          plan up, turns the difference into{" "}
          <strong>the yearly rate it really charges</strong>, and asks the two
          questions that decide it: could you pay today, and would you buy it
          at this price without the plan?
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If the plan is a subscription rather than a purchase, try{" "}
          <Link
            href="/keep"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            keep or cancel
          </Link>
          . This is arithmetic, not financial advice, and nothing you enter is
          sent anywhere; it stays in your browser.
        </p>
      </header>
      <MonthlyClient />
    </div>
  );
}
