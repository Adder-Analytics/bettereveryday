import type { Metadata } from "next";
import Link from "next/link";
import PensionCreditClient from "./PensionCreditClient";

export const metadata: Metadata = {
  title: "Pension Credit: Could You Get It, and What Does It Unlock? — Better Every Day",
  description:
    "About 820,000 households who could get Pension Credit don't claim it, mostly because they think owning a home or having savings rules them out. Estimate the weekly award, see what it unlocks (a free TV licence at 75, the Warm Home Discount, council tax help), what Attendance Allowance would change, and how far back a claim made today can reach.",
  openGraph: {
    title: "Pension Credit: Could You Get It, and What Does It Unlock? — Better Every Day",
    description:
      "A few pounds a week of Pension Credit can be worth hundreds a year in what it opens. It can only be backdated three months, so every week past that is money gone.",
    type: "website",
  },
};

export default function PensionCreditPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Pension Credit: could you get it, and what does it unlock?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Pension Credit tops up a pensioner&rsquo;s income to £238 a week (£363.25 for a couple) in 2026/27, with more for
          disability, caring and some housing costs. About four in ten of the households who could get it don&rsquo;t, and
          most of them assume they wouldn&rsquo;t qualify: they own their home, or have some savings, or a small private
          pension. None of those rules you out.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The weekly sum is only part of it. Any award opens a free TV licence at 75, the Warm Home Discount and Cold
          Weather Payments; the Guarantee Credit part usually brings the whole council tax bill and the maximum Housing
          Benefit. This tool estimates the award, counts what it unlocks, shows what Attendance Allowance would change, and
          dates the line that matters: a claim can be backdated three months, and no further. It writes the opening for the
          conversation with a parent, what to say on the claim call, and the letters that follow.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For England and Wales, with pointers for Scotland and Northern Ireland. It&rsquo;s an estimate, not advice, and
          the DWP decides; Age UK, Independent Age and Citizens Advice do free benefits checks. Nothing you enter is sent
          anywhere; it stays in your browser. A claim refused? See{" "}
          <Link href="/challenge" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the DWP said no
          </Link>
          .
        </p>
      </header>
      <PensionCreditClient />
    </div>
  );
}
