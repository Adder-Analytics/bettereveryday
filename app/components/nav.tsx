"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Site navigation.
 *
 * The link set is a lot — thirteen destinations — because the site is a lot: the
 * writing, the models, the whole toolkit. On a wide screen they lay out inline.
 * On a phone, that many links flex-wrapping under a sticky bar ate four rows of a
 * small screen and looked broken — a bad first impression for a tool someone
 * reached for in a hard moment, on the device most likely to be in their hand.
 *
 * So the small-screen version collapses to a single control that opens a panel.
 * One list of links feeds both layouts, so they can't drift apart. The panel
 * closes the moment the route changes, on Escape, and on a tap outside — the
 * three ways a person signals they're done with it — and the trigger reports its
 * state to assistive tech. Movement is a short ease-out; anyone who asked their
 * system for less motion gets none (handled globally).
 */

const LINKS: { href: string; label: string; title?: string }[] = [
  { href: "/start", label: "Start" },
  { href: "/writing", label: "Writing" },
  { href: "/notes", label: "Notes" },
  { href: "/bookshelf", label: "Bookshelf" },
  { href: "/models", label: "Models" },
  { href: "/playbook", label: "Playbook" },
  { href: "/tools", label: "Tools" },
  { href: "/decide", label: "Decide" },
  { href: "/decisions", label: "Decisions" },
  { href: "/review", label: "Review" },
  { href: "/practice", label: "Practice" },
  { href: "/now", label: "Now" },
  { href: "/search", label: "Search", title: "Press / anywhere to search" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = "mobile-nav-panel";
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on route change, whatever caused it — a panel link, the wordmark, the
  // back button. The panel is a transient overlay; once the page underneath it
  // changes, it has served its purpose and should get out of the way.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- syncing transient UI to
       the external navigation state; closing on route change is the whole point
       and can't be derived in render. Same intentional use as FindClient. */
    setOpen(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [pathname]);

  // While open, close on Escape or a tap outside the header. Listeners are only
  // attached while the panel is open, so the closed nav costs nothing.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-sm">
      <div
        ref={containerRef}
        className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between gap-4"
      >
        <Link
          href="/"
          className="font-semibold text-sm tracking-tight text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
        >
          Better Every Day
        </Link>

        {/* Wide screens: the full set, inline. Unchanged from before. */}
        <nav className="hidden md:flex flex-wrap items-center justify-end gap-x-5 gap-y-1 text-sm text-[var(--muted)]">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              title={link.title}
              className="hover:text-[var(--foreground)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Small screens: one control that opens the panel. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden -mr-1 inline-flex items-center justify-center rounded-md p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] active:scale-95 transition-[color,transform] duration-150"
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>

        {/* The panel. Kept in the DOM and toggled so the open/close can transition
            and interrupt itself cleanly; inert (no pointer events, hidden from
            AT) while closed. */}
        <nav
          id={panelId}
          aria-label="Site"
          data-open={open}
          className={`md:hidden absolute top-full left-0 right-0 origin-top border-b border-[var(--border)] bg-[var(--background)] shadow-[0_12px_28px_-18px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${
            open
              ? "visible opacity-100 translate-y-0"
              : "invisible pointer-events-none opacity-0 -translate-y-1"
          }`}
        >
          <ul className="max-w-2xl mx-auto px-4 py-2 flex flex-col">
            {LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    title={link.title}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-md px-2 py-2.5 text-[15px] active:scale-[0.99] transition-[color,background-color,transform] duration-150 ${
                      active
                        ? "text-[var(--foreground)] font-medium bg-[var(--card)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
