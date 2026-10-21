import type { Metadata } from "next";
import Link from "next/link";
import SellClient from "./SellClient";

export const metadata: Metadata = {
  title: "Sell It, Keep It, or Let It Go? — Better Every Day",
  description:
    "The bike in the hall, the camera in a drawer, last year's phone. Ask the buyer's question, price it from what similar ones sold for rather than what you paid, and get the listing, the lowest offer to take, and the reply to a lowball, or a dated box if you're not sure.",
  openGraph: {
    title: "Sell It, Keep It, or Let It Go? — Better Every Day",
    description:
      "Would you buy it today for what it would fetch? If not, it goes: priced from what similar ones sold for, never from what you paid.",
    type: "website",
  },
};

export default function SellPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Sell it, keep it, or let it go?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The bike in the hall you rode twice last year. The camera in a
          drawer. The pram the youngest grew out of, last year&rsquo;s phone,
          the stand mixer. Each one stays because deciding about it never
          quite comes up.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Owning a thing makes it look worth more than it is, and what you
          paid for it keeps setting the price in your head. This tool asks{" "}
          <strong>the buyer&rsquo;s question</strong>: if you didn&rsquo;t
          have it, would you buy it today for what it would sell for? Then it
          prices it from what similar ones actually sold for, and gives you
          the listing, the lowest offer to take, and the reply to a lowball.
          If you&rsquo;re not sure, it gives the box a date.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If it&rsquo;s broken and you&rsquo;re deciding whether to repair it,
          try{" "}
          <Link
            href="/fix"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            fix it or replace it
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <SellClient />
    </div>
  );
}
