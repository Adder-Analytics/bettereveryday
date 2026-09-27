import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline — Better Every Day",
  description:
    "You're offline. The toolkit is local-first, so the pages you've already opened still work, and everything you've entered is safe on your device.",
  robots: { index: false, follow: false },
};

/**
 * The graceful fallback the service worker (public/sw.js) shows when someone
 * navigates offline to a page their device hasn't saved yet. It's deliberately
 * static and reassuring: the point of an offline notice on a local-first site is
 * to make clear that nothing was lost — the work lives on the device, not on a
 * server that just became unreachable.
 */
export default function OfflinePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
          Offline
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          You&rsquo;re offline — but your work isn&rsquo;t going anywhere.
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          This toolkit runs on your device, not on a server you have to reach.
          Everything you&rsquo;ve entered is kept in this browser and is still
          exactly where you left it. The one thing a lost connection takes away is
          a page you haven&rsquo;t opened here before &mdash; it isn&rsquo;t saved
          on your device yet.
        </p>
      </header>

      <div className="border-t border-[var(--border)] pt-8">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-3">
          What you can still do
        </h2>
        <ul className="text-sm text-[var(--muted)] leading-relaxed space-y-2 list-disc pl-5">
          <li>
            Open any instrument or page you&rsquo;ve already visited &mdash;
            it&rsquo;s saved and works without a connection.
          </li>
          <li>
            Keep working the decision in front of you. Your answers are written to
            this device as you go, connection or none.
          </li>
          <li>
            When you&rsquo;re back online, everything picks up where it was &mdash;
            nothing needs to sync, because nothing ever left.
          </li>
        </ul>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/"
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Home
          </Link>
          <Link
            href="/tools"
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The toolkit
          </Link>
          <Link
            href="/decisions"
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Your decisions
          </Link>
        </div>
      </div>
    </div>
  );
}
