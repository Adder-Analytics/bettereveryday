import type { Metadata } from "next";
import Link from "next/link";
import IncentivesClient from "./IncentivesClient";

export const metadata: Metadata = {
  title: "Who Gains If You Say Yes? — Better Every Day",
  description:
    "Someone's recommending, selling, or urging you toward a choice — and they gain from your yes. Run Munger's 'show me the incentive' on the advice: name what the messenger gets, find out whose side the incentive is on, and — where it pulls against you — get the version of the advice from someone paid differently instead of just distrusting everyone.",
  openGraph: {
    title: "Who Gains If You Say Yes? — Better Every Day",
    description:
      "Advice from someone who wins whether or not you do is worth what it'd be worth from someone who didn't get paid for your yes. Subtract the incentive, then decide on the merits.",
    type: "website",
  },
};

export default function IncentivesPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Who gains if you say yes?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Most of the toolkit helps you check your <em>own</em>{" "}thinking &mdash;
          whether you&rsquo;ve widened the options, whether you could be wrong,
          whether the odds are on your side. But a lot of what you decide with
          doesn&rsquo;t come from you. It&rsquo;s handed to you: a recommendation,
          a quote, an offer, a &ldquo;trust me, take it.&rdquo; And the person
          handing it over almost always has something riding on which way you go.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          That&rsquo;s the check this tool runs. Not on your reasoning &mdash; on
          the reasoning you were <em>given</em>. Charlie Munger put it as bluntly
          as it can be put: <em>&ldquo;Show me the incentive and I&rsquo;ll show
          you the outcome.&rdquo;</em>{" "}A financial adviser paid on commission, an
          agent paid on the sale price, a contractor paid for the bigger job, a
          recruiter paid when you sign, a boss whose bonus rides on your yes &mdash;
          none of them is necessarily lying, and the advice might even be right.
          But you can&rsquo;t tell how much of it is the advice and how much is the
          incentive until you&rsquo;ve pulled the two apart.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The point isn&rsquo;t to distrust everyone &mdash; that&rsquo;s just as
          lazy as trusting everyone, and it throws away good advice along with the
          bad. The point is to find out whose side the incentive is on, and to act
          on the answer: weigh advice from someone whose interests track yours on
          its merits, and, where they don&rsquo;t, get the same recommendation from
          someone paid differently, or change the structure so their pay follows
          your outcome. The idea in full is in the{" "}
          <Link
            href="/models#incentive-structures"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            incentive-structures model
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <IncentivesClient />
    </div>
  );
}
