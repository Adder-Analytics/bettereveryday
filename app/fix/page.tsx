import type { Metadata } from "next";
import Link from "next/link";
import FixClient from "./FixClient";

export const metadata: Metadata = {
  title: "Fix It or Replace It? — Better Every Day",
  description:
    "The washing machine, the laptop, the car with a big garage quote. Turn a repair quote into one number you can judge: how long the repair has to keep it going to beat buying new.",
  openGraph: {
    title: "Fix It or Replace It? — Better Every Day",
    description:
      "Divide the quote by what a new one costs per year of use. That's how long the repair has to last. The rest is whether you believe it will.",
    type: "website",
  },
};

export default function FixPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Fix it or replace it?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The washing machine needs a new bearing. The laptop needs a battery.
          The garage has rung with a number. You&rsquo;re standing between a
          repair quote and the price of a new one, and both feel wrong.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The feel gets pulled both ways. What you&rsquo;ve already spent says
          keep it going; the shiny new model says let it go. The usual rule of
          thumb, never spend more than half the price of a new one, hides the
          one thing that matters. This tool turns the quote into{" "}
          <strong>how long the repair has to last</strong>{" "}to beat buying
          new, which is a question you can actually answer.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If it&rsquo;s a bigger thing you&rsquo;ve sunk years into, like a
          project or a job, try{" "}
          <Link
            href="/quit"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            the quit-or-stay test
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <FixClient />
    </div>
  );
}
