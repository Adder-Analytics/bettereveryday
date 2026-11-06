import type { Metadata } from "next";
import Link from "next/link";
import RepairsClient from "./RepairsClient";

export const metadata: Metadata = {
  title: "The Landlord Won't Fix It: What Now? — Better Every Day",
  description:
    "Damp, mould, no heating, a leak the landlord hasn't fixed. See how long they've known on paper, the date to give them (Awaab's Law timescales for social tenants), the next step, and the letters to send.",
  openGraph: {
    title: "The Landlord Won't Fix It: What Now? — Better Every Day",
    description:
      "You've lived with it for months. On paper, they may not know yet. Put it in writing, give a date, and take the next step when it passes.",
    type: "website",
  },
};

export default function RepairsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          The landlord won&rsquo;t fix it: what now?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The mould came back, the boiler keeps cutting out, the window
          won&rsquo;t shut. You&rsquo;ve mentioned it at the door and on the
          phone, and it feels like they must know. You live with it every
          day, so of course they know.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          On paper, they may not. A landlord&rsquo;s duty to repair starts
          when they know about the problem, and everything that comes after
          (the council&rsquo;s inspection, a complaint, compensation) counts
          from a report you can show someone. This tool puts the two clocks
          side by side, gives the landlord a fair date, lays out the steps
          after it and writes each letter. Council and housing association
          tenants get the deadlines in Awaab&rsquo;s Law.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For renters in England; Wales, Scotland, Northern Ireland and
          lodgers get a pointer. It isn&rsquo;t legal advice, and nothing you
          enter is sent anywhere; it stays in your browser. Moving out
          instead? Try{" "}
          <Link
            href="/deposit"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            get your deposit back
          </Link>
          .
        </p>
      </header>
      <RepairsClient />
    </div>
  );
}
