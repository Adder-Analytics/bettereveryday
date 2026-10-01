import type { Metadata } from "next";
import Link from "next/link";
import { situations, getGroupedSituations } from "../data/situations";

export const metadata: Metadata = {
  title: "The Playbook — Better Every Day",
  description:
    "Browse the mental models by the moment you need them. For each real situation — a one-way decision, a number someone put in front of you, a vivid story — the handful of models worth reaching for, and the specific move each one prompts.",
  openGraph: {
    title: "The Playbook — Better Every Day",
    description:
      "A field guide to applying the mental models at the moment you actually need one — organized by situation, not by concept.",
    type: "website",
  },
};

const grouped = getGroupedSituations();

const refStyles: Record<string, string> = {
  Essay: "text-[var(--accent)] border-[var(--accent)]",
  "Reading note": "text-[var(--muted)] border-[var(--border)]",
};

export default function PlaybookPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-14">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          The Playbook
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A collection of mental models is only useful if the right one shows up
          at the right moment — and the hard part was never learning them, it&rsquo;s
          retrieving them when you&rsquo;re actually in the situation. So this page
          runs the other way from the{" "}
          <Link
            href="/models"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            reference
          </Link>
          : instead of browsing ideas and hoping to remember them later, find the
          moment you&rsquo;re in and see which few models it calls for — and the one
          concrete move each one prompts right here. Where the site has built a{" "}
          <Link
            href="/tools"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            purpose-built instrument
          </Link>{" "}
          for the moment, it&rsquo;s handed to you right there — the idea and the
          tool that does it, one click apart. And any situation below opens as a
          fill-in{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            worksheet
          </Link>{" "}
          you can think through and keep.
        </p>
      </header>

      {/* The contents, sorted by kind of hard — the same kinds the guided
          router asks about, so the two front doors read alike. Twenty-five
          moments in one list is a wall; under seven headings the eye skips whole
          clusters and reads only the few lines that could be you. */}
      <nav
        id="situations"
        aria-label="Situations"
        className="mb-16 scroll-mt-24 space-y-6"
      >
        {grouped.map(({ group, situations: items }) => (
          <div key={group.id}>
            <p
              id={`toc-${group.id}`}
              className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]"
            >
              {group.label}
            </p>
            <ul aria-labelledby={`toc-${group.id}`} className="space-y-1.5">
              {items.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="block py-0.5 text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-20">
        {grouped.map(({ group, situations: items }) => (
          <div key={group.id}>
            <h2 className="mb-8 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              {group.label}
            </h2>
            <div className="space-y-16">
              {items.map((s) => (
                <section key={s.id} id={s.id} className="scroll-mt-24">
                  <h3 className="text-xl font-semibold tracking-tight text-[var(--foreground)] leading-snug mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
                    {s.scene}
                  </p>
                  <p className="text-sm font-medium text-[var(--foreground)] mb-8 pl-4 border-l-2 border-[var(--accent)] leading-relaxed">
                    Ask: {s.question}
                  </p>

                  <ul className="space-y-6">
                    {s.models.map((m) => (
                      <li key={m.id}>
                        <Link
                          href={m.href}
                          className="text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                        >
                          {m.name} →
                        </Link>
                        <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
                          {m.move}
                        </p>
                      </li>
                    ))}
                  </ul>

                  {s.tool && (
                    <div className="mt-8 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)] mb-2">
                        The instrument for this moment
                      </p>
                      <Link href={s.tool.href} className="group inline-block">
                        <span className="text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                          {s.tool.name} &rarr;
                        </span>
                      </Link>
                      <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
                        {s.tool.move}
                      </p>
                    </div>
                  )}

                  <Link
                    href={`/decide?s=${s.id}`}
                    className="mt-6 inline-block text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
                  >
                    {s.tool
                      ? "Or work the whole call through in the journal →"
                      : "Work this through in the worksheet →"}
                  </Link>

                  {s.references.length > 0 && (
                    <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                        Go deeper
                      </span>
                      {s.references.map((ref) => (
                        <Link key={ref.href} href={ref.href} className="group inline-flex items-center gap-2">
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border ${refStyles[ref.label]}`}
                          >
                            {ref.label}
                          </span>
                          <span className="text-sm text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                            {ref.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* On a phone this page runs to dozens of screens; without a way
                      back, the only route to a second situation is a long scroll. */}
                  <a
                    href="#situations"
                    className="mt-8 inline-block text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    &uarr; All situations
                  </a>
                </section>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          {situations.length} situations, drawing on the full set of{" "}
          <Link
            href="/models"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            mental models
          </Link>
          . Want the ideas in order instead of by moment? The{" "}
          <Link
            href="/start"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            reading paths
          </Link>{" "}
          build them up one at a time.
        </p>
      </div>
    </div>
  );
}
