import type { Metadata } from "next";
import Link from "next/link";
import ScamClient from "./ScamClient";

export const metadata: Metadata = {
  title: "Is It Real? Before You Pay, Click or Reply — Better Every Day",
  description:
    "A text about a parcel fee, a call from your bank's fraud team, a new number saying it's your son. Don't judge how it looks: judge what it asks and who started it. Get the tells that settle it, the one check a scammer can't fake, the words to end the call, and what to do in the first hour if you've already paid.",
  openGraph: {
    title: "Is It Real? Before You Pay, Click or Reply — Better Every Day",
    description:
      "Everything a scammer shows you is cheap to fake. The check they can't fake is you contacting them, on details you found yourself.",
    type: "website",
  },
};

export default function ScamPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Is it real? Before you pay, click or reply
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A text says a parcel is held for a small fee. A calm voice from
          your bank&rsquo;s fraud team says your savings aren&rsquo;t safe. A
          new number says &ldquo;Hi Mum, I&rsquo;ve broken my phone.&rdquo;
          Each one wants an answer now, before you&rsquo;ve had time to think.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Looking hard at it doesn&rsquo;t help much. A logo, the right number
          on the screen, perfect English and the last four digits of your card
          all cost a scammer nothing. This tool asks about the things they
          can&rsquo;t hide: <strong>who started it, what it asks for, and how
          it wants paying</strong>. Then it gives you the one check they
          can&rsquo;t fake, which is contacting them yourself, and the words
          to end the call.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If it&rsquo;s really someone close asking for money, that&rsquo;s a
          different call:{" "}
          <Link
            href="/lend"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            lend it, give it, or say no
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <ScamClient />
    </div>
  );
}
