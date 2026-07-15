import type { Metadata } from "next";
import Link from "next/link";
import ReviewClient from "./ReviewClient";

export const metadata: Metadata = {
  title: "Due for review — Better Every Day",
  description:
    "The whole site runs on one loop: decide now, come back later to see what happened. This is the coming-back. One place that gathers every review and tripwire check you've scheduled across the tools, shows what's due and what's coming, and keeps your record from outrunning its last backup.",
  openGraph: {
    title: "Due for review — Better Every Day",
    description:
      "A record you never go back to grade is the most common failure in any decision journal. The return desk is the second half of the loop: everything you scheduled, gathered in one place, surfacing on the day it comes due.",
    type: "website",
  },
};

export default function ReviewPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Due for review
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Every tool here captures a decision and points it at the future: a
          forecast to grade in three months, a tripwire to check in six. That
          capture is the easy half. The half that actually teaches you anything
          is the <em>return</em> — and a forecast nobody goes back to check is
          the most common way a decision journal quietly fails.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          So this is the return desk. It gathers everything you&rsquo;ve
          scheduled across the{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            journal
          </Link>{" "}
          and the{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem room
          </Link>
          , shows you what&rsquo;s due today and what&rsquo;s still coming, and
          links each one straight to the place you answer it. Nothing is sent
          anywhere; it just reads what&rsquo;s already in your browser. Bookmark
          it, and it becomes the one page worth opening when you wonder what you
          promised yourself you&rsquo;d check.
        </p>
      </header>

      <ReviewClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Why a desk for the return at all? Because capturing a commitment and
          scheduling a check isn&rsquo;t the same as having a system you trust —
          the record only pays off if something reliably brings it back to you
          on the day. The thinking behind that is in{" "}
          <Link
            href="/writing/the-return"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The Return
          </Link>
          . And because everything here lives only in this browser, the record
          you&rsquo;re building toward is only as safe as its last copy —{" "}
          <Link
            href="/data"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            back it up
          </Link>{" "}
          when it grows.
        </p>
      </div>
    </div>
  );
}
