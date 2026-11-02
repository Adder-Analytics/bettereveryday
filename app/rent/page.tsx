import type { Metadata } from "next";
import Link from "next/link";
import RentClient from "./RentClient";

export const metadata: Metadata = {
  title: "The Rent's Going Up: Pay It or Challenge It? — Better Every Day",
  description:
    "A landlord's notice of a new rent in England. Check the notice is valid under the May 2026 rules, see where the new rent sits against similar homes, and get the last day to ask the tribunal and the letter to send.",
  openGraph: {
    title: "The Rent's Going Up: Pay It or Challenge It? — Better Every Day",
    description:
      "Since 1 May 2026 a tribunal can't set your rent higher than the landlord asked. Check the notice, then the number against similar homes.",
    type: "website",
  },
};

export default function RentPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          The rent&rsquo;s going up: pay it or challenge it?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The landlord or the agent says the rent goes up in a couple of
          months. Most tenants pay it, because arguing feels like asking to be
          evicted, or judge it by the percentage, which says nothing about
          whether it&rsquo;s fair.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The rules changed in England on 1 May 2026. An increase now has to
          come on the official form, with two months&rsquo; notice, no more
          than once a year. And if you ask the tribunal before the start date,
          it can&rsquo;t set the rent any higher than the landlord asked. This
          tool checks the notice first, then the new rent against what similar
          homes let for, dates the last day to apply, and writes the letter.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For private renters in England; Wales, Scotland, Northern Ireland,
          social housing and lodgers get a pointer. It isn&rsquo;t legal
          advice, and nothing you enter is sent anywhere; it stays in your
          browser. Moving out instead? Try{" "}
          <Link
            href="/deposit"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            get your deposit back
          </Link>
          .
        </p>
      </header>
      <RentClient />
    </div>
  );
}
