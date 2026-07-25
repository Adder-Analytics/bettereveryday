import type { Metadata } from "next";
import Link from "next/link";
import OutsideClient from "./OutsideClient";

export const metadata: Metadata = {
  title: "You Are Not the Exception — Better Every Day",
  description:
    "How long will it take? How much will it cost? Your plan is a best-case story; the reference class already counted the surprises. Reference-class forecasting, as a tool: seal your own estimate, then set it against what actually happened to things like it.",
  openGraph: {
    title: "You Are Not the Exception — Better Every Day",
    description:
      "The planning fallacy, disarmed. Take your instinct first, then confront it with the outside view — the real distribution of comparable cases — and read the gap.",
    type: "website",
  },
};

export default function OutsidePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          You are not the exception
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Students asked how long a project would take said 34 days and took 55.
          Nine in ten megaprojects run over budget. Newlyweds who correctly recite
          the divorce rate put their own odds at zero. The pattern has a name — the{" "}
          <Link
            href="/models#outside-view"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            planning fallacy
          </Link>{" "}
          — and a single, stubborn cause: we forecast from the <em>inside</em>, out
          of the plan in front of us, and a plan is a story about the best case. The
          surprises that will actually sink it are precisely the things not in the
          story.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The fix isn&rsquo;t to plan harder. It&rsquo;s to look up — to ask what
          happened to <em>everyone else</em> who tried something like this, and
          start the forecast there. That distribution has already counted every
          surprise the plan can&rsquo;t see. This tool runs the procedure Kahneman
          calls{" "}
          <Link
            href="/models#outside-view"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            reference-class forecasting
          </Link>
          : it takes your own estimate first and seals it, has you build the class
          from cases that actually happened, and shows you the gap — because knowing
          about the inside view doesn&rsquo;t protect you from it. The lookup has to
          be a step you take, not a virtue you hope to remember.
        </p>
      </header>

      <OutsideClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you enter here leaves your browser. The thinking behind it — why
          the plan is the wrong place to forecast from, and why choosing the
          reference class is the whole ballgame — is in{" "}
          <Link
            href="/writing/nobody-thinks-theyre-the-base-rate"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Nobody Thinks They&rsquo;re the Base Rate
          </Link>
          . The one-screen version lives in the reference:{" "}
          <Link
            href="/models#outside-view"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The Outside View
          </Link>{" "}
          and{" "}
          <Link
            href="/models#base-rates"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Base Rates
          </Link>
          . To drill the harder judgement — <em>picking</em> the class — the{" "}
          <Link
            href="/practice"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            base-rate trainer
          </Link>{" "}
          has a pick-the-prior mode. Once you&rsquo;ve got a number, size the buffer
          and stress the plan with a{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem
          </Link>
          , then log the call in the{" "}
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
