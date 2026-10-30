import type { Metadata } from "next";
import Link from "next/link";
import { resolveToolGroups, payoffLabel, toolCount, type Payoff } from "../data/tools";
import { getSituationsForTool } from "../data/situations";

export const metadata: Metadata = {
  title: "The Toolkit — Better Every Day",
  description:
    "Which tool for the moment you're in? A front door to the working instruments, grouped by what's in front of you: a letter or bill that wants money, a money call, a decision shared with other people, a decision of your own, and the record you come back to.",
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
          {toolCount}{" "}working instruments, each built for a different kind
          of moment. You don&rsquo;t arrive knowing which one you need; you
          arrive knowing what&rsquo;s in front of you. So this page runs by the
          moment, not the tool: find the group that matches where you are, and it
          hands you the instrument and the one thing it does there. Everything
          you enter stays in your browser and is sent nowhere.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          Don&rsquo;t want to read all of them? Answer{" "}
          <Link
            href="/find"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            a question or two
          </Link>{" "}
          about the shape of your decision and be handed just the one, with your
          decision carried into it.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          New here, or want to see how these fit together first? Watch one real
          decision go through the whole kit — a{" "}
          <Link
            href="/example"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            cold, deliberate one →
          </Link>{" "}
          or a{" "}
          <Link
            href="/example/hot"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            hot one, cooled before it&rsquo;s decided →
          </Link>
        </p>
        <nav aria-label="Groups on this page" className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">
            Jump to
          </h2>
          <ul className="space-y-1.5">
            {groups.map((group) => (
              <li key={group.id}>
                <a
                  href={`#${group.id}`}
                  className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity leading-snug"
                >
                  {group.title}
                </a>{" "}
                <span className="text-xs text-[var(--muted)]">
                  ({group.tools.length})
                </span>
              </li>
            ))}
          </ul>
        </nav>
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
                        {tool.name}{" "}&rarr;
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
                  {(() => {
                    const sits = getSituationsForTool(tool.id);
                    if (sits.length === 0) return null;
                    return (
                      <div className="mt-3">
                        <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                          The moment it&rsquo;s built for
                        </span>
                        <ul className="mt-1.5 space-y-1">
                          {sits.map((s) => (
                            <li key={s.id}>
                              <Link
                                href={`/playbook#${s.id}`}
                                className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity leading-snug"
                              >
                                {s.title}{" "}&rarr;
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
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
