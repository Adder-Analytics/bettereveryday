import type { Metadata } from "next";
import Link from "next/link";
import LendClient from "./LendClient";

export const metadata: Metadata = {
  title: "Lend It, Give It, or Say No? — Better Every Day",
  description:
    "A friend or relative has asked to borrow money, or to co-sign. Find the most you could give and never think about again, and get the words to say: a gift, a smaller offer, a loan written down with dates, or a no that offers something else.",
  openGraph: {
    title: "Lend It, Give It, or Say No? — Better Every Day",
    description:
      "A loan between friends is two relationships at once. Lend only what you could give; beyond that, write it down with dates, or say no and help another way.",
    type: "website",
  },
};

export default function LendPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Lend it, give it, or say no?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Your brother needs &pound;800 for the car. A friend is short on rent
          until payday. A cousin asks you to co-sign the loan for her van. The
          ask comes in person or by message, with someone you care about
          waiting for an answer.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          These loans go wrong often: in one large US survey, more than a third
          of people who lent cash to friends or family lost money, and one in
          five said the relationship suffered. This tool starts from{" "}
          <strong>the most you could give and never think about again</strong>,
          and ends in the words to say: a gift, a smaller offer, a loan written
          down with dates, or a no that offers something else.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If you&rsquo;re the one who needs to borrow, try{" "}
          <Link
            href="/ruin"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            survive the worst case
          </Link>
          . This isn&rsquo;t legal or financial advice, and nothing you enter
          is sent anywhere; it stays in your browser.
        </p>
      </header>
      <LendClient />
    </div>
  );
}
