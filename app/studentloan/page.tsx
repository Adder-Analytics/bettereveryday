import type { Metadata } from "next";
import Link from "next/link";
import StudentLoanClient from "./StudentLoanClient";

export const metadata: Metadata = {
  title: "Student Loan: Overpay, or Let It Run Out? — Better Every Day",
  description:
    "Will you clear your UK student loan before it's written off? What you'd repay letting it run, with an overpayment, and clearing it today; the pay at which it would clear; what the Plan 2 freeze costs you; and the refund you can claim if you earned under the threshold.",
  openGraph: {
    title: "Student Loan: Overpay, or Let It Run Out? — Better Every Day",
    description:
      "The balance isn't the bill. For most graduates, what they repay is set by their pay, and an overpayment only shrinks what gets written off. Find out which kind of borrower you are.",
    type: "website",
  },
};

export default function StudentLoanPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Student loan: overpay, or let it run out?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A student loan from the Student Loans Company isn&rsquo;t like other debt. You repay a share of your pay above a
          threshold, whatever you owe, and whatever is left after 25, 30 or 40 years is written off. So the balance
          isn&rsquo;t the bill. If you won&rsquo;t clear it before the write-off, a pound overpaid today doesn&rsquo;t
          cut what you repay; it only cuts what gets written off. If you will clear it, overpaying saves interest.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool runs your loan forward month by month to find out which kind of borrower you are. It prices an
          overpayment, and clearing it today, against letting it run; finds the pay at which it would clear; shows what
          the Plan 2 threshold freeze from April 2027 costs you; and checks whether you&rsquo;re owed a refund.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For loans from the Student Loans Company: Plans 1, 2, 4 and 5 and the Postgraduate Loan. Projections rest on
          assumptions you can change, and it isn&rsquo;t financial advice. Nothing you enter is sent anywhere; it stays in
          your browser. Paying off other debts too? See{" "}
          <Link href="/debts" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            which debt first
          </Link>
          .
        </p>
      </header>
      <StudentLoanClient />
    </div>
  );
}
