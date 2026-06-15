import Link from "next/link";
import { notFound } from "next/navigation";
import { posts, getPostBySlug, formatDate } from "../../data/posts";
import { models } from "../../data/models";
import { getThreadsForEssay } from "../../data/threads";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

const SITE_URL = "https://bettereveryday.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Better Every Day`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      url: `${SITE_URL}/writing/${post.slug}`,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const index = posts.findIndex((p) => p.slug === slug);
  const prev = index > 0 ? posts[index - 1] : null;
  const next = index < posts.length - 1 ? posts[index + 1] : null;
  const relatedModels = models.filter((m) => m.essays?.includes(slug));
  const relatedThreads = getThreadsForEssay(slug);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link
        href="/writing"
        className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-12 inline-block"
      >
        ← Writing
      </Link>

      <article>
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <time className="text-xs text-[var(--muted)]">
              {formatDate(post.date)}
            </time>
            <span className="text-xs text-[var(--muted)]">·</span>
            <span className="text-xs text-[var(--muted)]">
              {post.readTime} min read
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] leading-snug mb-4">
            {post.title}
          </h1>
          <p className="text-base text-[var(--muted)] leading-relaxed">
            {post.excerpt}
          </p>
          <div className="flex gap-2 mt-5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--card)] text-[var(--muted)] border border-[var(--border)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      {relatedThreads.length > 0 && (
        <aside className="mt-16 pt-8 border-t border-[var(--border)]">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-5">
            Part of a Reading Path
          </h2>
          <div className="space-y-3">
            {relatedThreads.map((thread) => (
              <Link
                key={thread.id}
                href={`/start#${thread.id}`}
                className="group block"
              >
                <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {thread.title}
                </span>
                <span className="block mt-0.5 text-sm text-[var(--muted)] leading-relaxed">
                  Step {thread.step} of {thread.total} — see the whole path on Start Here.
                </span>
              </Link>
            ))}
          </div>
        </aside>
      )}

      {relatedModels.length > 0 && (
        <aside className="mt-16 pt-8 border-t border-[var(--border)]">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-5">
            Related Mental Models
          </h2>
          <div className="space-y-4">
            {relatedModels.map((model) => (
              <Link
                key={model.id}
                href={`/models#${model.id}`}
                className="group block"
              >
                <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {model.name}
                </span>
                <span className="block mt-0.5 text-sm text-[var(--muted)] leading-relaxed">
                  {model.tagline}
                </span>
              </Link>
            ))}
          </div>
        </aside>
      )}

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        {prev || next ? (
          <div className="flex justify-between gap-4">
            <div className="flex-1">
              {prev && (
                <Link
                  href={`/writing/${prev.slug}`}
                  className="group block text-left"
                >
                  <span className="text-xs text-[var(--muted)] mb-1 block">
                    ← Previous
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                    {prev.title}
                  </span>
                </Link>
              )}
            </div>
            <div className="flex-1">
              {next && (
                <Link
                  href={`/writing/${next.slug}`}
                  className="group block text-right"
                >
                  <span className="text-xs text-[var(--muted)] mb-1 block">
                    Next →
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                    {next.title}
                  </span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <Link
            href="/writing"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            ← Back to all writing
          </Link>
        )}
      </div>
    </div>
  );
}
