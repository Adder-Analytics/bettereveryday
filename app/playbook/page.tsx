import type { Metadata } from "next";
import Link from "next/link";
import { situations, resolveSituation } from "../data/situations";

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

const resolved = situations.map(resolveSituation);

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
          moment you&rsquo;re in and see which few tools it calls for — and the one
          concrete move each one prompts right here.
        </p>
      </header>

      <nav aria-label="Situations" className="mb-16 space-y-2">
        {resolved.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className="space-y-16">
        {resolved.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] leading-snug mb-2">
              {s.title}
            </h2>
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
          </section>
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
