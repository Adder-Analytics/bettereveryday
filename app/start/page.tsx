import type { Metadata } from "next";
import Link from "next/link";
import { threads, resolveThread } from "../data/threads";

export const metadata: Metadata = {
  title: "Start Here — Better Every Day",
  description:
    "New here? Four short reading paths through the site — pick the one that matches what you care about, and follow it in order.",
};

const resolved = threads.map(resolveThread);

const kindStyles: Record<string, string> = {
  Essay: "text-[var(--accent)] border-[var(--accent)]",
  Model: "text-[var(--muted)] border-[var(--muted)]",
  "Reading note": "text-[var(--muted)] border-[var(--border)]",
};

export default function StartPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-14">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Start Here
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The site is a small, densely linked reference rather than a feed —
          which is great once you know your way around and disorienting on the
          first visit. So here are four reading paths. Each one threads a handful
          of essays, models, and notes into an order that builds. Pick the one
          that matches what you came for; you don&rsquo;t have to read them all,
          and you can wander off the path at any link.
        </p>
      </header>

      <nav aria-label="Reading paths" className="mb-16 flex flex-wrap gap-x-6 gap-y-2">
        {resolved.map((thread) => (
          <a
            key={thread.id}
            href={`#${thread.id}`}
            className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {thread.title}
          </a>
        ))}
      </nav>

      <div className="space-y-16">
        {resolved.map((thread) => (
          <section key={thread.id} id={thread.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] mb-1">
              {thread.title}
            </h2>
            <p className="text-sm font-medium text-[var(--accent)] mb-4">
              {thread.tagline}
            </p>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-8">
              {thread.intro}
            </p>

            <ol className="space-y-6">
              {thread.steps.map((step, i) => (
                <li key={step.href} className="flex gap-4">
                  <span className="shrink-0 w-6 text-sm font-mono text-[var(--muted)] pt-0.5 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border ${kindStyles[step.label]}`}
                      >
                        {step.label}
                      </span>
                    </div>
                    <Link href={step.href} className="group block">
                      <span className="text-base font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                        {step.title}
                      </span>
                      <span className="block mt-1 text-sm text-[var(--muted)] leading-relaxed">
                        {step.why}
                      </span>
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Prefer to wander? Browse{" "}
          <Link href="/writing" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            all writing
          </Link>
          , the{" "}
          <Link href="/models" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            mental models
          </Link>
          . Already facing a specific decision? The{" "}
          <Link href="/playbook" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            playbook
          </Link>{" "}
          finds the right models by the moment you&rsquo;re in, the{" "}
          <Link href="/calibrate" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            calibration trainer
          </Link>{" "}
          tests whether your &ldquo;90% sure&rdquo; is worth anything, and the{" "}
          <Link href="/estimate" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            estimation trainer
          </Link>{" "}
          builds the knack of getting to a number when you don&rsquo;t have one, and the{" "}
          <Link href="/update" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            base-rate trainer
          </Link>{" "}
          drills how much a new result should actually change your mind. Or press{" "}
          <kbd className="px-1.5 py-0.5 text-xs rounded border border-[var(--border)] bg-[var(--card)]">
            /
          </kbd>{" "}
          anywhere to search.
        </p>
      </div>
    </div>
  );
}
