import type { Metadata } from "next";
import Link from "next/link";
import WalkawayClient from "./WalkawayClient";

export const metadata: Metadata = {
  title: "Where's Your Line? — Better Every Day",
  description:
    "Before a negotiation (a job offer, a raise, a car, a house, a rate), decide the worst deal you'll take from what you'll actually do if it falls through, set the target you'll aim for, and work out who should name the first number. Then check any offer against what you decided before you walked in.",
  openGraph: {
    title: "Where's Your Line? — Better Every Day",
    description:
      "Set your walk-away point before the other side's first number sets it for you. A private worksheet for the half hour before you negotiate.",
    type: "website",
  },
};

export default function WalkawayPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Where&rsquo;s your line?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          You&rsquo;re about to negotiate: a job offer, a raise, a car, a house, a
          rate for your work. You know roughly what you hope for, and roughly
          what would feel too low. That &ldquo;roughly&rdquo; is the problem. If the
          line isn&rsquo;t decided before you walk in, it gets decided in the room,
          by their first number and by how much nobody likes saying no.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This sets it beforehand. Your <strong>walk-away point</strong>{" "}comes
          from what you&rsquo;ll actually do if there&rsquo;s no deal (what
          negotiators call your <strong>BATNA</strong>, the best alternative to a
          negotiated agreement). Your <strong>target</strong>{" "}comes from what
          deals like this really go for. Then the tool tells you whether to name
          the first number, and what it should be.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          There&rsquo;s no share link, on purpose: your walk-away is the one number
          you never tell the other side. Nothing you enter is sent anywhere; it
          stays in your browser. Why the line comes first is in{" "}
          <Link
            href="/writing/decide-your-line-first"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            the essay
          </Link>
          .
        </p>
      </header>
      <WalkawayClient />
    </div>
  );
}
