import type { Metadata } from "next";
import Link from "next/link";
import { withSubject } from "../data/carry";
import { toolCountWord } from "../data/tools";

export const metadata: Metadata = {
  title: "One Decision, Worked Through — Better Every Day",
  description:
    `The toolkit is ${toolCountWord} instruments, and each one has a worked example of its own. This is the one thing a single tool can't show: how they connect. Follow one real decision — take the offer at the smaller company, or stay — across the whole loop, from the reversibility triage to the return desk, and watch the through-line carry it from tool to tool. Every step links into the live instrument, pre-filled, so you can pick up the same decision or swap in your own.`,
  openGraph: {
    title: "One Decision, Worked Through — Better Every Day",
    description:
      "One real decision, walked across the whole toolkit — triage, flip point, pre-mortem, journal, return desk — so you can see how the instruments hand off to each other, not just what each one does alone.",
    type: "website",
  },
};

/**
 * The subject that rides the through-line across every step. It's typed once,
 * here — at the first door — and carried into each tool by the same `?subject=`
 * handoff the live tools use, so the page demonstrates the connective tissue,
 * not just narrates it. Kept as one constant so the banner, the step links, and
 * the closing note can't disagree about what the decision was.
 */
const SUBJECT = "Take the offer at the smaller company, or stay where I am?";

type Step = {
  n: number;
  /** The tool's full name, as it reads in its own header. */
  tool: string;
  /** Base href for the live tool. */
  href: string;
  /** Whether this tool reads the through-line subject (the return desk doesn't). */
  carries: boolean;
  /** The payoff badge, mirroring /tools. */
  payoff: string;
  /** The moment — what it feels like to be here, in the second person. */
  moment: string;
  /** What you'd actually put in front of the tool. */
  you: string;
  /** What the tool hands back. */
  back: string;
  /** The label on the link into the live tool. */
  cta: string;
};

const steps: Step[] = [
  {
    n: 1,
    tool: "Which Door Is This?",
    href: "/doors",
    carries: true,
    payoff: "Answers now",
    moment:
      "Before you spend two weeks agonizing, ask the question almost nobody asks first: is this even the kind of call that earns two weeks?",
    you: "Leaving a job is mostly a door you can walk back through — you could job-hunt again, and a decent manager takes a boomerang call. But a few edges don't swing back: you can't un-quit this particular team, and a year spent at a company that folds isn't a year you get returned.",
    back: "It sorts the call as mostly a two-way door with one-way edges. So: don't burn a month agonizing over the reversible 90% — but give the parts that genuinely don't reverse the slow, careful thought they're actually owed. That's where the rest of the kit goes to work.",
    cta: "Open the triage, this decision loaded",
  },
  {
    n: 2,
    tool: "The Flip Point",
    href: "/weigh",
    carries: true,
    payoff: "Answers now",
    moment:
      "You keep re-litigating whether you're 60% or 70% on the move, as if a sharper guess at the number would finally break the tie.",
    you: "What you'd gain if the move is right (B): work you'd be prouder of, a bigger role, room to grow. What you'd lose if it's wrong (R): a stable, known-good situation you'd have to rebuild from scratch. Call them roughly even.",
    back: "With gain and loss about even, the flip point p* = R/(B+R) lands near 50%. You never needed the exact odds — only which side of 50% you're on. At a gut 60%, you're over the line. The tie you couldn't break wasn't as close as it felt.",
    cta: "Open the flip point, this decision loaded",
  },
  {
    n: 3,
    tool: "The Pre-mortem",
    href: "/premortem",
    carries: true,
    payoff: "Sets up a return",
    moment:
      "The door has real one-way edges and you're leaning toward the move — so before you commit, it's a year from now and the move was a mistake. Don't defend it. Write its obituary.",
    you: "The failure stories, said out loud: the runway was shorter than they let on and layoffs hit; the role quietly drifted into something you never signed up for; you underestimated how much the old team was carrying you.",
    back: "Each cause becomes a fix, an accepted risk, or a tripwire. Ask for the real financials before you sign (a fix). Accept that some role-drift is just the nature of a small company (a risk). And if you're not shipping real work by day 90, that's your signal to re-decide — armed now, while calm, as a tripwire that comes back to you on the date.",
    cta: "Open the pre-mortem, this decision loaded",
  },
  {
    n: 4,
    tool: "The Decision Journal",
    href: "/decide",
    carries: true,
    payoff: "Sets up a return",
    moment:
      "The call is worth making carefully — and worth remembering how you made it, before hindsight quietly rewrites the story into one you always knew was coming.",
    you: "The decision, the reasoning, and a forecast with a number on it: “I expect to be glad I moved — more energized, doing work I respect — six months in. Confidence: 65%.” Review date: six months out.",
    back: "It records the reasoning and seals the forecast, then schedules the one thing that actually teaches — a date to come back and set what happened against what you expected. That 65% is now a bet reality will settle, not a feeling memory can launder after the fact.",
    cta: "Open the journal, this decision loaded",
  },
  {
    n: 5,
    tool: "The Return Desk",
    href: "/review",
    carries: false,
    payoff: "A practice",
    moment:
      "Six months on, the review you scheduled comes due. You don't have to remember to look — the desk hands it back to you.",
    you: "What actually happened, and the honest grade: was it a good decision, separate from whether it happened to get a good outcome? And did you take the first move you wrote down, or did the call quietly stay a call?",
    back: "It grades the decision apart from the result — a good call that got unlucky isn't a mistake, and a lucky one isn't genius — and folds it into your record. So the next hard call is made by someone who has real evidence about how their own forecasts actually land.",
    cta: "See the return desk",
  },
];

const payoffStyle: Record<string, string> = {
  "Answers now": "text-[var(--accent)] border-[var(--accent)]",
  "Sets up a return": "text-[var(--muted)] border-[var(--muted)]",
  "A practice": "text-[var(--muted)] border-[var(--border)]",
};

export default function ExamplePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          One decision, worked through
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The toolkit is {toolCountWord}{" "}instruments, and several of them carry a worked
          example of their own. This page is for the one thing a single tool
          can&rsquo;t show you: <em>how they connect.</em> Here is one real,
          ordinary decision &mdash; take the offer at the smaller company, or stay
          where you are &mdash; walked across the whole loop. Watch how each tool
          hands the decision to the next, and how you type the decision itself{" "}
          <em>once</em>, at the first door, and it rides along with you the rest of
          the way.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Every step links into the live instrument with this decision already
          loaded &mdash; so you can pick up exactly where the example left off, or
          clear it and drop in the decision actually in front of you.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          This is the <em>cold</em>{" "}spine &mdash; a call you get to weigh at
          leisure. The decisions people most regret are the opposite:{" "}
          <Link
            href="/example/hot"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            see the same kit walk a hot one &rarr;
          </Link>
        </p>
      </header>

      {/* The subject that rides the through-line, shown once so the reader can
          see the exact text every step below carries. */}
      <div className="mb-14 rounded-xl border border-[var(--border)] bg-[var(--card)]/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          The decision, typed once
        </p>
        <p className="text-base font-medium text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--accent)]">
          {SUBJECT}
        </p>
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          From here on, every tool below opens with this line already in its
          &ldquo;what are you deciding?&rdquo; field &mdash; carried by the
          through-line, never retyped.
        </p>
      </div>

      <ol className="space-y-14">
        {steps.map((step) => {
          const href = step.carries
            ? withSubject(step.href, SUBJECT)
            : step.href;
          return (
            <li key={step.n} className="relative">
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-sm font-mono text-[var(--muted)] tabular-nums">
                    {String(step.n).padStart(2, "0")}
                  </span>
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] leading-snug">
                    {step.tool}
                  </h2>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border ${payoffStyle[step.payoff]}`}
                >
                  {step.payoff}
                </span>
              </div>

              <p className="text-sm font-medium text-[var(--foreground)] leading-relaxed mb-4">
                {step.moment}
              </p>

              <div className="space-y-4 text-sm leading-relaxed">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    What you put in
                  </span>
                  <p className="mt-1.5 text-[var(--muted)] leading-relaxed">
                    {step.you}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                    What it hands back
                  </span>
                  <p className="mt-1.5 text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--accent)]">
                    {step.back}
                  </p>
                </div>
              </div>

              <Link
                href={href}
                className="inline-block mt-4 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                {step.cta} &rarr;
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <h2 className="text-base font-semibold text-[var(--foreground)] mb-3">
          What just happened
        </h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          You typed <em>&ldquo;{SUBJECT}&rdquo;</em> once, at the first door, and
          it rode into every tool after it &mdash; the triage, the flip point, the
          pre-mortem, the journal. That&rsquo;s the toolkit working as{" "}
          <em>one instrument</em>{" "}instead of five separate forms, each demanding
          you restate the decision from scratch. The tools aren&rsquo;t a menu;
          they&rsquo;re a path, and the decision walks it with you.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          This one decision took the spine of the kit. The same call could just as
          easily have passed through{" "}
          <Link
            href="/cool"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            cool the call
          </Link>{" "}
          &mdash; if the offer came with an exploding deadline and you were{" "}
          <Link
            href="/example/hot"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            deciding hot
          </Link>{" "}
          &mdash; or the{" "}
          <Link
            href="/trace"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            consequence trace
          </Link>
          , and, once decided, could have been turned into a first concrete move
          at{" "}
          <Link
            href="/act"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            make it happen
          </Link>
          . The moment you&rsquo;re in picks the door.
        </p>
        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href={withSubject("/doors", SUBJECT)}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Walk your own decision through, from the first door &rarr;
          </Link>
          <Link
            href="/tools"
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Or pick the tool for the moment you&rsquo;re in &rarr;
          </Link>
        </div>
        <p className="mt-8 text-xs text-[var(--muted)] leading-relaxed">
          Nothing on this page is saved, and the example decision is invented.
          When you open a tool with a decision loaded, it fills the field only if
          you haven&rsquo;t already got work there &mdash; the example can never
          write over something of yours. Everything you enter in the tools stays
          in your browser and is sent nowhere.
        </p>
      </div>
    </div>
  );
}
