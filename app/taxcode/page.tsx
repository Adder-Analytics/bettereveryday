import type { Metadata } from "next";
import Link from "next/link";
import TaxCodeClient from "./TaxCodeClient";

export const metadata: Metadata = {
  title: "Is Your Tax Code Right? — Better Every Day",
  description:
    "Read your PAYE tax code part by part, see the code your details should give, and find out what the difference costs by 5 April. Fixed before then, over-taken tax comes back in one payslip.",
  openGraph: {
    title: "Is Your Tax Code Right? — Better Every Day",
    description:
      "1257L, M1, BR, K475: what your code means, what it should be, and what it's costing you by 5 April. With what to tell HMRC and payroll.",
    type: "website",
  },
};

export default function TaxCodePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Is your tax code right?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The code on your payslip is HMRC&rsquo;s guess about your year: how much you&rsquo;ll earn, from where, and
          what should come off your tax-free pay. Most people never read it. A new job without a P45, a box ticked on
          the wrong line, a company car that went back last year or a Marriage Allowance nobody added can each take
          hundreds of pounds too much, or too little, a few pounds at a time.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool reads your code part by part, builds the code your details should give, and runs both through the
          year payslip by payslip. It says what the difference costs by 5 April and how much has already gone. Most
          codes are a running total, so a corrected one gives the lot back in your next pay. After 5 April it becomes a
          claim. It also writes what to tell HMRC and payroll.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For employees and pensioners paid through PAYE anywhere in the UK, with 2026/27 rates. It isn&rsquo;t tax
          advice, and nothing you enter is sent anywhere; it stays in your browser. Self-employed as well? Use{" "}
          <Link href="/taxreturn" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the tax return tool
          </Link>
          {" "}too.
        </p>
      </header>
      <TaxCodeClient />
    </div>
  );
}
