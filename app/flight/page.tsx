import type { Metadata } from "next";
import Link from "next/link";
import FlightClient from "./FlightClient";

export const metadata: Metadata = {
  title: "Flight Delayed or Cancelled — Better Every Day",
  description:
    "Three hours late, cancelled at short notice, or bumped. Find what UK261 or EU261 owes you per passenger, answer the reason the airline gave, get the claim to send, and the date the free escalation opens.",
  openGraph: {
    title: "Flight Delayed or Cancelled — Better Every Day",
    description:
      "£220 to £520 per passenger, fixed by distance. The claim to send yourself, the case that answers \"technical issue\", and the date you can take it to the ADR scheme or the CAA for free.",
    type: "website",
  },
};

export default function FlightPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Flight delayed or cancelled
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The board says delayed, then delayed again. You land four hours late,
          and the airline&rsquo;s email says it was &ldquo;extraordinary
          circumstances&rdquo;. Most people stop there, or give a claims
          company a share of the payout to fill in what is, underneath, one
          form.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The amounts are fixed by distance, not negotiated, and the
          airline&rsquo;s first reason is often the one that loses: a
          technical fault isn&rsquo;t extraordinary. This tool works out{" "}
          <strong>what you&rsquo;re owed per passenger</strong>, writes the
          claim with the answer to their reason in it, and gives you the date
          the free referee opens if they say no.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          UK and EU rules, with the US noted. It isn&rsquo;t legal advice, and
          nothing you enter is sent anywhere; it stays in your browser. For
          the hotel, the car hire, or anything else on the trip that went
          wrong, try{" "}
          <Link
            href="/refund"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            get your money back
          </Link>
          .
        </p>
      </header>
      <FlightClient />
    </div>
  );
}
