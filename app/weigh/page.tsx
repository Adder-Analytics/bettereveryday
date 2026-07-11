import type { Metadata } from "next";
import Link from "next/link";
import WeighClient from "./WeighClient";

export const metadata: Metadata = {
  title: "The Flip Point — Better Every Day",
  description:
    "Stop arguing about the exact probability. Find the threshold where a decision flips — p* = R/(B+R) — and just ask which side you're on. Pauker & Kassirer's treatment-threshold approach, turned into a tool for any either/or call.",
  openGraph: {
    title: "The Flip Point — Better Every Day",
    description:
      "The honest form of expected value: not 'act' or 'don't,' but the probability at which the two break even — and whether you're clearly on one side of it.",
    type: "website",
  },
};

export default function WeighPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          The flip point
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Two people can argue all afternoon about whether the odds are 60% or
          70% and never notice they agree on the decision — because it flips at
          40%, and they&rsquo;re both well above it. The argument is about the
          wrong thing. This tool finds the right thing: the{" "}
          <em>threshold</em> — the probability at which{" "}
          <Link
            href="/models#expected-value"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            acting and not acting
          </Link>{" "}
          break even — and then asks the only question that matters. Are you
          clearly on one side of it, or is this too close for the numbers to
          decide?
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          It comes from medicine. Rather than pin down the exact probability a
          patient is sick, Pauker and Kassirer (<em>NEJM</em>, 1980) had
          clinicians find the <em>treatment threshold</em> — the probability at
          which treating and not treating are a wash — and simply ask whether the
          patient sits above or below it. The unanswerable question (&ldquo;what
          are the exact odds?&rdquo;) becomes an easy one (&ldquo;which side of
          the line?&rdquo;). Give the tool the stakes and your honest
          probability; it draws the line and shows you where you stand.
        </p>
      </header>

      <WeighClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you enter here leaves your browser. The thinking behind the
          tool — why the threshold beats the estimate, when expected value is the
          wrong frame entirely, and how your{" "}
          <Link
            href="/calibrate"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            calibration
          </Link>{" "}
          record cashes in here — is in{" "}
          <Link
            href="/writing/the-flip-point"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The Flip Point
          </Link>
          . The one-screen version lives in the reference:{" "}
          <Link
            href="/models#expected-value"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Expected Value
          </Link>{" "}
          and{" "}
          <Link
            href="/models#decision-threshold"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The Decision Threshold
          </Link>
          . Facing something bigger than an either/or? Run a{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem
          </Link>{" "}
          first, then log the call in the{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
