import type { Metadata } from "next";
import Link from "next/link";
import CouncilTaxClient from "./CouncilTaxClient";

export const metadata: Metadata = {
  title: "Behind on Council Tax: What Happens Next? — Better Every Day",
  description:
    "A council tax reminder, a final notice or a court summons. See the date that keeps your monthly instalments, what the next step adds, whether the bill is missing a discount, and the letter to send.",
  openGraph: {
    title: "Behind on Council Tax: What Happens Next? — Better Every Day",
    description:
      "One missed council tax instalment can make the whole year due in a fortnight. The reminder is the cheapest letter you'll get.",
    type: "website",
  },
};

export default function CouncilTaxPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Behind on council tax: what happens next?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          You missed one month. Then a reminder came, and it went in the
          drawer with the bill. In England and Wales that&rsquo;s the most
          expensive drawer in the house: if the missed instalment isn&rsquo;t
          paid within seven days of the reminder, you lose the right to pay
          monthly and the rest of the year falls due at once. After that come
          a court summons with costs, a liability order and, often, bailiffs.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool reads the letter you&rsquo;ve got, dates what keeps the
          instalments (or gets them back), shows what the next step would add,
          and writes the letter to send. It also checks the bill itself: a
          student, a carer or someone with dementia in the house doesn&rsquo;t
          count, and plenty of bills are 25% too high because nobody told the
          council.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For England and Wales, including the changes due in England from
          April 2027; Scotland and Northern Ireland get a pointer. It
          isn&rsquo;t legal advice, and nothing you enter is sent anywhere; it
          stays in your browser. If bailiffs have already written, go to{" "}
          <Link
            href="/bailiff"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            a bailiff&rsquo;s letter
          </Link>
          .
        </p>
      </header>
      <CouncilTaxClient />
    </div>
  );
}
