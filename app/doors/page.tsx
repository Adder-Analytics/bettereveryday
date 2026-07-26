import type { Metadata } from "next";
import Link from "next/link";
import DoorsClient from "./DoorsClient";

export const metadata: Metadata = {
  title: "Which Door Is This? — Better Every Day",
  description:
    "Before you agonize over a decision, ask the question that comes first: can you undo it? Jeff Bezos's one-way / two-way door test, as a tool — so you spend slow, careful deliberation only on the choices that genuinely can't be walked back, and stop paying for certainty you don't need on the ones you can.",
  openGraph: {
    title: "Which Door Is This? — Better Every Day",
    description:
      "The triage that belongs before every other decision tool: is this a door you can walk back through? Reversible choices should be decided fast — the expensive thing isn't a wrong call, it's a slow one.",
    type: "website",
  },
};

export default function DoorsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Which door is this?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Every other instrument here assumes you&rsquo;ve already decided a
          decision is worth thinking hard about. This one asks the question that
          comes first, and almost nobody does:{" "}
          <em>does this choice even deserve it?</em> Jeff Bezos sorts decisions
          into two kinds. A <strong>one-way door</strong> — you can&rsquo;t come
          back through — earns slow, careful deliberation, because getting it
          wrong is permanent. A <strong>two-way door</strong> — you can walk right
          back — should be decided <em>fast</em>, because there the expensive
          thing isn&rsquo;t a wrong call, it&rsquo;s a slow one: every day of
          deliberation is a real cost, and the mistake, if you make it, is cheap
          and reversible.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The error runs almost entirely one direction — we treat two-way doors
          like one-way doors, agonizing for weeks over things we could simply
          undo, and slowing ourselves down exactly where speed is free. Answer
          three questions about how reversible this really is; the tool tells you
          which door you&rsquo;re at, how much deliberation it&rsquo;s earned, and
          — for the doors that genuinely don&rsquo;t swing back — hands you the
          instrument built for the slow, careful version.
        </p>
      </header>

      <DoorsClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you enter here leaves your browser, and there&rsquo;s nothing to
          log — a triage isn&rsquo;t a forecast. The idea in one screen lives in
          the reference:{" "}
          <Link
            href="/models#reversibility"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Reversibility
          </Link>
          . Deciding this while your pulse is up? Reversibility is also the gate
          for the heat —{" "}
          <Link
            href="/cool"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            cool the call
          </Link>{" "}
          first. And when the door turns out to be genuinely one-way, the{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem
          </Link>{" "}
          and the{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>{" "}
          are where the careful version happens.
        </p>
      </div>
    </div>
  );
}
