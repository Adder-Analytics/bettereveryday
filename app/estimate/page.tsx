import type { Metadata } from "next";
import Link from "next/link";
import EstimateClient from "./EstimateClient";

export const metadata: Metadata = {
  title: "Estimation trainer — Better Every Day",
  description:
    "How many piano tuners work in Chicago? You can get within a factor of two without looking anything up — by breaking the question into pieces you can estimate. Practise Fermi estimation: decompose a hard quantity, or take one-shot order-of-magnitude guesses and see how far off you were.",
  openGraph: {
    title: "Estimation trainer — Better Every Day",
    description:
      "Manufacture a defensible number for almost any quantity by breaking it into estimable pieces. A trainer for Fermi estimation — the most useful math most people never practise.",
    type: "website",
  },
};

export default function EstimatePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Estimation trainer
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Most useful questions don&rsquo;t come with the number attached. How big
          is this market? How long will this take? Is that policy&rsquo;s price tag
          even plausible? Faced with a quantity they can&rsquo;t look up, most
          people freeze, or wave a hand. There&rsquo;s a third option, and it&rsquo;s a
          skill: break the question into smaller pieces you <em>can</em> guess, and
          multiply. The pieces are each rough, but their errors tend to cancel, so
          the product lands far closer than any single guess — usually within a
          factor of two or three.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Enrico Fermi was famous for it — estimating the number of piano tuners
          in Chicago, or a nuclear blast&rsquo;s yield from how far scraps of paper
          blew. The technique long outlived the physics. It&rsquo;s arguably the most
          useful math a person can own, and almost nobody practises it. This is a
          place to.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Two modes below. <span className="text-[var(--foreground)]">Decompose</span>{" "}
          walks one hard problem: guess first, then build the answer from its parts
          and watch the parts win.{" "}
          <span className="text-[var(--foreground)]">One-shot</span> tests the
          instinct on quantities that span orders of magnitude, scoring how many
          factors of ten you were off. Everything stays in your browser; your
          record builds across rounds.
        </p>
      </header>

      <EstimateClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          The method and why it works:{" "}
          <Link
            href="/writing/guessing-on-purpose"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            How to Guess on Purpose
          </Link>{" "}
          and{" "}
          <Link
            href="/writing/orders-of-magnitude"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            How to Think in Orders of Magnitude
          </Link>
          . The model behind it:{" "}
          <Link
            href="/models#fermi-estimation"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Fermi Estimation
          </Link>
          . Its companion skill — whether the confidence on your estimate is
          honest — is the{" "}
          <Link
            href="/calibrate"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            calibration trainer
          </Link>
          ; both, with the base-rate trainer, sit together on the{" "}
          <Link
            href="/practice"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            practice page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
