import type { Metadata } from "next";
import Link from "next/link";
import RefundClient from "./RefundClient";

export const metadata: Metadata = {
  title: "Get Your Money Back — Better Every Day",
  description:
    "It broke, it never came, or the job was done badly. Find what the law gives you for this problem at this age, get the message to send, a date for them to reply by, and the next step already chosen: your card company, the platform, an ombudsman or small claims.",
  openGraph: {
    title: "Get Your Money Back — Better Every Day",
    description:
      "One remedy, named in law, by a date, with the next rung chosen before you send it. The message to the seller, the section 75 or chargeback message to your card company, and the dates.",
    type: "website",
  },
};

export default function RefundPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Get your money back
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The washing machine dies in month four. The parcel says delivered
          and isn&rsquo;t there. The new boiler leaks. You ring, someone says
          it&rsquo;s the manufacturer&rsquo;s problem or the courier&rsquo;s,
          and most people stop there. Most people with a grievance never
          complain at all, mostly because it looks like effort that
          won&rsquo;t work.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool does the effort. It finds what the law gives you{" "}
          <strong>for this problem at this age</strong>, writes the message,
          sets a date for them to reply by, and chooses the next step before
          you send the first one: your card company, the platform, an
          ombudsman, or small claims.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          It follows UK law, with the US differences noted. It isn&rsquo;t
          legal advice, and nothing you enter is sent anywhere; it stays in
          your browser. If the &ldquo;seller&rdquo; was a message asking you
          to pay by transfer, try{" "}
          <Link
            href="/scam"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            is it real?
          </Link>{" "}
          first. For a flight that was delayed, cancelled or overbooked, the
          rules are different and the amounts fixed: try{" "}
          <Link
            href="/flight"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            flight delayed or cancelled
          </Link>
          .
        </p>
      </header>
      <RefundClient />
    </div>
  );
}
