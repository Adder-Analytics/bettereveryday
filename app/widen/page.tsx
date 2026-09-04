import type { Metadata } from "next";
import Link from "next/link";
import WidenClient from "./WidenClient";

export const metadata: Metadata = {
  title: "What Else Could You Do? — Better Every Day",
  description:
    "The most common decision mistake isn't bad reasoning — it's a 'whether or not' frame that throws away every option nobody named. Force the frame open with the vanishing-options test and three more lenses, guard against decoy options, then hand the real slate to the comparison or the flip point.",
  openGraph: {
    title: "What Else Could You Do? — Better Every Day",
    description:
      "A 'whether or not' feels like a decision but it's one option and its shadow. Widen the frame — the vanishing-options test — into a real set of choices, then take them to be weighed.",
    type: "website",
  },
};

export default function WidenPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          What else could you do?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Here is a decision you&rsquo;ve made some version of:{" "}
          <em>should I take this job, or not?</em> It feels like a decision — you
          can weigh it, list the pros and cons, sleep on it. But notice what the
          question did before you reasoned about anything. It reduced a wide-open
          situation — your work, your next few years, the dozen things you could do
          with them — to a single yes-or-no about <strong>one option</strong>.
          Everything you didn&rsquo;t name quietly left the room.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Chip and Dan Heath call this <strong>narrow framing</strong>, and in{" "}
          <em>Decisive</em>{" "}they name it the first place decisions go wrong — not
          in the analysis, but in the frame that forms before any analysis starts.
          The cost is measured: Paul Nutt found that decisions weighing only one
          option failed far more often than ones that weighed even two, and that
          most organizational calls never consider a second alternative at all. The
          diligence is real; it&rsquo;s just spent inside a box you didn&rsquo;t
          notice you were standing in.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This is the one instrument that acts <em>before</em>{" "}the others. Every
          other tool here weighs options you already have; none of them helps you
          find the ones the frame hid. So this does the single move that&rsquo;s
          most of the value — refuse to decide between one thing and nothing — then
          hands the real set on to be weighed. It doesn&rsquo;t make the choice for
          you. It just makes sure you&rsquo;re choosing among the options you
          actually have, instead of the one that happened to be loudest.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          The longer argument is in the essay{" "}
          <Link
            href="/writing/whether-or-not"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The First Mistake Is the Question
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <WidenClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you enter here leaves your browser. One case this can&rsquo;t
          crack on its own: if the frame won&rsquo;t open &mdash; if it stays
          stuck at your option versus someone else&rsquo;s &mdash; the block may
          not be a hidden option at all but a{" "}
          <em>disagreement</em>{" "}wearing the costume of one. You two want
          different things, so every third option one of you names, the other
          rules out. That isn&rsquo;t a framing problem, and no amount of widening
          fixes it;{" "}
          <Link
            href="/crux"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            sort where you actually disagree
          </Link>{" "}
          first, then widen it together.
        </p>
      </div>
    </div>
  );
}
