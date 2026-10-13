import type { Metadata } from "next";
import Link from "next/link";
import SplitClient from "./SplitClient";

export const metadata: Metadata = {
  title: "Who Gets Which Room? — Better Every Day",
  description:
    "Housemates, unequal rooms, one rent. Each of you prices every room privately; the tool gives each room to the right person and sets rents nobody would want to swap.",
  openGraph: {
    title: "Who Gets Which Room? — Better Every Day",
    description:
      "An equal split is only fair if you all want different rooms. Price the rooms privately, and get a split where nobody would rather have someone else's room at its price.",
    type: "website",
  },
};

export default function SplitPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Who gets which room?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A new place, a few of you, rooms that aren&rsquo;t equal: one has its own
          bathroom, one is the box room over the stairs. Split the rent equally
          and someone pays the same for less. Split it by floor area and you&rsquo;ve
          priced size and nothing else. Haggle at the kitchen table and the
          answer goes to whoever speaks first or minds least.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          There&rsquo;s a better way, with a theorem behind it:{" "}
          <strong>each of you privately prices every room</strong>, and the
          rooms and rents are set so that{" "}
          <strong>
            nobody would rather have anyone else&rsquo;s room at its price
          </strong>
          . It takes about five minutes with one phone.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          The method comes from fair-division maths (Francis Su&rsquo;s{" "}
          &ldquo;Rental Harmony&rdquo;, and the Spliddit project&rsquo;s work on
          which envy-free split people find fairest). If the house has to agree
          on one number instead, like a budget, use{" "}
          <Link href="/round" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the blind round
          </Link>
          . Nothing you enter is sent anywhere; it stays in this browser.
        </p>
      </header>
      <SplitClient />
    </div>
  );
}
