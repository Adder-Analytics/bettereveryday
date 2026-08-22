import type { Metadata } from "next";
import Link from "next/link";
import DecisionsClient from "./DecisionsClient";

export const metadata: Metadata = {
  title: "Your decisions — Better Every Day",
  description:
    "Everything you've worked on a real decision, gathered in one place and grouped by the decision itself — the journal entry, the pre-mortem, the tripwires, the calls you're sleeping on. Not what's due (that's the return desk) — the whole record, and a way back into any part of it. Nothing leaves your browser.",
  openGraph: {
    title: "Your decisions — Better Every Day",
    description:
      "You can walk one decision through half the toolkit; this is where the pieces come back together. Everything you've saved on a call, grouped by the call, in the order you worked it.",
    type: "website",
  },
};

export default function DecisionsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Your decisions
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          You can walk one real decision through half the toolkit &mdash; sort
          the door, hold its funeral, log the forecast, arm a tripwire &mdash;
          and each tool keeps its own piece. This is where the pieces come back
          together: everything you&rsquo;ve <em>saved</em> on a call, gathered in
          one place and grouped by the call itself, in the order you worked it.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          It&rsquo;s the companion to the{" "}
          <Link
            href="/review"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            return desk
          </Link>
          : that page shows what&rsquo;s <em>due</em> to check; this one shows the
          whole record, due or not. Everything here is read straight from this
          browser &mdash; nothing is sent anywhere.
        </p>
      </header>

      <DecisionsClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Only the tools that keep a record appear here &mdash; the{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            journal
          </Link>
          , the{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem
          </Link>
          , the{" "}
          <Link
            href="/tripwire"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            tripwire
          </Link>
          , and the{" "}
          <Link
            href="/cool"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            cooling-off
          </Link>{" "}
          tool. The answer-now tools work in the moment and keep nothing, so
          there&rsquo;s nothing of theirs to gather. Records line up as one
          decision when they share the same line &mdash; carried tool to tool it
          lines up on its own; typed separately, each stands alone. Because it all
          lives only in this browser,{" "}
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
