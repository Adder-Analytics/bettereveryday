import type { Metadata } from "next";
import Link from "next/link";
import AttendanceClient from "./AttendanceClient";

export const metadata: Metadata = {
  title: "Attendance Allowance: Could They Get It, and What Do You Write? — Better Every Day",
  description:
    "Attendance Allowance is £76.70 or £114.60 a week for anyone over State Pension age who needs help with personal care or watching over. It isn't means-tested and needs no diagnosis. Check which rate the needs point to, see what it unlocks (Pension Credit's severe disability amount, Carer's Allowance, council tax), and get draft answers for the form that describe the worst typical day, not the best.",
  openGraph: {
    title: "Attendance Allowance: Could They Get It, and What Do You Write? — Better Every Day",
    description:
      "Most Attendance Allowance claims are lost on the form, not the rules: people describe their good days and write \"I manage\". Draft answers that say what actually happens, and date the claim.",
    type: "website",
  },
};

export default function AttendancePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Attendance Allowance: could they get it, and what do you write?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Attendance Allowance pays £76.70 or £114.60 a week (2026/27) to anyone over State Pension age who needs help
          with washing, dressing, the toilet, medicines or getting about, or needs someone to keep them safe. It
          isn&rsquo;t means-tested, so the house and the savings don&rsquo;t matter. It needs no diagnosis, and it&rsquo;s
          about the help someone <em>needs</em>, even if nobody gives it.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The rules are rarely the problem. The form is. People describe their good days, leave the night section blank, and
          write &ldquo;I manage&rdquo; when they mean they go without. This tool asks what actually happens, reads which
          rate that points to, counts what an award opens (Pension Credit&rsquo;s severe disability amount, Carer&rsquo;s
          Allowance, the council tax discount for dementia), and drafts each answer for the form in the words that count.
          It dates the claim: it&rsquo;s paid from the day of the call for the form, never before.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For England and Wales, with pointers for Scotland (Pension Age Disability Payment) and Northern Ireland. A
          judgement from what you enter, not advice; the DWP decides. Age UK, Independent Age and Citizens Advice will
          help with the form for free. Nothing you enter is sent anywhere; it stays in your browser. Refused? See{" "}
          <Link href="/challenge" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the DWP said no
          </Link>
          .
        </p>
      </header>
      <AttendanceClient />
    </div>
  );
}
