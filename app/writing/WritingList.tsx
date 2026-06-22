"use client";

import { useState } from "react";
import Link from "next/link";
import type { Post } from "../data/posts";
import { formatDate } from "../data/posts";

export default function WritingList({ posts }: { posts: Post[] }) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tags = Array.from(new Set(posts.flatMap((p) => p.tags))).sort();
  const filtered = selectedTag
    ? posts.filter((p) => p.tags.includes(selectedTag))
    : posts;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-12">
        <button
          onClick={() => setSelectedTag(null)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            selectedTag === null
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--card)]"
              : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]"
          }`}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              selectedTag === tag
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--card)]"
                : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="space-y-10">
        {filtered.map((post) => (
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
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTag(selectedTag === tag ? null : tag)
                  }
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    selectedTag === tag
                      ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--card)]"
                      : "border-[var(--border)] text-[var(--muted)] bg-[var(--card)] hover:border-[var(--muted)]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
