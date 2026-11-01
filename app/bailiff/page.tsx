import type { Metadata } from "next";
import Link from "next/link";
import BailiffClient from "./BailiffClient";

export const metadata: Metadata = {
  title: "A Bailiff's Letter: What Can They Actually Do? — Better Every Day",
  description:
    "A notice of enforcement for council tax, a parking charge, a fine or a judgment. See the first day a bailiff can call, the fees that should be on it under the May 2026 rules, what they can and can't do, and the offer to send before the knock.",
  openGraph: {
    title: "A Bailiff's Letter: What Can They Actually Do? — Better Every Day",
    description:
      "Each stage of enforcement adds a fixed fee. The cheapest day to deal with a bailiff's letter is the day it arrives.",
    type: "website",
  },
};

export default function BailiffPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          A bailiff&rsquo;s letter: what can they actually do?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A &ldquo;notice of enforcement&rdquo; arrives about council tax, a
          parking charge, a court fine or a judgment. £79 has already been
          added, and it says a bailiff will call to take goods. Or a debt
          collector writes about a &ldquo;field agent&rdquo; visiting. Most
          people either put the letter in a drawer or pay money they need for
          rent.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Enforcement runs in stages, and each one adds a fixed fee: £247 or
          more the moment a bailiff visits. So the stage you&rsquo;re at decides
          most of it. This tool reads that stage, dates the first day a bailiff
          can call under the rules that changed on 1 May 2026, says what they
          can and can&rsquo;t do, and writes the offer to send before then.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For England and Wales; Scotland and Northern Ireland get a pointer to
          the right free advice. It isn&rsquo;t legal advice, and nothing you
          enter is sent anywhere; it stays in your browser. If it&rsquo;s an
          old card or phone debt with no court judgment, try{" "}
          <Link
            href="/collector"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            an old debt, a new letter
          </Link>
          .
        </p>
      </header>
      <BailiffClient />
    </div>
  );
}
