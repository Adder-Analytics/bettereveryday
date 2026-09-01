import type { Metadata } from "next";
import Link from "next/link";
import RuinClient from "./RuinClient";

export const metadata: Metadata = {
  title: "Can You Survive the Worst Case? — Better Every Day",
  description:
    "Some losses you recover from; some there's no coming back from. Before you weigh the odds and the upside, run the survival check the rest of the kit defers to: name the worst realistic outcome, and if it's one you can't recover from, refuse it — no upside pays for ruin — and find the version you'd survive.",
  openGraph: {
    title: "Can You Survive the Worst Case? — Better Every Day",
    description:
      "Loss vs. ruin. Against a downside you can't recover from, the average is a lie — the odds don't save you. Cap the downside below ruin and take the version you'd survive.",
    type: "website",
  },
};

export default function RuinPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Can you survive the worst case?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Most of the tools here help you weigh a decision: the odds against the
          stakes, one option against another, the flip point where the call tips.
          But every one of them rests on a floor that&rsquo;s usually left unspoken
          &mdash; that whatever happens, you&rsquo;re still around afterward to keep
          going. This tool checks that floor, because there&rsquo;s one kind of
          outcome where the whole calculation stops working.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The difference is between a <em>loss</em> and a <em>ruin</em>. A loss is
          recoverable: you take the hit, it hurts, and you&rsquo;re still in the
          game. A ruin is an outcome there&rsquo;s no coming back from &mdash; the
          reserve gone with nothing behind it, the reputation that doesn&rsquo;t
          rebuild, the health you can&rsquo;t undo, the door that only swings one
          way onto empty. And against a ruin, the thing people reach for &mdash;
          &ldquo;but it probably won&rsquo;t happen,&rdquo; &ldquo;but the upside is
          huge&rdquo; &mdash; simply doesn&rsquo;t apply. There is no
          &ldquo;on average&rdquo; for someone who&rsquo;s out of the game.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          It&rsquo;s the oldest rule the people who survive risk for a living all
          share. Nassim Taleb&rsquo;s version: never cross a river because it&rsquo;s
          four feet deep <em>on average</em>. Warren Buffett&rsquo;s first rule of
          investing is just &ldquo;never lose money&rdquo; &mdash; meaning never the
          kind you can&rsquo;t come back from. In order to succeed, you must first
          survive. This tool runs that check on your call, and it refuses to let a
          good average talk you past a bad tail.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          The move isn&rsquo;t simply &ldquo;don&rsquo;t.&rdquo; It&rsquo;s to name
          the worst realistic outcome, ask honestly whether you&rsquo;d recover from
          it, and &mdash; if you wouldn&rsquo;t &mdash; find the version of the same
          ambition whose downside you&rsquo;d survive. That&rsquo;s a{" "}
          <Link
            href="/models#margin-of-safety"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            margin of safety
          </Link>
          . If the worst case turns out to be one you <em>can</em> take, this
          isn&rsquo;t a ruin problem at all, and it&rsquo;ll send you to the{" "}
          <Link
            href="/weigh"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            flip point
          </Link>{" "}
          to weigh it properly. The idea in full is in the{" "}
          <Link
            href="/models#ruin"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            ruin model
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <RuinClient />
    </div>
  );
}
