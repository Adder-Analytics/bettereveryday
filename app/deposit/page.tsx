import type { Metadata } from "next";
import Link from "next/link";
import DepositClient from "./DepositClient";

export const metadata: Metadata = {
  title: "Get Your Deposit Back — Better Every Day",
  description:
    "You've moved out and the landlord wants a new carpet, a full repaint and a professional clean from your deposit. Price each deduction the way an adjudicator would, get the reply to send, and the last day to take it to the free dispute service.",
  openGraph: {
    title: "Get Your Deposit Back — Better Every Day",
    description:
      "Wear and tear isn't chargeable, and a five-year-old carpet isn't billed at the price of a new one. One number to ask for, the reply to send, and the date the free dispute window closes.",
    type: "website",
  },
};

export default function DepositPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Get your deposit back
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          You hand back the keys, and a week later the agent&rsquo;s email
          lists the deductions: a new carpet, a full repaint, a professional
          clean, something for the picture-hook holes. It comes to most of the
          deposit. It feels like your word against theirs, so most people
          haggle a little and let the rest go.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          It isn&rsquo;t your word against theirs. The deposit is your money,
          the landlord has to justify every deduction with evidence, wear and
          tear isn&rsquo;t chargeable, and a five-year-old carpet is charged
          for the life it had left, not the price of a new one. This tool{" "}
          <strong>prices each deduction the way an adjudicator would</strong>,
          writes the reply, and gives you the last day to take it to the free
          dispute service.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          UK rules, written for England and Wales, with Scotland and Northern
          Ireland noted. It isn&rsquo;t legal advice, and nothing you enter is
          sent anywhere; it stays in your browser. For anything else you
          paid for that went wrong, try{" "}
          <Link
            href="/refund"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            get your money back
          </Link>
          .
        </p>
      </header>
      <DepositClient />
    </div>
  );
}
