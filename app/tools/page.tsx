import type { Metadata } from "next";
import Link from "next/link";
import { resolveToolGroups, payoffLabel, type Payoff } from "../data/tools";

export const metadata: Metadata = {
  title: "The Toolkit — Better Every Day",
  description:
    "Which tool for the moment you're in? A front door to the working instruments — the flip point, the consequence trace, the cooling-off tool, the pre-mortem, the decision journal, the return desk, and the trainers — organized by what your decision feels like, not by what the tool is called.",
  openGraph: {
    title: "The Toolkit — Better Every Day",
    description:
      "Find the right instrument by the shape of the moment you're in — a decision to make now, a commitment to weigh, a past call to come back and grade.",
    type: "website",
  },
};

const groups = resolveToolGroups();

const payoffStyles: Record<Payoff, string> = {
  now: "text-[var(--accent)] border-[var(--accent)]",
  later: "text-[var(--muted)] border-[var(--muted)]",
  ongoing: "text-[var(--muted)] border-[var(--border)]",
};

export default function ToolsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-14">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          The Toolkit
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The site has a handful of working instruments, each built for a
          different kind of moment. But you don&rsquo;t arrive knowing which one
          you need — you arrive knowing what your decision <em>feels</em> like. So
          this page runs by the moment, not the tool: find the row that matches
          where you are, and it hands you the instrument and the one thing it does
          there. Everything you enter stays in your browser and is sent nowhere.
        </p>
      </header>

      <div className="space-y-16">
        {groups.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-24">
            <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] leading-snug mb-1">
              {group.title}
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-8">
              {group.blurb}
            </p>

            <div className="space-y-8">
              {group.tools.map((tool) => (
                <article key={tool.id}>
                  <p className="text-sm font-medium text-[var(--foreground)] leading-relaxed mb-3">
                    {tool.when}
                  </p>
                  <Link href={tool.href} className="group block">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-base font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                        {tool.name} &rarr;
                      </span>
                      <span
                        className={`shrink-0 text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border ${payoffStyles[tool.payoff]}`}
                      >
                        {payoffLabel[tool.payoff]}
                      </span>
                    </div>
                    <span className="block mt-2 text-sm text-[var(--muted)] leading-relaxed">
                      {tool.does}
                    </span>
                  </Link>
                  <p className="mt-2 text-sm font-medium text-[var(--foreground)] pl-4 border-l-2 border-[var(--accent)] leading-relaxed">
                    Ask: {tool.ask}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Not sure which idea a moment calls for? The{" "}
          <Link
            href="/playbook"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            playbook
          </Link>{" "}
          routes the same way but to the mental{" "}
          <Link
            href="/models"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            models
          </Link>{" "}
          — the ideas to think <em>with</em>, where these are the instruments to
          think <em>through</em>. New to the site? The{" "}
          <Link
            href="/start"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            reading paths
          </Link>{" "}
          build up the thinking one essay at a time. Everything these tools keep
          for you can be backed up and moved between devices from the{" "}
          <Link
            href="/data"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            your-data page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
