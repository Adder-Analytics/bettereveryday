import type { Metadata } from "next";
import BabyClient from "./BabyClient";

export const metadata: Metadata = {
  title: "A Baby's Coming: What to Tell, Claim, and By When? — Better Every Day",
  description:
    "Maternity and paternity pay and leave, counted back from the due date. The week that decides the pay, when to tell your employer, your pay through the year, and the claims after the birth that are only backdated a few months.",
  openGraph: {
    title: "A Baby's Coming: What to Tell, Claim, and By When? — Better Every Day",
    description:
      "The pay is decided about 15 weeks before the due date, by a week nobody marks. Count back, not forward.",
    type: "website",
  },
};

export default function BabyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          A baby&rsquo;s coming: what to tell, claim, and by when?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Everyone counts forward to the due date. The money is mostly settled
          long before it, in a week nobody marks: the 15th week before the
          week the baby&rsquo;s due, about 25 weeks in. Whether you get
          maternity or paternity pay depends on where you are with your
          employer by then, the first six weeks of maternity pay depend on what
          you earned in the eight weeks up to it, and the end of it is the date
          to tell your employer.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This counts back from your due date. It dates that week, says
          whether statutory pay applies and how much, draws your pay through
          the year so the drops are no surprise, and sorts the rest (Child
          Benefit, the grants, registering the birth, paternity leave) by what
          waiting would cost. Then it writes the letter to your employer.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For the UK, with Scotland&rsquo;s grants and Northern
          Ireland&rsquo;s paternity rules where they differ. For adoption and
          surrogacy the dates work differently. It isn&rsquo;t legal advice,
          and nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <BabyClient />
    </div>
  );
}
