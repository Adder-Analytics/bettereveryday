import type { Metadata } from "next";
import Link from "next/link";
import ActClient from "./ActClient";

export const metadata: Metadata = {
  title: "Decided Isn't Done — Better Every Day",
  description:
    "The week after a decision is where most of them quietly die — never started, or never revisited. This tool turns a call you've made into a plan that can carry weight: an if-then with a cue that fires the first move, a backup for the obstacle, and a tripwire that tells you when to stop and rethink.",
  openGraph: {
    title: "Decided Isn't Done — Better Every Day",
    description:
      "Turn a decision into an if-then plan that actually happens: the smallest first move bound to a concrete cue, a coping plan for the obstacle, and a reconsider tripwire — the two if-thens that close both ways a decision dies after it's made.",
    type: "website",
  },
};

export default function ActPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Decided isn&rsquo;t done.
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          There&rsquo;s a particular relief in finally settling something
          you&rsquo;ve been turning over — and then, often, nothing happens. A
          week later the call is still just a call. The decision, it turns out,
          was never the hard part; the doing was, and deciding felt so much like
          progress that it disguised how little actually moved. Psychologists call
          it the{" "}
          <Link
            href="/writing/deciding-and-doing"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            intention&ndash;action gap
          </Link>
          , and it&rsquo;s the default, not the exception.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The fix is almost mechanical. Take what you intend to do and rewrite it
          as an{" "}
          <Link
            href="/models#implementation-intentions"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            if-then plan
          </Link>{" "}
          — &ldquo;when <em>this</em> happens, I&rsquo;ll do <em>that</em>&rdquo; —
          and you hand the behaviour from your distractible, later self to the
          situation itself. Across 94 studies it roughly doubled follow-through.
          This tool builds the whole thing: the smallest first move bound to a cue
          that will actually fire, a backup for the obstacle that would stop it,
          and a{" "}
          <Link
            href="/models#tripwires"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            tripwire
          </Link>{" "}
          — the same if-then pointed at reconsidering — so a call that&rsquo;s
          quietly going wrong doesn&rsquo;t coast past the moment to change course.
          Between them they close both ways a decision dies: never started, never
          revisited. And it opens with the one honest check most planning tools
          skip — whether a plan is even the right tool, or the trouble is that you
          don&rsquo;t really want this.
        </p>
      </header>

      <ActClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you enter here leaves your browser. The idea underneath it is{" "}
          <Link
            href="/models#implementation-intentions"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            implementation intentions
          </Link>
          ; the essays are{" "}
          <Link
            href="/writing/deciding-and-doing"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            the distance between deciding and doing
          </Link>{" "}
          and{" "}
          <Link
            href="/writing/the-plan-was-never-tried"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            the plan was never tried
          </Link>
          . If the decision itself is worth logging as a forecast — not just
          executing — the{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>{" "}
          keeps the reasoning and ends with this same first-move line; when the
          reconsider date comes due it surfaces in your{" "}
          <Link
            href="/review"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            return desk
          </Link>
          . The full playbook for this moment is{" "}
          <Link
            href="/playbook#make-it-happen"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            you&rsquo;ve made the call — now make sure it happens
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
