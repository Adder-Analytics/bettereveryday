"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { countDueReviews } from "../data/journal";
import { countDueTripwireChecks } from "../data/premortem";
import { countDueTripwires } from "../data/tripwires";
import { countDueParked } from "../data/parked";

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
 *
 * The "Decide" slot is the guided front door (`/find`), not one specific tool.
 * For many sessions the nav omitted the single destination most useful to a
 * person actually facing a decision — the guided door that asks a question or
 * two and hands you the one instrument for your moment — while spending a slot on
 * `/decide`, which is just one of the toolkit's instruments (the journal). The
 * fix isn't a fourteenth flat link: a lone tool doesn't belong at nav level, but
 * the toolkit's *entry* does. So the nav now carries both of the kit's doors —
 * "Tools" (browse every instrument by moment) and "Decide" (the guided door that
 * routes you straight to one) — and the journal stays one click away from each of
 * them, from `/decisions`, and from the homepage, exactly as every other
 * instrument is. As a bonus it unpicks a real snag: "Decide" and "Decisions" sat
 * adjacent pointing at unrelated things; now they read cleanly as the action
 * (start deciding) beside the archive (the calls you've saved).
 *
 * The "Review" item carries a live due count. The whole site runs on one loop —
 * decide now, come back on the day to grade it — but the "something's waiting for
 * an answer" signal lived only on the homepage, so a person reading an essay or
 * working a tool got no nudge that a review or a tripwire check had come due. The
 * nav is on every page, so it's the honest home for that ambient signal: the
 * count folds in the same four debts the return desk and the homepage badge
 * count (journal reviews, pre-mortem checks, standalone tripwires, cooled-off
 * decisions), read from the exact shared `countDue*` helpers so the three
 * surfaces can never disagree. It's read after mount and re-read on every
 * navigation (so answering something and moving on updates it), renders nothing
 * on the server or first client paint (no hydration mismatch, no placeholder for
 * the common case of nothing due), and appears only when the count is real — the
 * same restraint the homepage badge shows.
 */

const LINKS: { href: string; label: string; title?: string }[] = [
  { href: "/start", label: "Start" },
  { href: "/writing", label: "Writing" },
  { href: "/notes", label: "Notes" },
  { href: "/bookshelf", label: "Bookshelf" },
  { href: "/models", label: "Models" },
  { href: "/playbook", label: "Playbook" },
  { href: "/tools", label: "Tools" },
  { href: "/find", label: "Decide", title: "Answer a question or two, get the one tool for your decision" },
  { href: "/decisions", label: "Decisions" },
  { href: "/review", label: "Review" },
  { href: "/practice", label: "Practice" },
  { href: "/now", label: "Now" },
  { href: "/search", label: "Search", title: "Press / anywhere to search" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [due, setDue] = useState(0);
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

  // The live "something's due" count on the Review item. Read after mount (so the
  // server and first paint render no badge — no hydration mismatch) and re-read
  // on every navigation, so answering a review and moving on updates the signal.
  // Reuses the exact shared debt counters the return desk and the homepage badge
  // use, so the three surfaces can't disagree.
  useEffect(() => {
    const total =
      countDueReviews() +
      countDueTripwireChecks() +
      countDueTripwires() +
      countDueParked();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time read from
       browser storage after mount/navigation; intentional, can't run in render. */
    setDue(total);
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
          {LINKS.map((link) => {
            const showDue = link.href === "/review" && due > 0;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.title}
                aria-label={showDue ? `Review — ${due} due for review` : undefined}
                className="inline-flex items-center hover:text-[var(--foreground)] transition-colors"
              >
                {link.label}
                {showDue && <DueCount due={due} />}
              </Link>
            );
          })}
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
              const showDue = link.href === "/review" && due > 0;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    title={link.title}
                    aria-current={active ? "page" : undefined}
                    aria-label={showDue ? `Review — ${due} due for review` : undefined}
                    className={`flex items-center rounded-md px-2 py-2.5 text-[15px] active:scale-[0.99] transition-[color,background-color,transform] duration-150 ${
                      active
                        ? "text-[var(--foreground)] font-medium bg-[var(--card)]"
                        : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card)]"
                    }`}
                  >
                    {link.label}
                    {showDue && <DueCount due={due} />}
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

/**
 * The compact due count that rides the "Review" item when something's waiting.
 * Purely decorative to assistive tech (the count is spoken through the link's
 * `aria-label`), so it's `aria-hidden`; the accent fill reads as "attention"
 * without a full pill of chrome. Only ever rendered when `due > 0`.
 */
function DueCount({ due }: { due: number }) {
  return (
    <span
      aria-hidden
      className="ml-1.5 inline-flex min-w-[1.05rem] items-center justify-center rounded-full bg-[var(--accent)] px-1 py-px text-[10px] font-semibold leading-none text-[var(--background)]"
    >
      {due}
    </span>
  );
}
