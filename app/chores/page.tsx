import type { Metadata } from "next";
import Link from "next/link";
import ChoresClient from "./ChoresClient";

export const metadata: Metadata = {
  title: "Who Does Which Chore? — Better Every Day",
  description:
    "Housemates, a couple, a family with teenagers: list the chores, including the remembering, rate how much each of you minds each one, and get a split where each chore goes to whoever minds it least and nobody carries more than their share as they count it.",
  openGraph: {
    title: "Who Does Which Chore? — Better Every Day",
    description:
      "Everyone is sure they do more than their share. List the chores, say how much each of you minds each one, and trade: when you mind different things, each of you can do less than half.",
    type: "website",
  },
};

export default function ChoresPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Who does which chore?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          In most homes the chores were never divided. They settled. Whoever
          noticed first, or minded the mess most, ended up doing it, and now
          each of you is quietly sure you do more than your share. You&rsquo;re
          probably both right, by your own count: your own work comes to mind
          more easily than anyone else&rsquo;s.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool replaces the two memories with one list, including the
          remembering, the planning and the noticing. Then it uses the thing
          that makes chores easier to split than rent:{" "}
          <strong>you don&rsquo;t mind the same ones</strong>. Each chore goes to
          whoever minds it least, so that nobody carries more than their share,
          judged by their own ratings.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For the rent on rooms that aren&rsquo;t equal, use{" "}
          <Link
            href="/split"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            who gets which room
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <ChoresClient />
    </div>
  );
}
