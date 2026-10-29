import type { Metadata } from "next";
import Link from "next/link";
import CatchupClient from "./CatchupClient";

export const metadata: Metadata = {
  title: "A Catch-up Energy Bill: What Do You Owe? — Better Every Day",
  description:
    "The meter stopped sending readings, the estimates ran low, and now one bill asks for a year or two at once. Find the part that's too old to charge under the back-billing rule, get the complaint to send, a repayment plan to ask for, and the date the free ombudsman opens.",
  openGraph: {
    title: "A Catch-up Energy Bill: What Do You Owe? — Better Every Day",
    description:
      "Energy used more than 12 months before the bill usually can't be charged. Check one date before you check the total.",
    type: "website",
  },
};

export default function CatchupPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          A catch-up energy bill: what do you owe?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The smart meter stopped talking to the supplier, or the estimates
          ran low, and nobody noticed. Then an engineer reads the meter, and
          one bill asks for twenty months of the difference at once: £1,800
          more than you&rsquo;ve paid. Most people pay it in a panic, or argue
          with it in general terms and get nowhere.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          One date decides most of it. In Great Britain a supplier can&rsquo;t
          bill you for energy used more than 12 months before the bill, unless
          you blocked the meter being read. So the question isn&rsquo;t
          &ldquo;is this too much?&rdquo; but{" "}
          <strong>&ldquo;when was it used?&rdquo;</strong> This tool splits
          the bill at that date, writes the complaint, works out the repayment
          plan to ask for, and gives you the day the free ombudsman opens.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          Gas and electricity for your home, in Great Britain, with Northern
          Ireland&rsquo;s 13-month rule noted. It isn&rsquo;t legal advice, and
          nothing you enter is sent anywhere; it stays in your browser. If the
          bill sits on top of other debts, try{" "}
          <Link
            href="/debts"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            which debt first?
          </Link>
          .
        </p>
      </header>
      <CatchupClient />
    </div>
  );
}
