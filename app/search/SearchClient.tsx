"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { posts, formatDate } from "../data/posts";
import { models } from "../data/models";
import { books } from "../data/books";
import { notes } from "../data/notes";
import { situations } from "../data/situations";

type SearchDoc = {
  type: "Essay" | "Note" | "Model" | "Book" | "Playbook" | "Tool";
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
  {
    type: "Tool",
    title: "Calibration trainer",
    href: "/calibrate",
    snippet:
      "Does your 90% actually mean 90%? Put confidence intervals on facts with knowable answers and find out, immediately, how overconfident you are — then recalibrate the feeling of being sure. One of the few thinking skills that's quickly, measurably trainable.",
    meta: "Calibration trainer",
    titleText:
      "calibration trainer calibrate confidence overconfidence forecasting probability 90 percent interval equivalent bet hubbard tetlock superforecaster uncertainty estimate odds".toLowerCase(),
    bodyText:
      "a calibration trainer. the decision journal asks how sure you are; this is where you find out whether your sure is worth anything. two modes: give ninety percent confidence intervals on numeric trivia with knowable answers — calibrated people's ranges contain the truth about nine times in ten, most people get half that — or say whether a statement is true and how confident, then see your calibration curve, of the times you said seventy percent how often were you right. uses douglas hubbard's equivalent bet to catch overconfidence: would you rather win on your range or on a nine-in-ten wheel. calibration is one of the few biases that's trainable in an afternoon with feedback, and being well-calibrated is what most distinguishes philip tetlock's superforecasters. your record accumulates across rounds in your browser. the skill underneath every forecast in the decision journal.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Estimation trainer",
    href: "/estimate",
    snippet:
      "How many piano tuners work in Chicago? You can get within a factor of two without looking it up — by breaking the question into pieces you can estimate and multiplying. Practise Fermi estimation: decompose a hard quantity, or take one-shot order-of-magnitude guesses and see how far off you were.",
    meta: "Estimation trainer",
    titleText:
      "estimation trainer estimate fermi decomposition order of magnitude back of the envelope guess number sense market sizing approximation napkin math piano tuners chicago".toLowerCase(),
    bodyText:
      "an estimation trainer for fermi estimation. most useful questions don't come with the number attached: how big is this market, how long will this take, how many people would use this. the skill is to break the question into smaller pieces you can guess and multiply them — the rough parts beat the confident whole because independent errors tend to cancel. two modes: decompose, which walks one hard problem (how many piano tuners in chicago, how many golf balls fit in a school bus) by asking for a gut guess first and then building the answer from its factors so you watch the decomposition beat the gut; and one-shot, eight quantities that span orders of magnitude — trees on earth, neurons in a brain, people who have ever lived — scored by how many factors of ten you were off, aiming to land within an order of magnitude. named for enrico fermi. your record accumulates across rounds in your browser, tracking your typical miss and how often decomposition beats your gut. the companion skill is calibration: a number is only worth as much as the honest error bars around it.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Decision journal",
    href: "/decide",
    snippet:
      "Work a real decision through the models that apply, log what you expect to happen, then come back when the outcome is in and compare. A decision log you can actually learn from.",
    meta: "Decision journal & worksheet",
    titleText:
      "decision journal worksheet decide tool log review outcome calibration confidence hindsight resulting decision quality luck memo export import backup example calendar reminder ics google apple outlook".toLowerCase(),
    bodyText:
      `an interactive decision journal. pick the situation you're in, reason through the models that apply, write the call, record what you expect to happen and how confident you are, and set a review date. add that review to your calendar as a reminder (an ics file for google, apple, or outlook) so it comes back to you on the day — or add every pending review at once. come back later to log what actually happened and compare it against what you predicted — defeating hindsight bias and outcome bias. keeps a decision log in your browser that you can export as a file to back up or move between devices, and import again. shows your calibration once you've reviewed a few decisions — of the calls you were seventy percent sure of, how many actually went your way — and separates decision quality from outcome quality (annie duke's resulting) so a good call that got unlucky doesn't get filed as a mistake. includes a worked example. ${situations
        .map((s) => s.title)
        .join(" ")}`.toLowerCase(),
  },
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
  Tool: "text-[var(--accent)] border-[var(--accent)]",
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
          the decision journal, the calibration trainer, the estimation trainer,
          and {books.length} books.
          Results link straight to the essay, the note, the model&rsquo;s entry on
          the reference page, the playbook, the journal, a trainer, or the
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
