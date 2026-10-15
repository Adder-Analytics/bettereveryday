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
              Subscriptions renew themselves, and every renewal is a decision
              made by default: the gym, the second streaming service, the app
              whose trial ended in March.{" "}
              <Link
                href="/keep"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Still worth paying for?
              </Link>{" "}
              goes through them one by one, counting last month&rsquo;s uses
              rather than planned ones, checking whether paying per use would be
              cheaper, and asking the{" "}
              <span className="text-[var(--foreground)] font-medium">
                fresh-start question
              </span>
              : would you sign up today, at this price? When you&rsquo;re not
              sure and could rejoin in a minute, it says cancel and see if you
              miss it. A new{" "}
              <Link
                href="/writing/the-subscription-you-wouldnt-buy-today"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              explains why.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              Something&rsquo;s broken and there&rsquo;s a quote on the table: the
              washing machine, the laptop, the car.{" "}
              <Link
                href="/fix"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Fix it or replace it?
              </Link>{" "}
              divides the quote by what a new one costs per year of use to get{" "}
              <span className="text-[var(--foreground)] font-medium">
                how long the repair has to last
              </span>
              , a question you can answer or put to the repairer. It puts the
              sunk cost and the shiny new model each in their place, and shows
              what the half-the-price rule of thumb was guessing. A new{" "}
              <Link
                href="/writing/what-the-repair-has-to-buy"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              explains why.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              Moving in with others, with rooms that aren&rsquo;t equal, is a
              call people settle by splitting it equally or by haggling, and
              someone ends up paying the same for the box room.{" "}
              <Link
                href="/split"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Who gets which room?
              </Link>{" "}
              has each of you price every room privately, passing one phone
              round, then gives each room to the right person and sets{" "}
              <span className="text-[var(--foreground)] font-medium">
                rents nobody would swap
              </span>
              , by the widest margin your numbers allow. A new{" "}
              <Link
                href="/writing/price-the-rooms-not-the-people"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              explains the fair-division maths behind it.
            </li>
            <li className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]">
              &ldquo;Would you like to protect that?&rdquo; The warranty at the
              till, phone cover, a lower excess for a bit more a year: a call
              almost everyone faces, with no instrument here until now.{" "}
              <Link
                href="/cover"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                Insure it or carry it?
              </Link>{" "}
              sorts the loss by whether you could pay it from savings, and for the
              ones you could, works out the{" "}
              <span className="text-[var(--foreground)] font-medium">
                break-even odds
              </span>{" "}
              the cover has to beat, then checks your read of them against the
              known overestimate. It ends in a line to keep for the next till. A
              new{" "}
              <Link
                href="/writing/insure-the-catastrophe"
                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                essay
              </Link>{" "}
              explains why.
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
