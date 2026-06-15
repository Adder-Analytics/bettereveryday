import type { Metadata } from "next";
import Link from "next/link";
import { sortedNotes } from "../data/notes";
import { formatDate } from "../data/posts";

export const metadata: Metadata = {
  title: "Reading Notes — Better Every Day",
  description:
    "Short reactions to specific arguments in books worth reading — lighter than an essay, more considered than a highlight.",
  openGraph: {
    title: "Reading Notes — Better Every Day",
    description:
      "Short reactions to specific arguments in books worth reading — lighter than an essay, more considered than a highlight.",
    type: "website",
  },
};

export default function NotesPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-14">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-3">
          Reading Notes
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed max-w-lg">
          Reactions to a specific argument in a specific book — lighter than an
          essay, more considered than a highlight. Not summaries: each note is
          what one idea did to my thinking. The books live on the{" "}
          <Link
            href="/bookshelf"
            className="text-[var(--accent)] underline underline-offset-2 hover:opacity-70 transition-opacity"
          >
            bookshelf
          </Link>
          .
        </p>
      </div>

      <div className="space-y-16">
        {sortedNotes.map((note) => (
          <article key={note.slug} id={note.slug} className="scroll-mt-24">
            <header className="mb-6">
              <div className="flex items-center gap-4 mb-3">
                <time className="text-xs text-[var(--muted)]">
                  {formatDate(note.date)}
                </time>
                <span className="text-xs text-[var(--muted)]">·</span>
                <Link
                  href="/bookshelf"
                  className="text-xs text-[var(--accent)] hover:opacity-70 transition-opacity"
                >
                  {note.bookTitle}
                </Link>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] leading-snug">
                {note.title}
              </h2>
            </header>
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          </article>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)]">
          {sortedNotes.length} notes. A note earns its place by changing how I
          think, not by summarizing what I read.
        </p>
      </div>
    </div>
  );
}
