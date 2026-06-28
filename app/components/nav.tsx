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
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-sm text-[var(--muted)]">
          <Link href="/start" className="hover:text-[var(--foreground)] transition-colors">
            Start
          </Link>
          <Link href="/writing" className="hover:text-[var(--foreground)] transition-colors">
            Writing
          </Link>
          <Link href="/notes" className="hover:text-[var(--foreground)] transition-colors">
            Notes
          </Link>
          <Link href="/bookshelf" className="hover:text-[var(--foreground)] transition-colors">
            Bookshelf
          </Link>
          <Link href="/models" className="hover:text-[var(--foreground)] transition-colors">
            Models
          </Link>
          <Link href="/playbook" className="hover:text-[var(--foreground)] transition-colors">
            Playbook
          </Link>
          <Link href="/decide" className="hover:text-[var(--foreground)] transition-colors">
            Decide
          </Link>
          <Link href="/calibrate" className="hover:text-[var(--foreground)] transition-colors">
            Calibrate
          </Link>
          <Link href="/estimate" className="hover:text-[var(--foreground)] transition-colors">
            Estimate
          </Link>
          <Link href="/now" className="hover:text-[var(--foreground)] transition-colors">
            Now
          </Link>
          <Link
            href="/search"
            title="Press / anywhere to search"
            className="hover:text-[var(--foreground)] transition-colors"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
