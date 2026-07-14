import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-24">
      <div className="max-w-2xl mx-auto px-6 py-10 flex items-center justify-between text-sm text-[var(--muted)]">
        <span>Better Every Day</span>
        <div className="flex items-center gap-5">
          <Link
            href="/data"
            className="hover:text-[var(--foreground)] transition-colors"
            title="Back up or restore your data"
          >
            Your data
          </Link>
          <Link
            href="/feed.xml"
            className="hover:text-[var(--foreground)] transition-colors"
            title="RSS Feed"
          >
            RSS
          </Link>
        </div>
      </div>
    </footer>
  );
}
