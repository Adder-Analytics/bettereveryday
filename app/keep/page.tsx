import type { Metadata } from "next";
import Link from "next/link";
import KeepClient from "./KeepClient";

export const metadata: Metadata = {
  title: "Still Worth Paying For? — Better Every Day",
  description:
    "The gym, the streaming services, the app that renewed in March. Go through your subscriptions one by one: what each costs a use, whether paying per use is cheaper, and whether you'd sign up today at this price.",
  openGraph: {
    title: "Still Worth Paying For? — Better Every Day",
    description:
      "Every renewal is a decision made by default. Ask each subscription the fresh-start question: would you sign up today, at this price, for the use you actually got?",
    type: "website",
  },
};

export default function KeepPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Still worth paying for?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Each subscription was a good idea the day you started it. Since then
          it has renewed itself, quietly, and nobody has asked the question
          again. The gym you meant to go to twice a week, the second streaming
          service, the app with the free trial that ended in March.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          Three pulls keep them going: we expect to use them more than we do,
          a flat fee feels safer than paying per use, and whatever is already
          happening has a head start over a change. This tool goes through them
          one at a time and asks each the{" "}
          <strong>fresh-start question</strong>: if you didn&rsquo;t have it,
          would you sign up today, at this price, for the use you actually got?
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If it&rsquo;s a bigger commitment you&rsquo;ve put years into, try{" "}
          <Link
            href="/quit"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            the quit-or-stay test
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <KeepClient />
    </div>
  );
}
