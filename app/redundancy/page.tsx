import type { Metadata } from "next";
import Link from "next/link";
import RedundancyClient from "./RedundancyClient";

export const metadata: Metadata = {
  title: "Made Redundant: Is the Money Right? — Better Every Day",
  description:
    "Your job's going and there's a figure on the table. Work out what the law owes you anyway (redundancy pay, notice, holiday), how much of the offer is on top, the dates that matter, and the email asking for the breakdown.",
  openGraph: {
    title: "Made Redundant: Is the Money Right? — Better Every Day",
    description:
      "Split the offer into what you're owed anyway and what's on top. If you're asked to sign, only the part on top is the price of your signature.",
    type: "website",
  },
};

export default function RedundancyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Made redundant: is the money right?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Your role is going, and a figure has arrived, sometimes with an
          agreement to sign. Most people judge that figure by how big it feels.
          A lump sum of a few months&rsquo; pay feels like more than it is, and
          the total hides the question that matters: how much of it you&rsquo;re
          owed anyway.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool works out the three things the law gives you whether or not
          you sign anything: statutory redundancy pay, notice pay and the
          holiday you haven&rsquo;t taken. Then it shows how much of the offer
          is on top, turns it into months of your outgoings, dates the time
          limits and writes the email asking for the breakdown.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For employees in England, Wales, Scotland and Northern Ireland, on
          the rates from 6 April 2026. It isn&rsquo;t legal advice, and nothing
          you enter is sent anywhere; it stays in your browser. Setting your
          line before a negotiation? Try{" "}
          <Link href="/walkaway" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            your walk-away point
          </Link>
          .
        </p>
      </header>
      <RedundancyClient />
    </div>
  );
}
