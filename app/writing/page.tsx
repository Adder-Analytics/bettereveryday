import Link from "next/link";
import type { Metadata } from "next";
import { posts, formatDate } from "../data/posts";
import { getGroupedPosts } from "../data/writingGroups";

export const metadata: Metadata = {
  title: "Writing — Better Every Day",
  description:
    "Essays on deciding well, sorted by what's making the decision hard — the options, the stakes, your own read, going in circles, other people, a number, or a call already made.",
};

const grouped = getGroupedPosts();

export default function Writing() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-2">
        Writing
      </h1>
      <p className="text-sm text-[var(--muted)] leading-relaxed mb-10">
        {posts.length} essays on deciding well, each the long form of an idea a{" "}
        <Link
          href="/tools"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          tool
        </Link>{" "}
        or the{" "}
        <Link
          href="/playbook"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          playbook
        </Link>{" "}
        puts to work. They&rsquo;re sorted by what&rsquo;s making the decision
        hard &mdash; the same kinds the playbook uses &mdash; so you can start
        from where you&rsquo;re stuck.
      </p>

      {/* Group labels only, not every title: the titles are sentences, and 43
          of them stacked would run to three phone screens before the first
          essay. Each group is short, so its titles are one jump away. */}
      <nav id="index" aria-label="Topics" className="mb-16 scroll-mt-24">
        <ul className="space-y-1.5">
          {grouped.map((g) => (
            <li key={g.id}>
              <a
                href={`#${g.id}`}
                className="flex items-baseline justify-between gap-4 py-0.5 text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
              >
                <span>{g.label}</span>
                <span className="shrink-0 text-xs tabular-nums text-[var(--muted)]">
                  {g.posts.length}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-20">
        {grouped.map((g) => (
          <section key={g.id} id={g.id} aria-labelledby={`h-${g.id}`} className="scroll-mt-24">
            <h2
              id={`h-${g.id}`}
              className="mb-8 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]"
            >
              {g.label}
            </h2>
            <div className="space-y-10">
              {g.posts.map((post) => (
                <article
                  key={post.slug}
                  className="pb-10 border-b border-[var(--border)] last:border-0 last:pb-0"
                >
                  <Link href={`/writing/${post.slug}`} className="group">
                    <h3 className="text-lg font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug mb-2">
                      {post.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-[var(--muted)] leading-relaxed mb-3">
                    {post.excerpt}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {post.readTime} min read &middot;{" "}
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                  </p>
                </article>
              ))}
            </div>
            <a
              href="#index"
              className="mt-8 inline-block text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
            >
              &uarr; All topics
            </a>
          </section>
        ))}
      </div>
    </div>
  );
}
