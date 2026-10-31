import type { Metadata } from "next";
import Link from "next/link";
import CollectorClient from "./CollectorClient";

export const metadata: Metadata = {
  title: "An Old Debt, a New Letter: Do You Still Owe It? — Better Every Day",
  description:
    "A debt collector writes about a card, a loan or a bill from years ago, and asks for the balance or £1 a month as goodwill. Check whether it's past the six-year limit (five in Scotland), get the letter to send, and the court deadline you mustn't miss.",
  openGraph: {
    title: "An Old Debt, a New Letter: Do You Still Owe It? — Better Every Day",
    description:
      "Before you pay anything towards an old debt, even £1, check one date: when you last paid.",
    type: "website",
  },
};

export default function CollectorPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          An old debt, a new letter: do you still owe it?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A company you&rsquo;ve never heard of writes about a credit card, a
          phone contract or a catalogue account from years ago. It has bought
          the debt, and it wants the balance, or &ldquo;just £1 a month to show
          goodwill&rdquo;. Most people pay something to make it stop, or bin
          the letter. Either can go badly wrong.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          One date decides most of it: when you last paid anything, or last
          admitted the debt in writing. Six years after that (five in
          Scotland), an ordinary debt can&rsquo;t be taken to court. But a
          payment before then starts the clock again, and a court claim you
          ignore becomes a judgment however old the debt is. This tool reads
          your date against the limit, writes the letter, and gives you any
          deadline you mustn&rsquo;t miss.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For England, Wales, Scotland and Northern Ireland. It isn&rsquo;t
          legal advice, and nothing you enter is sent anywhere; it stays in
          your browser. If the debt is recent and you owe it, try{" "}
          <Link
            href="/debts"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            which debt first?
          </Link>
          .
        </p>
      </header>
      <CollectorClient />
    </div>
  );
}
