import type { Metadata } from "next";
import Link from "next/link";
import PremortemClient from "./PremortemClient";

export const metadata: Metadata = {
  title: "Pre-mortem — Better Every Day",
  description:
    "A guided pre-mortem: declare the plan dead before it starts, write the history of the failure, then turn every cause into a plan change, a tripwire, or a risk you accept on purpose. Gary Klein's technique, runnable solo in twenty minutes.",
  openGraph: {
    title: "Pre-mortem — Better Every Day",
    description:
      "It's a year from now and the plan failed. Write the history of how — while changing course is still cheap — and leave with tripwires on the calendar, not a list of worries.",
    type: "website",
  },
};

export default function PremortemPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Pre-mortem
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Every plan gets an autopsy eventually. The only choice is whether you
          hold it before or after the death. This is Gary Klein&rsquo;s{" "}
          <Link
            href="/models#pre-mortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem
          </Link>
          , runnable solo: instead of asking what <em>could</em> go wrong — a
          question your optimism is very good at debating — you declare that the
          plan <em>has already failed</em> and write the history of how. That
          tense shift is a measured effect, not a gimmick: imagining an outcome
          as already real makes people markedly better at finding the reasons it
          could happen.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The second half is what most versions skip. A list of failure modes is
          just organized dread until each one becomes a decision: change the
          plan now, while it&rsquo;s cheap; set a{" "}
          <Link
            href="/models#tripwires"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            tripwire
          </Link>{" "}
          — an observable signal and a date to check it, decided while
          you&rsquo;re still calm; or accept the risk with open eyes. You leave
          with a sharper plan and your reconsideration scheduled — not a
          worry list.
        </p>
      </header>

      <PremortemClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you write here leaves your browser. The thinking behind the
          tool is in{" "}
          <Link
            href="/writing/hold-the-funeral-first"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Hold the Funeral First
          </Link>{" "}
          — why the tense shift works, and why the man who invented the Everest
          turnaround time died ignoring it. The one-screen versions live in the
          reference:{" "}
          <Link
            href="/models#pre-mortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Pre-mortem
          </Link>{" "}
          and{" "}
          <Link
            href="/models#tripwires"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Tripwires
          </Link>
          . When the plan is also a decision worth grading later, log it in the{" "}
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
