import type { Metadata } from "next";
import Link from "next/link";
import LpaClient from "./LpaClient";

export const metadata: Metadata = {
  title: "Power of Attorney: Is It Too Late, and What Does Waiting Cost? — Better Every Day",
  description:
    "A Lasting Power of Attorney costs £92 and has to be made while the person understands it. Leave it too late and it's a Court of Protection deputyship: about £841 in the first year, £320 a year after, and 6 to 10 months. See where you stand, what to do this week, and what to say.",
  openGraph: {
    title: "Power of Attorney: Is It Too Late, and What Does Waiting Cost? — Better Every Day",
    description:
      "A dementia diagnosis doesn't mean it's too late. Waiting for a crisis often does. Price doing it now against a court later, date the steps, and get the words to start the conversation.",
    type: "website",
  },
};

export default function LpaPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Power of attorney: is it too late, and what does waiting cost?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          If someone can no longer manage their own affairs, nobody can step in for them by right. Not a husband or wife,
          not &ldquo;next of kin&rdquo;. The bank won&rsquo;t take instructions, the house can&rsquo;t be sold, and doctors
          decide about care. A Lasting Power of Attorney names who can. It costs £92 to register, but it has to be made
          while the person can still understand it.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Families often notice the change at Christmas, then wait for a crisis. By then it can be too late, and the only
          route left is the Court of Protection: several times the cost, months of waiting, and a yearly bill after that.
          This tool reads where you are, prices doing it now against doing it later, dates the steps, and writes the
          opening for the conversation and the letters.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For England and Wales, with pointers for Scotland and Northern Ireland. It isn&rsquo;t legal advice. Nothing you
          enter is sent anywhere; it stays in your browser. Caring for them most of the week? See{" "}
          <Link href="/carers" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            Carer&rsquo;s Allowance
          </Link>
          .
        </p>
      </header>
      <LpaClient />
    </div>
  );
}
