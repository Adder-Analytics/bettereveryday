import type { Metadata } from "next";
import Link from "next/link";
import RuleClient from "./RuleClient";

export const metadata: Metadata = {
  title: "Make It a Rule — Better Every Day",
  description:
    "Some decisions you don't make once — you make them over and over, and each time you pay the same deliberation and lose to the same in-the-moment pull. When a call recurs, the move isn't to decide it better each time; it's to decide it once, as a bright-line rule, and review the rule instead of re-litigating the instance.",
  openGraph: {
    title: "Make It a Rule — Better Every Day",
    description:
      "A recurring decision made fresh under pressure is a fight you keep losing. Decide it once as a standing rule — a bright line, its rare exceptions named, and a date to re-endorse it — and stop holding the argument at all.",
    type: "website",
  },
};

export default function RulePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Make it a rule.
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The rest of this toolkit works one decision at a time. But a great deal
          of what a life actually spends isn&rsquo;t the big one-off call —
          it&rsquo;s the <em>same small one, faced again and again</em>: the
          after-hours message, the impulse buy, the &ldquo;quick&rdquo; favour
          that eats the evening, one more episode. Each looks too small for the
          heavy tools, so it gets re-decided from scratch every time — usually
          while tired, tempted, or rushed, and usually the way you later wish you
          hadn&rsquo;t. You don&rsquo;t lose to one bad choice; you lose to the
          same choice made a hundred times in a compromised state.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The answer to a <em>recurring</em> decision isn&rsquo;t to decide it
          better each time — it&rsquo;s to decide it <strong>once</strong>, as a
          standing rule, and spend your judgement on whether the rule is right
          rather than re-fighting the instance. This tool checks the call actually
          recurs, forces the rule into a <strong>bright line</strong> you can tell
          you&rsquo;ve broken, makes you name the <strong>rare exceptions</strong>{" "}
          that should genuinely override it, and sets a date to re-endorse it — so
          a good rule can&rsquo;t curdle into blind habit.
        </p>
      </header>

      <RuleClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you enter here leaves your browser, and there&rsquo;s nothing to
          log &mdash; a rule isn&rsquo;t a forecast. Why a recurring decision is
          better made once than freshly under pressure, and how to bind against
          your own weakness without binding against the news that you were wrong,
          is the essay behind this tool:{" "}
          <Link
            href="/writing/decide-it-once"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Decide It Once
          </Link>
          . The idea in one screen lives in the reference:{" "}
          <Link
            href="/models#bright-line-rules"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Bright-line rules
          </Link>
          . This is the close cousin of the{" "}
          <Link
            href="/tripwire"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            tripwire
          </Link>{" "}
          &mdash; where the tripwire binds a single decision against a future self,
          a rule replaces a recurring one &mdash; and the review it schedules lands
          on the same{" "}
          <Link
            href="/review"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            return desk
          </Link>{" "}
          as everything else the site holds for you. If the call turns out to be a
          genuine one-off after all, start at the{" "}
          <Link
            href="/find"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            guided front door
          </Link>{" "}
          instead.
        </p>
      </div>
    </div>
  );
}
