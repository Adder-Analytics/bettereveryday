import type { Metadata } from "next";
import Link from "next/link";
import DebtsClient from "./DebtsClient";

export const metadata: Metadata = {
  title: "Which Debt First? — Better Every Day",
  description:
    "Two cards, an overdraft and a loan, and one amount a month. After the minimums, which one gets the rest? Run the costliest-first, smallest-first and spread-around orders on your own debts and see what each one really costs.",
  openGraph: {
    title: "Which Debt First? — Better Every Day",
    description:
      "Costliest first or smallest first? See what the quick win really costs on your own debts, when each one goes, and why paying more than the minimum matters more than either.",
    type: "website",
  },
};

export default function DebtsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Which debt first?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A credit card at 24.9%, a store card at 29.9%, an overdraft, a
          loan. There&rsquo;s an amount you can put towards them each month,
          and once the minimums are paid, the question is where the rest goes.
          The arithmetic says the highest rate. The popular advice says the
          smallest balance, for the win. Most people do neither: they spread
          it around, which is the one order with nothing going for it.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool runs all three on <strong>your own debts</strong>, month by
          month. It says what the quick win really costs, gives you this
          month&rsquo;s payments and the month each debt goes, and shows the
          number that usually matters more than the order: what paying more
          than the minimum is worth.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If a new payment plan is about to join the list, try{" "}
          <Link
            href="/monthly"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pay now or pay monthly
          </Link>{" "}
          first. This is arithmetic, not financial advice, and nothing you
          enter is sent anywhere; it stays in your browser. If you can&rsquo;t
          cover the minimums, free debt advice (StepChange or National Debtline
          in the UK, an NFCC counsellor in the US) comes before any order.
        </p>
      </header>
      <DebtsClient />
    </div>
  );
}
