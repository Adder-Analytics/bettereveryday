import type { Metadata } from "next";
import Link from "next/link";
import CoverClient from "./CoverClient";

export const metadata: Metadata = {
  title: "Insure It or Carry It? — Better Every Day",
  description:
    "The extended warranty at the till, phone cover, the rental car's damage waiver, a lower excess for a higher premium. Sort the loss by whether you could pay it yourself, and for the ones you could, see the odds the cover has to beat.",
  openGraph: {
    title: "Insure It or Carry It? — Better Every Day",
    description:
      "Insure the losses you couldn't absorb. Carry the ones you could. For those, one division shows the chance of a claim the cover needs to beat, and it's usually higher than it feels.",
    type: "website",
  },
};

export default function CoverPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Insure it or carry it?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          &ldquo;Would you like to protect that?&rdquo; The warranty at the till,
          cover for a phone, the damage waiver at the rental desk, a lower excess
          for a bit more a year. The question arrives just after you&rsquo;ve
          said yes to something, framed as a worry, with the odds left out.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          People get it wrong both ways. They pay heavily to cover small,
          replaceable things, mostly because they{" "}
          <strong>overestimate how often things fail</strong>, and they drop the
          cover that would actually save them after a few quiet years. One rule
          fixes both: <strong>insure the loss you couldn&rsquo;t absorb, carry the
          ones you could.</strong>{" "}For those, this tool shows the odds the cover
          has to beat.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If the worst case is bigger than a bill, like a home, an income or your
          health, start with{" "}
          <Link
            href="/ruin"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            the survival check
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <CoverClient />
    </div>
  );
}
