import type { Metadata } from "next";
import Link from "next/link";
import { toolCount, toolCountWord } from "../data/tools";
import { posts } from "../data/posts";
import { models } from "../data/models";
import { situations } from "../data/situations";
import { notes } from "../data/notes";

const UPDATED = "September 19, 2026";

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
        <p className="text-sm text-[var(--muted)]">Updated {UPDATED}</p>
        <p className="mt-6 text-base text-[var(--muted)] leading-relaxed">
          A <span className="text-[var(--foreground)]">/now</span> page, but for
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
            instruments ({toolCount} in all), arranged by the shape of the moment
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
            of {situations.length} situations that routes the moment you&rsquo;re
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
              The homepage and site copy now present the site as what it is
              &mdash; a private instrument for a real decision &mdash; instead of a
              personal status feed. This page is part of that: a project{" "}
              <span className="text-[var(--muted)]">/now</span>, not a life one.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              The{" "}
              <Link
                href="/playbook"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                playbook
              </Link>{" "}
              was brought back in sync with the toolkit &mdash; six common moments
              that used to hand you the idea but no instrument now hand you the
              purpose-built tool too.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              Survivorship bias joined the{" "}
              <Link
                href="/models"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                mental models
              </Link>{" "}
              &mdash; the quiet enemy of any base rate you read off the winners.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              <Link
                href="/rule"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Make It a Rule
              </Link>{" "}
              lets you decide a recurring call once, as a bright line, instead of
              re-litigating it every time; the quick answer-now tools now keep a
              history you can reopen, and finished decisions can be copied out as
              plain text.
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
              <span className="font-medium">Private and local-first.</span> A
              record you&rsquo;ll lose is a review you&rsquo;ll never do, so your
              data is yours &mdash; in your browser, exportable, never uploaded.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              <span className="font-medium">A decision, not a lecture.</span> Each
              tool ends in an answer and a record you can grade later, not in
              advice you nod at and forget.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              <span className="font-medium">Curated, not exhaustive.</span> The kit
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
              A handful of instruments still have no dedicated playbook situation
              &mdash; most on purpose, because they overlap a broader entry, but
              the parity is worth tightening where a genuinely distinct moment
              turns up.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              The analytic kit is deliberately thinnest on the emotional half of a
              hard call &mdash; competing values, the weight of the choice. It&rsquo;s
              more covered than it looks (cool the call, the regret test, advice
              for a friend), but it&rsquo;s the axis to watch, not to paper over
              with another worksheet.
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
