import type { Metadata } from "next";
import Link from "next/link";
import PipClient from "./PipClient";

export const metadata: Metadata = {
  title: "PIP: Could You Get It, and What Do You Write? — Better Every Day",
  description:
    "PIP is scored: 8 points for the standard rate, 12 for the enhanced, in daily living and in mobility. A descriptor only counts if it applies on more than half the days, so the form is really asking \"on how many days?\" Score all twelve activities from what happens on a bad day and how often, see what changes if the bad days are more than half, print a two-week day count, and get draft answers for each activity.",
  openGraph: {
    title: "PIP: Could You Get It, and What Do You Write? — Better Every Day",
    description:
      "PIP turns on a count of days nobody keeps. Score the twelve activities from bad days and how often, print a two-week day count, and draft each answer.",
    type: "website",
  },
};

export default function PipPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          PIP: could you get it, and what do you write?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Personal Independence Payment pays up to £194.60 a week (2026/27) to people between 16 and State Pension age
          whose health makes everyday life or getting around harder. It isn&rsquo;t means-tested, you can work, and
          it isn&rsquo;t about the diagnosis: it&rsquo;s scored. Twelve activities each have a ladder of descriptors worth
          0 to 12 points. Score 8 in daily living and it&rsquo;s £76.70 a week; 12, £114.60. Mobility is scored the same
          way, for £30.30 or £80.00.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The rule that decides most claims for conditions that come and go is one people rarely hear: a descriptor counts
          only if it applies on <em>more than half the days</em>, and something only counts as done if it&rsquo;s done
          safely, well enough, more than once, and in no more than twice the usual time. Memory doesn&rsquo;t keep that
          count. It keeps the worst day and the latest one, and an assessor sees the day someone managed to get there. So
          this tool asks two things for each activity: what happens on a bad day, and how many days a week are like that.
          It scores both ways, shows what a fortnight&rsquo;s count could change, gives you the count to print, and drafts
          each answer.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For England and Wales, with pointers for Scotland (Adult Disability Payment) and Northern Ireland. The
          four-point rule in the 2025 news isn&rsquo;t law; claims made now use today&rsquo;s rules. A scoring of what you
          enter, not advice; the DWP decides. Nothing you enter is sent anywhere; it stays in your browser. Refused? See{" "}
          <Link href="/challenge" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the DWP said no
          </Link>
          .
        </p>
      </header>
      <PipClient />
    </div>
  );
}
