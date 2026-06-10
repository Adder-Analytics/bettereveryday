"use client";

import { useState } from "react";
import type { Book } from "../data/books";

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

export default function BookshelfList({
  books,
  categories,
}: {
  books: Book[];
  categories: string[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const visibleCategories = selectedCategory ? [selectedCategory] : categories;

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-12">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            selectedCategory === null
              ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--card)]"
              : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setSelectedCategory(selectedCategory === cat ? null : cat)
            }
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              selectedCategory === cat
                ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--card)]"
                : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--muted)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-16">
        {visibleCategories.map((category) => {
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
    </>
  );
}
