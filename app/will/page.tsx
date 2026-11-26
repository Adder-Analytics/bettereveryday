import type { Metadata } from "next";
import Link from "next/link";
import WillClient from "./WillClient";

export const metadata: Metadata = {
  title: "No Will Yet: Who Would Get What, and What Would You Change? — Better Every Day",
  description:
    "Without a will, the law decides: an unmarried partner gets nothing, a spouse takes the first £322,000, children inherit everything at 18, and nobody you chose brings them up. See who would get what from your estate, in pounds, what passes outside a will anyway, and the notes to take to whoever writes yours.",
  openGraph: {
    title: "No Will Yet: Who Would Get What, and What Would You Change? — Better Every Day",
    description:
      "Everyone has a will. If you didn't write one, Parliament did. See who it gives your estate to, the gaps, and what fixing it costs.",
    type: "website",
  },
};

export default function WillPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          No will yet: who would get what, and what would you change?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Everyone has a will. If you don&rsquo;t write one, the intestacy rules are yours: a default written for a married
          couple with children of their own. An unmarried partner gets nothing, however long you&rsquo;ve been together. A
          stepchild gets nothing. Children inherit outright at 18, and nobody you chose is named to bring them up.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool shows who the default would give your estate to, in pounds, beside what passes outside a will anyway: a
          jointly owned home, life insurance in trust, a pension. Then it lists the gaps, the ways to get a will written and
          what they cost, and drafts the notes to take with you. In November, Will Aid solicitors write a basic will for a
          donation to charity.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          Worked out for England and Wales, with the rules for Scotland and Northern Ireland in words. It isn&rsquo;t legal
          advice. Nothing you enter is sent anywhere; it stays in your browser. Thinking about the years before, not after?
          See{" "}
          <Link href="/lpa" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            power of attorney
          </Link>
          .
        </p>
      </header>
      <WillClient />
    </div>
  );
}
