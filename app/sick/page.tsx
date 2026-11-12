import type { Metadata } from "next";
import Link from "next/link";
import SickClient from "./SickClient";

export const metadata: Metadata = {
  title: "Off Sick: What Are You Owed, and What Do You Send? — Better Every Day",
  description:
    "Statutory Sick Pay changed in April 2026: it's paid from the first day off, with no earnings floor. Work out what you're owed, what the old rule would have paid, when it runs out, and the messages to send.",
  openGraph: {
    title: "Off Sick: What Are You Owed, and What Do You Send? — Better Every Day",
    description:
      "No more three unpaid days, and no more £125 floor. Sick pay from day one, priced for your days, with the fit note, SSP1 and benefit claim dated.",
    type: "website",
  },
};

export default function SickPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Off sick: what are you owed, and what do you send?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Ask anyone how sick pay works and you&rsquo;ll hear two rules: the
          first three days aren&rsquo;t paid, and you have to earn enough to
          get it at all. Both were true until 6 April 2026. Neither is now.
          Statutory Sick Pay starts on your first day off, and anyone on a
          payroll gets it, at {"£"}123.25 a week or 80% of their average pay if
          that&rsquo;s less.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool prices your days off under the rule now, next to what the
          rule you remember would have paid. If you&rsquo;re still off, it
          draws the weeks ahead to where SSP stops at 28 weeks, dates the fit
          note, the SSP1 form and the benefit claim before that, and writes the
          messages to send.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For employees and workers anywhere in the UK. It isn&rsquo;t legal
          advice, and nothing you enter is sent anywhere; it stays in your
          browser. If the job has ended, use{" "}
          <Link href="/leaving" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the final payslip tool
          </Link>
          {" "}too.
        </p>
      </header>
      <SickClient />
    </div>
  );
}
