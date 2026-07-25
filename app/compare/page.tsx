import type { Metadata } from "next";
import Link from "next/link";
import CompareClient from "./CompareClient";

export const metadata: Metadata = {
  title: "The Halo Comes Off — Better Every Day",
  description:
    "Choosing among several options — two jobs, three apartments, a shortlist of offers? One strong first impression quietly colours how you rate everything else. Score each option one factor at a time, keep your gut call separate and last, and examine the gap. Kahneman's Mediating Assessments Protocol, as a tool.",
  openGraph: {
    title: "The Halo Comes Off — Better Every Day",
    description:
      "The most common decision isn't act-or-don't — it's which of these. A tool that scores your options one factor at a time so a single impression can't decide the whole thing, then sets the tally against your gut.",
    type: "website",
  },
};

export default function ComparePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          The halo comes off
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The other instruments here work an <em>act-or-don&rsquo;t</em> call.
          But the most common real decision has a different shape:{" "}
          <em>which of these</em> — two job offers, three apartments, a shortlist
          you keep reshuffling. And that shape has a specific trap. Nisbett and
          Wilson (1977) named it the{" "}
          <Link
            href="/models#halo-effect"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            halo effect
          </Link>
          : one strong impression of an option &mdash; the salary, the
          founder&rsquo;s energy, the kitchen &mdash; bleeds into how you rate
          everything <em>else</em> about it, so the choice is quietly made in the
          first ten seconds and the comparison is just the story you tell
          afterward.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Knowing about the halo doesn&rsquo;t dissolve it &mdash; the fix has to
          be structural. This tool runs the{" "}
          <Link
            href="/models#mediating-assessments"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Mediating Assessments Protocol
          </Link>{" "}
          from Kahneman, Sibony and Sunstein&rsquo;s <em>Noise</em> (2021): break
          the choice into the few factors that matter, and score every option{" "}
          <em>one factor at a time</em>{" "}&mdash; comparing on a single dimension
          before any overall impression can form. Then the discipline that does
          the real work: keep your gut call <em>separate and last</em>. The tally
          stays hidden until you&rsquo;ve named which option you actually want, so
          a running score can&rsquo;t anchor you as you go.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          What you&rsquo;re after isn&rsquo;t the winning number. It&rsquo;s the{" "}
          <em>gap</em>{" "}between what the factors say and what your gut wanted: when
          they disagree, either you&rsquo;re weighting a factor you didn&rsquo;t
          admit to, or there&rsquo;s one you never wrote down &mdash; and that gap
          is the most useful thing the exercise produces.
        </p>
      </header>

      <CompareClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you enter here leaves your browser. If your list is really
          &ldquo;the thing&rdquo; versus &ldquo;nothing,&rdquo; the honest first
          move is to widen it &mdash; see{" "}
          <Link
            href="/writing/whether-or-not"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Whether-or-Not Is a Trap
          </Link>
          . Once it&rsquo;s down to a genuine two-way call, the{" "}
          <Link
            href="/weigh"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            flip point
          </Link>{" "}
          sharpens it to a single threshold; if you&rsquo;re choosing in the heat
          of the moment,{" "}
          <Link
            href="/cool"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            cool the call
          </Link>{" "}
          first; and once you&rsquo;ve picked, a{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem
          </Link>{" "}
          stress-tests it before you commit. The whole kit is on the{" "}
          <Link
            href="/tools"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            toolkit
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
