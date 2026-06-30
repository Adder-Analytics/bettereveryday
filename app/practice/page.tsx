import type { Metadata } from "next";
import Link from "next/link";
import PracticeClient from "./PracticeClient";

export const metadata: Metadata = {
  title: "Practice — Better Every Day",
  description:
    "Three short trainers for the three numbers under every decision: how sure you are, how to get to a number at all, and how much a new fact should change your mind. See your whole judgement profile in one place — calibration, estimation, and base rates — and find the weakest of the three.",
  openGraph: {
    title: "Practice — Better Every Day",
    description:
      "Calibration, estimation, and base rates are three faces of one skill: putting honest numbers on an uncertain world. One page for all three records — and a nudge toward the next ten minutes.",
    type: "website",
  },
};

export default function PracticePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Practice
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Underneath almost every real decision are the same three questions, and
          you answer all of them in an instant whether you mean to or not:{" "}
          <span className="text-[var(--foreground)]">how sure am I</span>,{" "}
          <span className="text-[var(--foreground)]">what&rsquo;s my best guess</span>, and{" "}
          <span className="text-[var(--foreground)]">
            how much should this new thing change my mind
          </span>
          . Each has a wrong answer most people reach for by default — too
          confident, frozen, or knocked around by the latest loud fact. And each,
          unlike most things worth getting better at, is a skill that will tell you
          your score.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Three short trainers, one for each number. This page reads all three of
          your records — kept privately in your browser — and shows them together,
          so you can see which of the three your judgement is weakest on and spend
          the next ten minutes there.
        </p>
      </header>

      <PracticeClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          The idea behind all three:{" "}
          <Link
            href="/writing/three-numbers-for-an-uncertain-world"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Three Numbers for an Uncertain World
          </Link>
          . Each skill also has its own essay and model — linked from its trainer.
          And the place they all come together is the{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>
          , where you estimate an outcome, put honest error bars on it, and update
          when reality reports back.
        </p>
      </div>
    </div>
  );
}
