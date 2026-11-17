import type { Metadata } from "next";
import Link from "next/link";
import RemortgageClient from "./RemortgageClient";

export const metadata: Metadata = {
  title: "Fixed Rate Ending: What Does Waiting Cost, and By When? — Better Every Day",
  description:
    "Your fixed-rate mortgage is ending. What the reversion rate would cost a month, the dates to book by (your lender up to six months ahead, another lender about three), your offers side by side over the deal with the fees counted, the loan-to-value band a small overpayment could reach, and the letters to your lender.",
  openGraph: {
    title: "Fixed Rate Ending: What Does Waiting Cost, and By When? — Better Every Day",
    description:
      "Nobody chooses the standard variable rate; it's what happens when nobody chooses. What each month on it costs, the dates to book by, and your offers side by side.",
    type: "website",
  },
};

export default function RemortgagePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Fixed rate ending: what does waiting cost, and by when?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          When a fixed-rate mortgage deal ends, the loan doesn&rsquo;t stop. It moves to the lender&rsquo;s reversion
          rate, the &ldquo;standard variable rate&rdquo;, which is usually two or three points above any deal on
          offer, and it stays there until you pick something else. Nobody chooses it. Under the Mortgage Charter you
          can book your next deal with your own lender up to six months ahead, with no new affordability check if
          you&rsquo;re up to date, and ask for a cheaper one if rates fall before it starts.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool prices a month on the reversion rate against your offers, dates the bookings, puts your quotes
          side by side over the deal with the fees counted, checks whether a small overpayment would reach a cheaper
          loan-to-value band, and writes the messages to your lender.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For homeowners anywhere in the UK with a residential mortgage; buy-to-let works differently. It isn&rsquo;t
          financial advice, and a broker can see deals you can&rsquo;t. Nothing you enter is sent anywhere; it stays in
          your browser. Paying several debts at once? See{" "}
          <Link href="/debts" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            which debt first
          </Link>
          .
        </p>
      </header>
      <RemortgageClient />
    </div>
  );
}
