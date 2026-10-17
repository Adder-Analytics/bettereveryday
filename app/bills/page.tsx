import type { Metadata } from "next";
import Link from "next/link";
import BillsClient from "./BillsClient";

export const metadata: Metadata = {
  title: "Who Pays for What? — Better Every Day",
  description:
    "Two of you share a home and one earns more. See half each, in proportion to pay, and pooling it all side by side in money, find out how much the choice is actually worth, and leave with a line you both agreed.",
  openGraph: {
    title: "Who Pays for What? — Better Every Day",
    description:
      "Half each, in proportion to pay, or pool it all: three fair ways to split the bills, each fair by a different principle. See what each leaves you, and choose one together.",
    type: "website",
  },
};

export default function BillsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Who pays for what?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Two of you share a home and one of you earns more. The bills were
          probably split in half the week you moved in and never looked at
          again. Now one of you is a little short every month, the other is a
          little uncomfortable about it, and neither wants to be the one who
          brings it up.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          There are three common answers, and{" "}
          <strong>each is fair by a different principle</strong>: half each
          (equal in), in proportion to pay (the same share of what you earn),
          or pooling it all (the same left over). This tool doesn&rsquo;t pick
          for you. It puts the three side by side in money, says how much the
          choice is actually worth, and ends in a line you both agreed.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For housemates splitting the rent on rooms that aren&rsquo;t equal,
          use{" "}
          <Link
            href="/split"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            who gets which room
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <BillsClient />
    </div>
  );
}
