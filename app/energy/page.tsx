import type { Metadata } from "next";
import Link from "next/link";
import EnergyClient from "./EnergyClient";

export const metadata: Metadata = {
  title: "Behind on Energy Bills: What Can They Do, and What Do You Offer? — Better Every Day",
  description:
    "Behind on gas or electricity, a letter about a prepayment meter, or a meter that takes too much. See who a meter can't be forced on, the plan to offer, the money you may be due this winter, and the letter to send.",
  openGraph: {
    title: "Behind on Energy Bills: What Can They Do, and What Do You Offer? — Better Every Day",
    description:
      "The price cap rises about a quarter on 1 January. The supplier's letter suggests a number; the rules say it has to consider yours.",
    type: "website",
  },
};

export default function EnergyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Behind on energy bills: what can they do, and what do you offer?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The price cap goes up about a quarter on 1 January, just as the
          heating goes on. If you&rsquo;re already behind, the letters read as
          if the supplier sets the terms: pay this much, or we&rsquo;ll fit a
          prepayment meter. Mostly it doesn&rsquo;t. A supplier has to take
          what you can afford into account, and since 2023 there are homes
          where a meter mustn&rsquo;t be forced in at all.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool reads where you are (worried, behind, a final demand, a
          warrant letter, or a prepayment meter you can&rsquo;t keep topped
          up), says what protects your household, lists the money you may be
          due this winter, and writes the letter with your offer in it.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For Great Britain; Northern Ireland gets a pointer. It isn&rsquo;t
          legal advice, and nothing you enter is sent anywhere; it stays in
          your browser. If the problem is one big bill for old usage, go to{" "}
          <Link
            href="/catchup"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            a catch-up energy bill
          </Link>
          .
        </p>
      </header>
      <EnergyClient />
    </div>
  );
}
