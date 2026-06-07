import Link from "next/link";
import { notFound } from "next/navigation";
import { posts, getPostBySlug, formatDate } from "../../data/posts";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Better Every Day`,
    description: post.excerpt,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

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

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <Link
          href="/writing"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          ← Back to all writing
        </Link>
      </div>
    </div>
  );
}
