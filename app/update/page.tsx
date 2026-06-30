import type { Metadata } from "next";
import Link from "next/link";
import UpdateClient from "./UpdateClient";

export const metadata: Metadata = {
  title: "Base-rate trainer — Better Every Day",
  description:
    "A test is 99% accurate and you test positive for a 1-in-1,000 disease — so what's the chance you have it? Almost everyone says 99%. It's about 9%. Practise updating on evidence the way the numbers actually demand: weigh a result against how rare the thing was to begin with, and watch the base rate do the work.",
  openGraph: {
    title: "Base-rate trainer — Better Every Day",
    description:
      "How much should a test result, an alarm, or a symptom actually move you? A trainer for Bayesian updating — and for catching the near-universal habit of trusting the test and forgetting the base rate.",
    type: "website",
  },
};

export default function UpdatePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Base-rate trainer
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A test for a disease is 99% accurate, and you test positive. The disease
          affects 1 person in 1,000. How worried should you be? Nearly everyone —
          including, in the famous studies, most doctors — answers something near
          99%. The real answer is about 9%. The test is fine; the mistake is
          forgetting how rare the disease was to start with, so that the few false
          positives from the enormous healthy majority swamp the genuine cases.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          That mistake — fixating on the evidence and ignoring the base rate — is
          one of the most common and most consequential errors in human judgement.
          It&rsquo;s behind needless health scares, &ldquo;highly accurate&rdquo; screens that
          are wrong far more often than right, the fraud alert you learn to ignore.
          And the cure is almost embarrassingly simple: stop thinking in
          percentages and picture a concrete crowd of people. The same problem that
          fools you in the abstract becomes something you can just count.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Two modes below. <span className="text-[var(--foreground)]">Walk through one</span>{" "}
          takes a single scenario slowly: guess first, then watch the numbers
          redrawn as a crowd.{" "}
          <span className="text-[var(--foreground)]">A round</span> runs six quick
          ones and scores not just how far off you were, but whether you keep
          landing high — the signature of neglecting the base rate. Everything
          stays in your browser; your record builds across rounds.
        </p>
      </header>

      <UpdateClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          The idea and why it works:{" "}
          <Link
            href="/writing/how-much-should-this-change-your-mind"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            How Much Should This Change Your Mind?
          </Link>
          . The model behind it:{" "}
          <Link
            href="/models#base-rates"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Base Rates
          </Link>
          . Its companions — putting an honest number on a quantity, and an honest
          width on your confidence — are the{" "}
          <Link
            href="/estimate"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            estimation
          </Link>{" "}
          and{" "}
          <Link
            href="/calibrate"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            calibration
          </Link>{" "}
          trainers — all three together on the{" "}
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
