import type { Metadata } from "next";
import Link from "next/link";
import PensionClient from "./PensionClient";

export const metadata: Metadata = {
  title: "Taking Money From Your Pension: How Much Tax, and What Does It Start? — Better Every Day",
  description:
    "The same £40,000 from a pension can cost £2,000 in tax or nearly £10,000, depending on how and when you take it. Compare the ways, see what the emergency code will take off and which form gets it back, and what it starts: the £10,000 limit on paying in, and the April 2027 inheritance tax change.",
  openGraph: {
    title: "Taking Money From Your Pension: How Much Tax, and What Does It Start? — Better Every Day",
    description:
      "A quarter tax-free is the rule everyone knows. Which quarter, and which tax year the rest lands in, is where the money is. Work it out on your own pot before you fill in the form.",
    type: "website",
  },
};

export default function PensionPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Taking money from your pension: how much tax, and what does it start?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          From 55 (57 from April 2028) you can take money out of a pension pot. A quarter is usually tax-free and the rest
          is taxed as income, on top of everything else you earn that tax year. That much most people know. What they
          don&rsquo;t know is that <em>how</em>{" "}you ask for it and <em>which side of 5 April</em>{" "}it lands can change the
          tax by thousands, that the first payment is usually taxed as if you&rsquo;d get the same every month, and that
          taking any taxable money caps what you can pay in afterwards at £10,000 a year.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool prices the ways of taking the sum you need on your own income, picks the cheapest, shows what will come
          off the first payment and which form claims it back, and flags what it starts. If you&rsquo;re taking it because
          of the inheritance tax change in April 2027, it shows what actually reaches your family each way. It writes the
          messages to your provider and your other schemes.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For UK income tax, with Scottish rates. It isn&rsquo;t advice; Pension Wise (MoneyHelper) gives a free
          appointment. Nothing you enter is sent anywhere; it stays in your browser. Someone offering to unlock your
          pension early? See{" "}
          <Link href="/scam" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            is this a scam?
          </Link>
          .
        </p>
      </header>
      <PensionClient />
    </div>
  );
}
