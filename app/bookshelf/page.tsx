import type { Metadata } from "next";
import { books, categories } from "../data/books";

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

function Stars({ rating }: { rating: 1 | 2 | 3 }) {
  return (
    <span className="flex gap-0.5" aria-label={`${rating} out of 3`}>
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`text-xs ${n <= rating ? "text-[var(--accent)]" : "text-[var(--border)]"}`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

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

      <div className="space-y-16">
        {categories.map((category) => {
          const categoryBooks = books.filter((b) => b.category === category);
          return (
            <section key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-8">
                {category}
              </h2>
              <div className="space-y-10">
                {categoryBooks.map((book) => (
                  <div key={book.title} className="group">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div>
                        <h3 className="text-base font-medium text-[var(--foreground)] leading-snug">
                          {book.title}
                        </h3>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          {book.author}
                          {book.year < 2000 ? null : (
                            <span className="ml-2 opacity-60">{book.year}</span>
                          )}
                        </p>
                      </div>
                      <Stars rating={book.rating} />
                    </div>
                    <p className="text-sm text-[var(--muted)] leading-relaxed mt-3">
                      {book.annotation}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)]">
          16 books. Updated as I read. Ratings reflect usefulness, not literary
          merit.
        </p>
      </div>
    </div>
  );
}
