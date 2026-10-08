import type { Metadata } from "next";
import Link from "next/link";
import ParClient from "./ParClient";

export const metadata: Metadata = {
  title: "Neither One Wins — Better Every Day",
  description:
    "Two good options, each with something the other can't give, and every pass at the pros and cons comes out even. Find out whether it's a painful choice, a missing fact, a tie to flip, or a real hard choice — options on a par, in Ruth Chang's sense — that you settle by committing.",
  openGraph: {
    title: "Neither One Wins — Better Every Day",
    description:
      "When neither option is better and they aren't equal either, more weighing won't find the answer. Run the small-improvement test, then choose the one you'll stand behind.",
    type: "website",
  },
};

export default function ParPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Neither one wins
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Two good options. Each gives you something the other can&rsquo;t: the
          work or the people, the city or the quiet, the safe thing or the one
          you&rsquo;d always wonder about. You&rsquo;ve made the list more than
          once and it keeps coming out even. It&rsquo;s natural to assume
          you&rsquo;re missing something, and that one more pass will find the
          right answer.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Sometimes you are missing something. But the philosopher{" "}
          <strong>Ruth Chang</strong>{" "}argues that many of the hardest choices
          aren&rsquo;t missing anything. The options are{" "}
          <strong>on a par</strong>: neither is better, and they aren&rsquo;t equal
          either. For those, there&rsquo;s no hidden answer to find. You settle
          them by committing to one. This tool tells the cases apart with her{" "}
          <strong>small-improvement test</strong>, and if it&rsquo;s a real par,
          helps you make the commitment and write it down.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If there are more than two options, score them first with{" "}
          <Link
            href="/compare"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            the comparison
          </Link>{" "}
          and bring the two finalists here. Nothing you enter is sent anywhere;
          it stays in your browser.
        </p>
      </header>
      <ParClient />
    </div>
  );
}
