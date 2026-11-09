import type { Metadata } from "next";
import BereavementClient from "./BereavementClient";

export const metadata: Metadata = {
  title: "Someone Has Died: What's Due, and When? — Better Every Day",
  description:
    "The admin after a death, sorted by what waiting would cost. The few dates that matter (Bereavement Support Payment's three months, funeral help, inheritance tax), what can wait, who doesn't have to pay the debts, and the letters to send.",
  openGraph: {
    title: "Someone Has Died: What's Due, and When? — Better Every Day",
    description:
      "Most of the list can wait. A few things can't, and nobody rings to remind you about them.",
    type: "website",
  },
};

export default function BereavementPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Someone has died: what&rsquo;s due, and when?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          I&rsquo;m sorry. In the weeks after a death, the paperwork arrives
          in the order other people send it: the registrar, the bank, the
          pension, the council, the phone company. Each letter sounds urgent.
          Almost none of them is. A few things do have a date that costs money
          if it passes, and they&rsquo;re the quiet ones: nobody rings to
          remind you.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This sorts the list by what waiting would cost. Tell it when they
          died and who they were to you. It dates the few things that matter
          from that day, says plainly what can wait, explains who does and
          doesn&rsquo;t pay their debts, and writes the letters.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          Mainly for England and Wales, with Scotland&rsquo;s and Northern
          Ireland&rsquo;s timings where they differ. It isn&rsquo;t legal
          advice, and nothing you enter is sent anywhere; it stays in your
          browser.
        </p>
      </header>
      <BereavementClient />
    </div>
  );
}
