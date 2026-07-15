import type { Metadata } from "next";
import Link from "next/link";
import TraceClient from "./TraceClient";

export const metadata: Metadata = {
  title: "And Then What? — Better Every Day",
  description:
    "Most bad decisions come from stopping the analysis one step too early, at the first-order effect. Trace a move past it — and then what, and then what — tag whether each effect helps or hurts, and read the sign pattern. The trap is always first-order positive; the treasure's cost is always up front.",
  openGraph: {
    title: "And Then What? — Better Every Day",
    description:
      "A tool for second-order thinking: follow a decision down its chain of consequences and watch for the sign flip — where the effect you intended reverses into the one that lasts.",
    type: "website",
  },
};

export default function TracePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          And then what?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Almost every avoidable mistake is the same mistake: the analysis
          stopped one step too early. The people who released cane toads to eat
          the beetles reasoned correctly about the{" "}
          <em>first</em> link in the chain — toads eat insects. They just
          never asked the question that would have saved them.{" "}
          <Link
            href="/models#second-order-effects"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            First-order effects
          </Link>{" "}
          are immediate, visible, and the reason a move is tempting. The
          second and third orders are delayed, diffuse, and — often enough to
          matter — pointed the other way.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool makes you keep asking. Name what you&rsquo;re thinking of
          doing, then trace it: the effect you want, and then what follows,
          and then what follows that. Mark each one <em>better</em> or{" "}
          <em>worse</em> for what you actually want, and the tool reads the
          pattern — because the single most useful thing a trace reveals is the{" "}
          <em>sign flip</em>: where the effect you&rsquo;re doing it for turns
          into the one you have to live with. The trap is always first-order
          positive; the things worth doing almost always cost you up front.
        </p>
      </header>

      <TraceClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you enter here leaves your browser. The thinking behind the
          tool — Bastiat&rsquo;s seen and unseen, why the first-order-positive
          chain is the one that fools us, and how to use the sign pattern as a
          filter — is in{" "}
          <Link
            href="/writing/the-bill-comes-later"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The Bill Comes Later
          </Link>{" "}
          and{" "}
          <Link
            href="/writing/second-order-thinking"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            And Then What?
          </Link>
          . The one-screen version lives in the reference:{" "}
          <Link
            href="/models#second-order-effects"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Second-Order Effects
          </Link>
          . Found a later effect you want to guard against? Turn it into a
          tripwire in the{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem room
          </Link>
          , or take the either/or to the{" "}
          <Link
            href="/weigh"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            flip point
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
