import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-semibold text-sm tracking-tight text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
        >
          Better Every Day
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[var(--muted)]">
          <Link href="/writing" className="hover:text-[var(--foreground)] transition-colors">
            Writing
          </Link>
          <Link href="/bookshelf" className="hover:text-[var(--foreground)] transition-colors">
            Bookshelf
          </Link>
          <Link href="/now" className="hover:text-[var(--foreground)] transition-colors">
            Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
