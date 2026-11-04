import type { Metadata } from "next";
import Link from "next/link";
import LeavingClient from "./LeavingClient";

export const metadata: Metadata = {
  title: "Leaving a Job: Is Your Last Pay Right? — Better Every Day",
  description:
    "You've left a job, or you're about to. Check the final payslip: the holiday you'd built up, priced at a day's real pay, any notice cut short, and every deduction. Get the email to send and the deadline.",
  openGraph: {
    title: "Leaving a Job: Is Your Last Pay Right? — Better Every Day",
    description:
      "A day's holiday is a day's pay: your salary over the days you work, not over 365. Check the last payslip before you spend it.",
    type: "website",
  },
};

export default function LeavingPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Leaving a job: is your last pay right?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Every job ends, and the last payslip is the one nobody checks.
          It&rsquo;s worked out by hand, outside the normal pay run, and
          it&rsquo;s where the easy mistakes land: holiday you&rsquo;d built up
          and not taken, notice cut short, and deductions taken on the way out.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The most common mistake is the day rate. A day&rsquo;s holiday is a
          day&rsquo;s pay, and you don&rsquo;t work 365 days a year. Payroll
          often divides your salary by 365 anyway, which pays each day about
          29% less. This tool works out what you&rsquo;re owed, checks it
          against the payslip, judges each deduction, dates the deadline and
          writes the email.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For employees and workers in England, Wales, Scotland and Northern
          Ireland. It isn&rsquo;t legal advice, and nothing you enter is sent
          anywhere; it stays in your browser. Being made redundant? Use{" "}
          <Link href="/redundancy" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the redundancy tool
          </Link>
          {" "}instead: it covers this and redundancy pay.
        </p>
      </header>
      <LeavingClient />
    </div>
  );
}
