import type { Metadata } from "next";
import Link from "next/link";
import TripwireClient from "./TripwireClient";

export const metadata: Metadata = {
  title: "Set a Tripwire — Better Every Day",
  description:
    "A tripwire is a state and a date, decided while you're calm, that mean stop and reconsider. Arm one here — or hand one over from any tool — and it comes back to you on its day at the return desk. Everything stays in your browser.",
  openGraph: {
    title: "Set a Tripwire — Better Every Day",
    description:
      "Decide in advance what would make you stop and re-decide: an observable signal and a date. The person crossing a tripwire is never the person who set it — so build it to outrank your future self.",
    type: "website",
  },
};

export default function TripwirePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Set a tripwire
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Van Halen&rsquo;s touring contract demanded a bowl of M&amp;Ms
          backstage with the brown ones removed — not a diva clause but a{" "}
          <em>detector</em>: buried mid-contract, brown M&amp;Ms in the bowl
          meant the venue hadn&rsquo;t read the document that kept the rigging
          from killing someone, so the band knew to re-check everything. That is
          a{" "}
          <Link
            href="/models#tripwires"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            tripwire
          </Link>
          : a cheap, observable signal chosen in advance that means{" "}
          <em>stop and reconsider</em> — the fuel light that interrupts you at a
          threshold you set while calm, so you don&rsquo;t have to monitor the
          gauge or trust the moment&rsquo;s judgement.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The recipe is a <em>state</em> and a <em>date</em>. Not &ldquo;if it
          isn&rsquo;t working we&rsquo;ll rethink&rdquo; — &ldquo;working&rdquo;
          renegotiates itself in the moment and that clause has never fired — but
          &ldquo;if we&rsquo;re under 100 paying users on March 1, we
          stop.&rdquo; The state has to be observable enough that you
          can&rsquo;t argue with it; the date has to be a real day you&rsquo;re
          obligated to look. The person who crosses a tripwire is never the
          person who set it — summit fever killed the man who wrote the Everest
          turnaround time — so this hands each one back to you on its day at the{" "}
          <Link
            href="/review"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            return desk
          </Link>
          , and every check ends in a recorded answer: fired, or all clear.
        </p>
      </header>

      <TripwireClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Everything you enter here stays in your browser and is sent nowhere.
          A tripwire is an{" "}
          <Link
            href="/models#implementation-intentions"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            implementation intention
          </Link>{" "}
          pointed at reconsidering rather than doing — and most of the tools
          here end by finding one. When you&rsquo;ve talked yourself into{" "}
          <Link
            href="/quit"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            staying with something
          </Link>
          , traced a move to{" "}
          <Link
            href="/trace"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            the later cost that will sour it
          </Link>
          , or built a plan that names{" "}
          <Link
            href="/act"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            when to stop and rethink
          </Link>
          , that&rsquo;s a tripwire — hand it here, and it stops depending on
          memory. To arm one out of a full failure analysis instead, use the{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem room
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
