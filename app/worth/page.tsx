import type { Metadata } from "next";
import Link from "next/link";
import WorthClient from "./WorthClient";

export const metadata: Metadata = {
  title: "Is It Worth the Time? — Better Every Day",
  description:
    "Pay for delivery or do the shop? Drive across town to save a fiver? Take the cheaper flat with the longer commute? Put the trade into one number, its price per hour, and set it against your own price for an hour like that one.",
  openGraph: {
    title: "Is It Worth the Time? — Better Every Day",
    description:
      "Every trade between time and money has a price per hour. Work it out, set it against what an hour like that is worth to you, and stop letting the percentage decide.",
    type: "website",
  },
};

export default function WorthPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Is it worth the time?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Pay six pounds for delivery or spend an hour on the shop. Drive twenty
          minutes for a better price. Take the cheaper flat and the longer
          commute. These calls come up every week, and most of them get made on
          feel.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The feel is unreliable in a known way. A saving looks big or small{" "}
          <strong>as a share of the price</strong>, so people will cross town to
          save £5 on £15 and not on £125, though it&rsquo;s the same £5 and the same
          drive. This tool turns the trade into one number,{" "}
          <strong>its price per hour</strong>, and sets it against your own price
          for an hour like that one.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If the money is only one part of a bigger choice, like a move or a job,
          weigh it with the rest in{" "}
          <Link
            href="/compare"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            the comparison
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <WorthClient />
    </div>
  );
}
