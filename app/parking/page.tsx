import type { Metadata } from "next";
import Link from "next/link";
import ParkingClient from "./ParkingClient";

export const metadata: Metadata = {
  title: "Parking Ticket: Pay or Appeal? — Better Every Day",
  description:
    "A ticket on the windscreen or a camera letter in the post. Work out what appealing costs if you lose (often nothing), get the letter to send, and the date for the next step, for council and private tickets in the UK.",
  openGraph: {
    title: "Parking Ticket: Pay or Appeal? — Better Every Day",
    description:
      "Paying the discount at once can throw away a free appeal; ignoring it turns £60 into a court claim. One sum decides it: what does losing cost?",
    type: "website",
  },
};

export default function ParkingPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Parking ticket: pay or appeal?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A ticket on the windscreen, or a letter a fortnight later with a
          photo of your number plate. Most people do one of two things: pay the
          discount at once to make it go away, or put it in a drawer and hope.
          The first often throws away an appeal that would have cost nothing.
          The second is how £60 becomes a court claim.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          One sum decides it: <strong>what does appealing cost if you lose?</strong>{" "}
          Often nothing, because the discount is held while they decide, or has
          already gone. Sometimes it&rsquo;s the discount, and then it&rsquo;s
          worth it only if your chance beats a break-even this tool works out.
          It also writes the letter and dates the next step.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          UK rules, for council and private tickets. It isn&rsquo;t legal
          advice, and nothing you enter is sent anywhere; it stays in your
          browser. A text saying you owe a parking fine is more likely to be{" "}
          <Link
            href="/scam"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            a scam
          </Link>
          .
        </p>
      </header>
      <ParkingClient />
    </div>
  );
}
