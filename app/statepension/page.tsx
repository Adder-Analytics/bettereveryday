import type { Metadata } from "next";
import Link from "next/link";
import StatePensionClient from "./StatePensionClient";

export const metadata: Metadata = {
  title: "State Pension Gaps: Worth Paying, and By When? — Better Every Day",
  description:
    "Gaps in your National Insurance record? Find which years you'll need whatever happens, which only if you stop work early, and which you won't need; what each costs and adds to your State Pension; and the date each one closes.",
  openGraph: {
    title: "State Pension Gaps: Worth Paying, and By When? — Better Every Day",
    description:
      "About £957 can add about £358 a year to your State Pension for life. But a year that work would fill anyway buys nothing, and a year left too long closes for good. Sort yours.",
    type: "website",
  },
};

export default function StatePensionPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          State Pension gaps: worth paying, and by when?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Your State Pension is built from qualifying years on your National Insurance record: 35 for the full amount, at
          least 10 for any. A year with a gap can be filled with voluntary contributions, but only for six years after it
          ends. For most people who&rsquo;ll be short, it&rsquo;s the best-value pension they&rsquo;ll ever be offered:
          about £957 for about £358 a year, for life, rising each April.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          But a year that work would have filled anyway buys nothing. This tool sorts your open gaps into the years
          you&rsquo;ll need whatever happens (pay them, oldest first), the ones you&rsquo;ll only need if you stop work
          early (decide before each one closes), and the ones you won&rsquo;t. It prices what each buys, dates every
          deadline, and writes the messages to the Future Pension Centre and HMRC.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For the new State Pension (State Pension age after April 2016), anywhere in the UK. It isn&rsquo;t financial
          advice, and your gov.uk forecast beats any estimate. Nothing you enter is sent anywhere; it stays in your
          browser. Weighing other cover? See{" "}
          <Link href="/cover" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            insure it or carry it
          </Link>
          .
        </p>
      </header>
      <StatePensionClient />
    </div>
  );
}
