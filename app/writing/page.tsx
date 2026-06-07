import Link from "next/link";
import { posts, formatDate } from "../data/posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing — Better Every Day",
  description: "Essays on improvement, focus, learning, and the long game.",
};

export default function Writing() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-2">
        Writing
      </h1>
      <p className="text-sm text-[var(--muted)] mb-14">
        Essays on improvement, focus, learning, and the long game.
      </p>

      <div className="space-y-10">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="pb-10 border-b border-[var(--border)] last:border-0"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <time className="text-xs text-[var(--muted)]">
                {formatDate(post.date)}
              </time>
              <span className="text-xs text-[var(--muted)]">
                {post.readTime} min read
              </span>
            </div>
            <Link href={`/writing/${post.slug}`} className="group">
              <h2 className="text-lg font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug mb-3">
                {post.title}
              </h2>
            </Link>
            <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
              {post.excerpt}
            </p>
            <div className="flex gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
