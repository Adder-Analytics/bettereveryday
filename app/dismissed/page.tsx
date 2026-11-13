import type { Metadata } from "next";
import Link from "next/link";
import DismissedClient from "./DismissedClient";

export const metadata: Metadata = {
  title: "Dismissed: Do You Have a Claim, and By When? — Better Every Day",
  description:
    "Sacked, given notice or pushed out? Since October 2026 you have six months, not three, and from January 2027 six months' service is enough for unfair dismissal. Find your Acas deadline, count your service the way the law does, and check each claim.",
  openGraph: {
    title: "Dismissed: Do You Have a Claim, and By When? — Better Every Day",
    description:
      "Not two years and three months any more. The Acas date, your service against the line, each claim, and the letters.",
    type: "website",
  },
};

export default function DismissedPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Dismissed: do you have a claim, and by when?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Most people who lose a job know two rules: you need two years to
          claim unfair dismissal, and you have three months to do it. For jobs
          ending since 1 October 2026 the deadline is six months. For jobs
          ending from 1 January 2027 the two years becomes six months. And
          several claims never needed any service at all.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool dates the day to contact Acas by (an appeal doesn&rsquo;t
          pause it), counts your service the way the law does, with the notice
          you weren&rsquo;t given added on, and sets it against the line that
          applies. Then it goes through each claim you might have, and writes
          the letters: asking for the reason in writing, the appeal, and the
          notice pay.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For employees in England, Scotland and Wales, with a shorter read for
          Northern Ireland. It isn&rsquo;t legal advice, and nothing you enter
          is sent anywhere; it stays in your browser. For the money on the way
          out, use{" "}
          <Link href="/leaving" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the final payslip tool
          </Link>
          {" "}too.
        </p>
      </header>
      <DismissedClient />
    </div>
  );
}
