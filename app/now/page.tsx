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
              A new job in October, no P45, the middle box ticked on the
              starter form, and £270 of tax on the first payslip with a code
              nobody read.{" "}
              <Link
                href="/taxcode"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Tax code
              </Link>{" "}
              reads the code part by part, builds the one your details should
              give, and runs{" "}
              <span className="text-[var(--foreground)] font-medium">
                both through the year, payslip by payslip
              </span>
              : what the gap costs by 5 April, how much has already gone, and
              why a corrected code gives it all back in one payslip until the
              year closes. Then what to tell HMRC and payroll. A new{" "}
              <Link
                href="/writing/before-the-total-closes"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              and a new model, Running Totals, go with it.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              Sacked eight months in, with a week&rsquo;s pay in lieu, and
              told you can&rsquo;t claim without two years and have three
              months anyway.{" "}
              <Link
                href="/dismissed"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Dismissed
              </Link>{" "}
              dates the day to contact Acas by (six months now, and an appeal
              doesn&rsquo;t pause it) and draws{" "}
              <span className="text-[var(--foreground)] font-medium">
                your service against the line
              </span>
              , counted the law&rsquo;s way with the notice you weren&rsquo;t
              given added on, which matters most for anyone let go around
              1 January 2027, when two years becomes six months. Then each
              claim, including the ones that need no service, and the letters.
              A new{" "}
              <Link
                href="/writing/the-day-before-the-line"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              and a new model, Notches, go with it.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              Twelve days off with flu, no sick pay on the payslip, and no
              question asked, because &ldquo;the first three days don&rsquo;t
              count&rdquo; and part-timers don&rsquo;t earn enough anyway.{" "}
              <Link
                href="/sick"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Off sick
              </Link>{" "}
              prices your days under{" "}
              <span className="text-[var(--foreground)] font-medium">
                the rules since April 2026
              </span>{" "}
              (sick pay from day one, no earnings floor) next to what the
              rule you remember would have paid. If you&rsquo;re still off, it
              draws the weeks ahead to where SSP stops at 28 weeks, dates the
              fit note, the SSP1 and the benefit claim, and writes the
              messages. A new{" "}
              <Link
                href="/writing/the-rule-you-remember"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              and a new model, The Half-Life of Facts, go with it.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              The tax return&rsquo;s due on 31 January, the bill&rsquo;s more
              than you have, so the plan is to file in the summer.{" "}
              <Link
                href="/taxreturn"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                A tax return due
              </Link>{" "}
              puts{" "}
              <span className="text-[var(--foreground)] font-medium">
                the return&rsquo;s clock and the money&rsquo;s clock
              </span>{" "}
              side by side, prices each step of both, and shows filing on time
              with a payment plan against waiting until you can pay (about
              £230 against £1,460 on a £4,200 bill). It explains why the first
              January bill is half as big again, and writes the plan request,
              the appeal or the request to withdraw a notice. A new{" "}
              <Link
                href="/writing/file-it-even-if-you-cant-pay"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              and a new model, Tax Salience, go with it.
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
