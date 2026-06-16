"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { posts, formatDate } from "../data/posts";
import { models } from "../data/models";
import { books } from "../data/books";
import { notes } from "../data/notes";
import { situations } from "../data/situations";

type SearchDoc = {
  type: "Essay" | "Note" | "Model" | "Book" | "Playbook";
  title: string;
  href: string;
  snippet: string;
  meta: string;
  /** Weighted fields, lowercased: [title-level text, body text] */
  titleText: string;
  bodyText: string;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

const docs: SearchDoc[] = [
  ...posts.map((p): SearchDoc => ({
    type: "Essay",
    title: p.title,
    href: `/writing/${p.slug}`,
    snippet: p.excerpt,
    meta: `${formatDate(p.date)} · ${p.readTime} min read`,
    titleText: `${p.title} ${p.tags.join(" ")}`.toLowerCase(),
    bodyText: `${p.excerpt} ${stripHtml(p.content)}`.toLowerCase(),
  })),
  ...notes.map((n): SearchDoc => ({
    type: "Note",
    title: n.title,
    href: `/notes#${n.slug}`,
    snippet: stripHtml(n.content).trim().slice(0, 200),
    meta: `${formatDate(n.date)} · ${n.bookTitle}`,
    titleText: `${n.title} ${n.bookTitle}`.toLowerCase(),
    bodyText: stripHtml(n.content).toLowerCase(),
  })),
  ...models.map((m): SearchDoc => ({
    type: "Model",
    title: m.name,
    href: `/models#${m.id}`,
    snippet: m.tagline,
    meta: m.domain,
    titleText: `${m.name} ${m.domain}`.toLowerCase(),
    bodyText: `${m.tagline} ${m.explanation}`.toLowerCase(),
  })),
  ...books.map((b): SearchDoc => ({
    type: "Book",
    title: `${b.title} — ${b.author}`,
    href: "/bookshelf",
    snippet: b.annotation,
    meta: `${b.category} · ${b.year}`,
    titleText: `${b.title} ${b.author} ${b.category}`.toLowerCase(),
    bodyText: b.annotation.toLowerCase(),
  })),
  ...situations.map((s): SearchDoc => ({
    type: "Playbook",
    title: s.title,
    href: `/playbook#${s.id}`,
    snippet: s.scene,
    meta: `${s.models.length} models for this situation`,
    titleText: `${s.title} ${s.question}`.toLowerCase(),
    bodyText: `${s.scene} ${s.question} ${s.models
      .map((m) => m.move)
      .join(" ")}`.toLowerCase(),
  })),
];

function search(query: string): SearchDoc[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return docs
    .map((doc) => {
      let score = 0;
      for (const term of terms) {
        if (doc.titleText.includes(term)) score += 3;
        else if (doc.bodyText.includes(term)) score += 1;
        else return null;
      }
      return { doc, score };
    })
    .filter((r): r is { doc: SearchDoc; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.doc);
}

const typeStyles: Record<SearchDoc["type"], string> = {
  Essay: "text-[var(--accent)] border-[var(--accent)]",
  Note: "text-[var(--accent)] border-[var(--border)]",
  Model: "text-[var(--muted)] border-[var(--muted)]",
  Book: "text-[var(--muted)] border-[var(--border)]",
  Playbook: "text-[var(--accent)] border-[var(--accent)]",
};

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => search(query), [query]);
  const showResults = query.trim().length > 0;

  return (
    <>
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try “compounding”, “feedback loops”, “Kahneman”…"
        aria-label="Search the site"
        className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
      />

      {showResults && (
        <p className="mt-6 text-xs text-[var(--muted)]">
          {results.length === 0
            ? "No results. Try a broader term."
            : `${results.length} result${results.length === 1 ? "" : "s"}`}
        </p>
      )}

      <div className="mt-6 space-y-8">
        {results.map((doc) => (
          <Link key={`${doc.type}-${doc.href}-${doc.title}`} href={doc.href} className="group block">
            <div className="flex items-center gap-3 mb-1.5">
              <span
                className={`text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border ${typeStyles[doc.type]}`}
              >
                {doc.type}
              </span>
              <span className="text-xs text-[var(--muted)]">{doc.meta}</span>
            </div>
            <h2 className="text-base font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug">
              {doc.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed line-clamp-2">
              {doc.snippet}
            </p>
          </Link>
        ))}
      </div>

      {!showResults && (
        <p className="mt-6 text-sm text-[var(--muted)] leading-relaxed">
          The index covers {posts.length} essays, {notes.length} reading notes,{" "}
          {models.length} mental models, {situations.length} playbook situations,
          and {books.length} books. Results link straight to the essay, the note,
          the model&rsquo;s entry on the reference page, the playbook, or the
          bookshelf. Tip: press{" "}
          <kbd className="px-1.5 py-0.5 text-xs rounded border border-[var(--border)] bg-[var(--card)]">
            /
          </kbd>{" "}
          anywhere on the site to jump here.
        </p>
      )}
    </>
  );
}
