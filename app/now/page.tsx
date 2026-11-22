import type { Metadata } from "next";
import Link from "next/link";
import { toolCount, toolCountWord } from "../data/tools";
import { posts } from "../data/posts";
import { models } from "../data/models";
import { situations } from "../data/situations";
import { notes } from "../data/notes";
import { SITE_UPDATED } from "../data/updated";

export const metadata: Metadata = {
  title: "Now — Better Every Day",
  description:
    "A /now page for the project rather than a person: where the decision toolkit stands today, what's newest, what it's built on, and what's still open.",
};

export default function Now() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-14">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-2">
          Now
        </h1>
        <p className="text-sm text-[var(--muted)]">Updated {SITE_UPDATED}</p>
        <p className="mt-6 text-base text-[var(--muted)] leading-relaxed">
          A <span className="text-[var(--foreground)]">/now</span>{" "}page, but for
          the project rather than a person &mdash; where the toolkit stands today,
          what&rsquo;s newest, what it&rsquo;s built on, and what&rsquo;s still
          open. If you&rsquo;re here to work a decision, the tool is at{" "}
          <Link
            href="/find"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            /find
          </Link>
          ; this is the note on the workbench, not the workbench.
        </p>
      </div>

      <div className="space-y-12">
        {/* Where it stands — the honest size of the thing, drawn from the data
            modules so the counts can't drift from the site. */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Where it stands
          </h2>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            {toolCountWord[0].toUpperCase() + toolCountWord.slice(1)} working
            instruments ({toolCount}{" "}in all), arranged by the shape of the moment
            you&rsquo;re in &mdash; a call to settle today, a commitment worth
            slowing down for, the week after when a decision quietly dies, and the
            return that finally grades it. Behind them sits a reference of{" "}
            {models.length} mental models, {posts.length} essays, and{" "}
            {notes.length} reading notes, and a{" "}
            <Link
              href="/playbook"
              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              playbook
            </Link>{" "}
            of {situations.length}{" "}situations that routes the moment you&rsquo;re
            in to both the idea and the instrument for it. Everything you enter
            stays in your browser; you can hold your own copy from{" "}
            <Link
              href="/data"
              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              your data
            </Link>
            .
          </p>
        </section>

        {/* Newest — the last few real additions, de-personalised: what changed
            for a user, not who changed it. */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Newest
          </h2>
          <ul className="space-y-3">
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              A mum who asked twice over Christmas whether you&rsquo;d eaten, a
              pile of unopened letters, and a power of attorney you&rsquo;ve
              been meaning to sort out for years.{" "}
              <Link
                href="/lpa"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Power of attorney
              </Link>{" "}
              reads whether one can still be made (a diagnosis isn&rsquo;t the
              line) and prices{" "}
              <span className="text-[var(--foreground)] font-medium">
                £92 an LPA now against a court deputyship later
              </span>
              : about £841 in the first year, £320 a year after, and 6 to 10
              months when nobody can sign. It dates the steps and writes the
              opening for the conversation. A new{" "}
              <Link
                href="/writing/sign-it-on-a-good-day"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              and a new model, Ulysses Contract, go with it.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              Sixty-three, £120,000 in an old workplace pension, a son buying
              a flat, and a form with one box: how much?{" "}
              <Link
                href="/pension"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Taking money from your pension
              </Link>{" "}
              prices each way of taking the sum on your own income and shows{" "}
              <span className="text-[var(--foreground)] font-medium">
                that the same £40,000 can cost £2,000 in tax or £9,500
              </span>
              , what the emergency code takes on the day and the form that
              claims it back, the £10,000 cap on paying in it can start, and
              what the April 2027 inheritance tax change does and doesn&rsquo;t
              do. A new{" "}
              <Link
                href="/writing/same-money-different-tax"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              and a new model, Bracket Smoothing, go with it.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              Sixteen hours on the tills, a mum who needs you every evening,
              and an offer of four more hours a week from January.{" "}
              <Link
                href="/carers"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Carer&rsquo;s Allowance
              </Link>{" "}
              counts your earnings the way the £204 test does (after tax,
              National Insurance, half your pension and care costs), shows{" "}
              <span className="text-[var(--foreground)] font-medium">
                how close you are to the cliff, and the band of pay where more
                work leaves you with less
              </span>
              , and writes the messages to the Carer&rsquo;s Allowance Unit, to
              payroll and about an overpayment. A new{" "}
              <Link
                href="/writing/the-pound-that-costs-86"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              and a new model, Effective Marginal Tax Rate, go with it.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              Three years out caring for a parent, a State Pension forecast
              one year short, a button offering to fill each gap for £957,
              and a friend saying you&rsquo;d have to live to ninety.{" "}
              <Link
                href="/statepension"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                State Pension gaps
              </Link>{" "}
              sorts your open years into{" "}
              <span className="text-[var(--foreground)] font-medium">
                the ones you&rsquo;ll need whatever happens, the ones work
                might fill, and the ones that add nothing
              </span>
              , prices what each buys, and dates the day each one closes (the
              oldest on 5 April 2027). A new{" "}
              <Link
                href="/writing/the-bet-you-want-to-lose"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              and a new model, Longevity Insurance, go with it.
            </li>
          </ul>
        </section>

        {/* What it's built on — the principles that decide what gets built and,
            more often, what doesn't. */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            What it&rsquo;s built on
          </h2>
          <ul className="space-y-3">
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              <span className="font-medium">Private and local-first.</span>{" "}A
              record you&rsquo;ll lose is a review you&rsquo;ll never do, so your
              data is yours &mdash; in your browser, exportable, never uploaded.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              <span className="font-medium">A decision, not a lecture.</span> Each
              tool ends in an answer and a record you can grade later, not in
              advice you nod at and forget.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              <span className="font-medium">Curated, not exhaustive.</span>{" "}The kit
              adds an instrument only for a distinct moment a real person lands in
              &mdash; a comprehensive list would be worse, not better.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              <span className="font-medium">The return is the point.</span> Deciding
              is the easy half; finding out whether you were right is where the
              learning lives, so the loop is built to bring you back.
            </li>
          </ul>
        </section>

        {/* Still open — honest, not a roadmap: the things the toolkit knows it
            hasn't finished. */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Still open
          </h2>
          <ul className="space-y-3">
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              With every moment the router reaches now in the playbook too, the instruments
              left without their own playbook situation are the process and
              return tools &mdash; the journal, the return desk, the tripwire, the
              trainers &mdash; and those overlap a broader entry on purpose rather
              than marking a gap. The parity to keep watching is the reverse one:
              a genuinely new shape of moment should turn up in both front doors
              at once, not just the guided one.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              The analytic kit is deliberately thinnest on the emotional half of a
              hard call &mdash; competing values, the weight of the choice. It&rsquo;s
              more covered than it looks (cool the call, the regret test, advice
              for a friend, and now the hard-choice test, which ends in a
              commitment rather than a score), but it&rsquo;s the axis to watch,
              not to paper over with another worksheet.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              Peer-sharing is now finished for the tools built around a shared
              call, and the ones left single-player are that way on purpose: a
              private nudge like cooling a hot call or asking your older self, and
              the process and return tools that hold your own record, aren&rsquo;t
              artifacts you hand someone to argue back with. The blind round is the first
              instrument built for several people from the start: its invite and
              replies are links too. Any further tool that produces a decision
              made with other people should ship the same way, not have sharing
              bolted on later.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              The router&rsquo;s five clusters &mdash; and the playbook&rsquo;s
              seven, which reuse them &mdash; are a first cut, drawn from what
              each answer is <em>about</em>, not from watching people use it. If a
              kind of hard turns out to be looked for under the wrong heading, the
              fix is to move the line, not to add a sixth question in front of
              it &mdash; the list stays one tap deep.
            </li>
          </ul>
        </section>
      </div>

      <p className="mt-16 text-xs text-[var(--muted)]">
        The idea of a <span className="underline underline-offset-2">/now</span>{" "}
        page comes from{" "}
        <span className="underline underline-offset-2">
          Derek Sivers&rsquo; /now pages
        </span>{" "}
        &mdash; here it&rsquo;s pointed at the project instead of the person who
        keeps it.
      </p>
    </div>
  );
}
