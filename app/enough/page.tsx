import type { Metadata } from "next";
import Link from "next/link";
import EnoughClient from "./EnoughClient";

export const metadata: Metadata = {
  title: "Enough to Decide? — Better Every Day",
  description:
    "You keep telling yourself you need to know more before you can decide — one more data point, one more opinion, one more week. Run the value-of-information test: name the one thing you're waiting on, say what you'd do under each way it lands, and if it's the same either way, you already have enough. More research is delay, not diligence.",
  openGraph: {
    title: "Enough to Decide? — Better Every Day",
    description:
      "The cure for analysis paralysis: information is only worth gathering if it could actually change what you'd do. Hubbard's value-of-information test, without the math.",
    type: "website",
  },
};

export default function EnoughPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Enough to decide?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          You can&rsquo;t decide yet, you tell yourself &mdash; not until you&rsquo;ve
          read a few more reviews, heard one more opinion, run the numbers one more
          time. So you go get more. And it feels responsible: gathering information
          before a big call is exactly what a careful person does. But somewhere in
          there the gathering stopped being about the decision and started being a
          way to not make it &mdash; and from the inside, those two are almost
          impossible to tell apart, because stalling wears the exact costume of
          thoroughness.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          There&rsquo;s a clean test that separates them, and it&rsquo;s the whole
          idea behind Douglas Hubbard&rsquo;s <em>How to Measure Anything</em>: a
          fact is worth knowing only for what it would <em>change</em> about the
          decision. Not how interesting it is, not how much more confident it would
          make you feel &mdash; only whether it could move the call. Run by that
          measure, most of what people agonize over learning turns out to be worth
          almost nothing, while the one fact that would actually flip the choice
          often goes unchased.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool runs the test without any math. Name the one thing you&rsquo;re
          waiting to find out, then say what you&rsquo;d do under each way it could
          land. If your move is the same either way, you already have enough &mdash;
          and the honest next step isn&rsquo;t more research, it&rsquo;s the
          decision. If it would change the call, then it&rsquo;s worth getting
          &mdash; but only when you can get it cheaply and in time, and the read
          will hand you the tool for exactly that.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          It&rsquo;s the plain-language twin of the{" "}
          <Link
            href="/weigh"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            flip point
          </Link>
          &rsquo;s own rule &mdash; only a fact that could move you across the line
          is worth knowing &mdash; run before you&rsquo;ve put a single number on
          anything. The idea in full is in the{" "}
          <Link
            href="/models#value-of-information"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            value-of-information model
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <EnoughClient />
    </div>
  );
}
