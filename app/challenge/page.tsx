import type { Metadata } from "next";
import Link from "next/link";
import ChallengeClient from "./ChallengeClient";

export const metadata: Metadata = {
  title: "The DWP Said No: Challenge It? — Better Every Day",
  description:
    "A PIP, Universal Credit or ESA decision went against you. See your one-month deadline, how far your PIP points are from the line, what usually happens at reconsideration and appeal, and the letter to send.",
  openGraph: {
    title: "The DWP Said No: Challenge It? — Better Every Day",
    description:
      "The decision letter reads like the end of it. It's a first draft, with two more goes built in and a month to take each one.",
    type: "website",
  },
};

export default function ChallengePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          The DWP said no: challenge it?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The letter says you scored 6 points, or that your Universal Credit
          has been sanctioned, or that you&rsquo;ve been overpaid. It&rsquo;s
          printed, numbered and signed off by a decision maker, and it reads
          like the end of the matter.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          It&rsquo;s a first draft. You can ask the DWP to look again (a
          mandatory reconsideration), and then appeal to a tribunal that
          isn&rsquo;t the DWP, where about two in three PIP appeals go the
          claimant&rsquo;s way. Each step has a one-month deadline, and most of
          the people who lose out are the ones who stop. This tool dates your
          deadline, shows how far your PIP points are from the line, says
          what&rsquo;s at stake and writes the letter.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For DWP benefits in England, Wales and Scotland; Adult Disability
          Payment in Scotland and Northern Ireland get a pointer. It isn&rsquo;t
          legal advice, and nothing you enter is sent anywhere; it stays in
          your browser. Short of money while you wait? Try{" "}
          <Link
            href="/debts"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            which debt first
          </Link>
          .
        </p>
      </header>
      <ChallengeClient />
    </div>
  );
}
