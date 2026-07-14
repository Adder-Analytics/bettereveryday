import type { Metadata } from "next";
import Link from "next/link";
import DataClient from "./DataClient";

export const metadata: Metadata = {
  title: "Your Data — Better Every Day",
  description:
    "Everything this site keeps for you lives only in your browser — nothing is uploaded. That's good for privacy and bad for durability: clear your cache or switch devices and it's gone. This page is the fix. Back up your logged decisions, armed tripwires, and practice record to one file you own, and restore it on any browser.",
  openGraph: {
    title: "Your Data — Better Every Day",
    description:
      "A backup you own. The tools here store your decisions, tripwires, and practice record in your browser and send nothing anywhere — so this page lets you export all of it to a single file and restore it on another browser or after clearing your data.",
    type: "website",
  },
};

export default function DataPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Your data
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Every tool on this site keeps what you write in{" "}
          <span className="text-[var(--foreground)]">your browser, and nowhere
          else</span>. Your decisions, your tripwires, your practice record —
          none of it is uploaded, none of it is on a server, and no one but you
          can see it. That&rsquo;s the privacy story, and it&rsquo;s a real one.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          It also has a cost worth being honest about: browser storage
          isn&rsquo;t durable. Clear your browsing data, switch to a new laptop
          or phone, or let the cache evict, and it&rsquo;s all gone — and this
          whole site is built on the promise that you come back in three months
          to see what actually happened. A record you&rsquo;ll lose is a review
          you&rsquo;ll never do. So the site owes you a way to hold your own
          data: back it up to a file, and restore it anywhere. That&rsquo;s this
          page.
        </p>
      </header>

      <DataClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Why a tool you can&rsquo;t get your data out of isn&rsquo;t really
          yours — the local-first case for durability as part of a record&rsquo;s
          worth — is in{" "}
          <Link
            href="/writing/a-record-you-can-hold"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            A Record You Can Hold
          </Link>
          . The{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>{" "}
          also keeps its own per-tool export, if you only want that one; this
          page backs up everything at once.
        </p>
      </div>
    </div>
  );
}
