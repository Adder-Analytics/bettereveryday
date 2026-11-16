import type { Metadata } from "next";
import Link from "next/link";
import ChildcareClient from "./ChildcareClient";

export const metadata: Metadata = {
  title: "Childcare Codes: What You Can Get, and By When? — Better Every Day",
  description:
    "30 funded hours from 9 months and Tax-Free Childcare, dated for your child: when the code has to be issued, what the hours and the top-up are worth, the three-monthly reconfirmations, and where the £100,000 line sits and what a pension contribution does to it.",
  openGraph: {
    title: "Childcare Codes: What You Can Get, and By When? — Better Every Day",
    description:
      "The code has to be in by the day before term. The account has to be reconfirmed every three months. And £1 over £100,000 loses all of it. The dates and the sums, for your child.",
    type: "website",
  },
};

export default function ChildcarePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Childcare codes: what you can get, and by when?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          In England, working parents can get 30 hours a week of funded childcare from the term after their child
          turns 9 months, and anyone in the UK can use Tax-Free Childcare, where the government adds £2 for every £8.
          Together they&rsquo;re often worth £8,000 to £10,000 a year. Both depend on dates nobody marks: a code
          issued before the term starts, an account reconfirmed every three months, and an income line at
          £100,000 where one pound more loses everything.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool dates the code for your child, prices the hours and the top-up, checks each parent against both
          income tests, works out what a pension contribution would do near £100,000, and puts every reconfirmation in
          your calendar.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          Funded hours are worked out for England; Scotland, Wales and Northern Ireland get a pointer and the
          Tax-Free Childcare sums. It isn&rsquo;t financial advice, and nothing you enter is sent anywhere; it stays in
          your browser. Still expecting? Start with{" "}
          <Link href="/baby" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            a baby on the way
          </Link>
          .
        </p>
      </header>
      <ChildcareClient />
    </div>
  );
}
