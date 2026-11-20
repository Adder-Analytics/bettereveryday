import type { Metadata } from "next";
import Link from "next/link";
import CarersClient from "./CarersClient";

export const metadata: Metadata = {
  title: "Carer's Allowance: Can You Get It, and Can You Earn This? — Better Every Day",
  description:
    "Carer's Allowance pays £86.45 a week, but a pound over the £204 earnings limit loses all of it. Work out your earnings the way the DWP counts them, see how much headroom you have, what gets you back under, and when earning more isn't worth it.",
  openGraph: {
    title: "Carer's Allowance: Can You Get It, and Can You Earn This? — Better Every Day",
    description:
      "The limit is £204 a week, but it's tested after tax, National Insurance, half your pension and care costs. Many people who think they're over aren't. Some who think they're fine are one bonus away from an overpayment.",
    type: "website",
  },
};

export default function CarersPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Carer&rsquo;s Allowance: can you get it, and can you earn this?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          If you look after someone for 35 hours a week or more, and they get a disability benefit, you can get
          Carer&rsquo;s Allowance: £86.45 a week in 2026/27, with a National Insurance credit for every week. You can work
          too, but the earnings limit is a cliff, not a slope. Earn a pound over £204 a week and you lose all £86.45 for
          that week.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The £204 is tested after tax, National Insurance, half of what you pay into a pension, and some care costs, so
          your payslip&rsquo;s gross isn&rsquo;t the number that matters. This tool works out the number that does, shows
          how much room you have before the cliff, what gets you back under if you&rsquo;re over, and when extra hours
          leave you worse off. It writes the messages to the Carer&rsquo;s Allowance Unit, to payroll, and about an
          overpayment.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For England and Wales, with pointers for Scotland (Carer Support Payment) and Northern Ireland. It isn&rsquo;t
          advice, and the DWP decides; for a full benefits check, see Carers UK or Citizens Advice. Nothing you enter is
          sent anywhere; it stays in your browser. A decision gone against you? See{" "}
          <Link href="/challenge" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the DWP said no
          </Link>
          .
        </p>
      </header>
      <CarersClient />
    </div>
  );
}
