import type { Metadata } from "next";
import Link from "next/link";
import { models, domains } from "../data/models";
import { getPostBySlug } from "../data/posts";
import { getBooksForModel, bookAnchor } from "../data/books";
import { getSituationsForModel } from "../data/situations";
import { getNotesForModel } from "../data/notes";
import { getToolsForModel } from "../data/tools";

export const metadata: Metadata = {
  title: "Mental Models — Better Every Day",
  description:
    "A reference collection of ideas from finance, decision-making, systems thinking, psychology, and epistemology — the ones that actually change how you reason.",
  openGraph: {
    title: "Mental Models — Better Every Day",
    description:
      "A reference collection of ideas from finance, decision-making, systems thinking, psychology, and epistemology — the ones that actually change how you reason.",
    type: "website",
  },
};

export default function ModelsPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-14">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-3">
          Mental Models
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed max-w-lg">
          Ideas from multiple domains that change how you reason. Not a
          comprehensive list — a curated one. These are the models I find myself
          reaching for most often when thinking through a hard problem.
        </p>
      </div>

      {/* The contents. Thirty-five models run to some forty phone screens, and
          a reader arriving for one idea had only the scroll bar to find it.
          Names are short, so each domain's list wraps inline instead of
          stacking one per line: the whole index fits in about a screen. */}
      <nav
        id="index"
        aria-label="Models"
        className="mb-16 scroll-mt-24 space-y-5"
      >
        {domains.map((domain) => (
          <div key={domain}>
            <p
              id={`toc-${domain.toLowerCase()}`}
              className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]"
            >
              {domain}
            </p>
            <ul
              aria-labelledby={`toc-${domain.toLowerCase()}`}
              className="flex flex-wrap gap-x-3 gap-y-1"
            >
              {models
                .filter((m) => m.domain === domain)
                .map((m) => (
                  <li key={m.id}>
                    <a
                      href={`#${m.id}`}
                      className="inline-block py-0.5 text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
                    >
                      {m.name}
                    </a>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-16">
        {domains.map((domain) => {
          const domainModels = models.filter((m) => m.domain === domain);
          return (
            <section key={domain}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-8">
                {domain}
              </h2>
              <div className="space-y-10">
                {domainModels.map((model) => {
                  const modelTools = getToolsForModel(model.id);
                  const shelfBooks = getBooksForModel(model.id);
                  const modelSituations = getSituationsForModel(model.id);
                  const modelNotes = getNotesForModel(model.id);
                  return (
                  <div key={model.id} id={model.id} className="scroll-mt-24">
                    <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">
                      {model.name}
                    </h3>
                    <p className="text-sm font-medium text-[var(--foreground)] mb-2 leading-relaxed">
                      {model.tagline}
                    </p>
                    <p className="text-sm text-[var(--muted)] leading-relaxed">
                      {model.explanation}
                    </p>
                    {modelTools.length > 0 && (
                      <p className="mt-3 text-xs text-[var(--muted)]">
                        Put it to work:{" "}
                        {modelTools.map((tool, i) => (
                          <span key={tool.id}>
                            {i > 0 ? " · " : ""}
                            <Link
                              href={tool.href}
                              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                            >
                              {tool.name}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                    {model.essays && model.essays.length > 0 && (
                      <div className={`${modelTools.length > 0 ? "mt-2" : "mt-3"} space-y-1`}>
                        {model.essays.map((slug) => {
                          const post = getPostBySlug(slug);
                          if (!post) return null;
                          return (
                            <p key={slug} className="text-xs text-[var(--muted)]">
                              Essay:{" "}
                              <Link
                                href={`/writing/${slug}`}
                                className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                              >
                                {post.title} →
                              </Link>
                            </p>
                          );
                        })}
                      </div>
                    )}
                    {shelfBooks.length > 0 && (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        On the shelf:{" "}
                        {shelfBooks.map((book, i) => (
                          <span key={book.title}>
                            {i > 0 ? " · " : ""}
                            <Link
                              href={`/bookshelf#${bookAnchor(book.title)}`}
                              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                            >
                              {book.title}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                    {modelSituations.length > 0 && (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        Reach for this when:{" "}
                        {modelSituations.map((s, i) => (
                          <span key={s.id}>
                            {i > 0 ? " · " : ""}
                            <Link
                              href={`/playbook#${s.id}`}
                              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                            >
                              {s.title}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                    {modelNotes.length > 0 && (
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        In the reading notes:{" "}
                        {modelNotes.map((n, i) => (
                          <span key={n.slug}>
                            {i > 0 ? " · " : ""}
                            <Link
                              href={`/notes#${n.slug}`}
                              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                            >
                              {n.title}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                    <a
                      href="#index"
                      className="mt-4 inline-block text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                    >
                      &uarr; All models
                    </a>
                  </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)]">
          {models.length} models across {domains.length} domains. These are
          starting points, not conclusions — every model breaks down somewhere.
        </p>
      </div>
    </div>
  );
}
