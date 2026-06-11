import type { Metadata } from "next";
import { books, categories } from "../data/books";
import BookshelfList from "./BookshelfList";

export const metadata: Metadata = {
  title: "Bookshelf — Better Every Day",
  description:
    "Books I've read and found genuinely useful, with honest annotations. Organized by category.",
  openGraph: {
    title: "Bookshelf — Better Every Day",
    description:
      "Books I've read and found genuinely useful, with honest annotations. Organized by category.",
    type: "website",
  },
};

export default function BookshelfPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-3">
          Bookshelf
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed max-w-lg">
          Books I&apos;ve read and found genuinely useful, with honest annotations.
          Three stars means I recommend it to almost everyone. Two stars means
          it&apos;s valuable if the topic interests you. One star means it made me
          think, but with caveats.
        </p>
      </div>

      <BookshelfList books={books} categories={categories} />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)]">
          {books.length} books. Updated as I read. Ratings reflect usefulness,
          not literary merit.
        </p>
      </div>
    </div>
  );
}
