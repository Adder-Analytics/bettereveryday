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
    title: "Practice your judgement",
    href: "/practice",
    snippet:
      "Three short trainers for the three numbers under every decision — how sure you are, how to get to a number, and how much a new fact should move you — plus your real record from the decision journal beside them: the warm-up scores and the bets reality actually graded, on one page.",
    meta: "Practice hub — trainers + your real record",
    titleText:
      "practice hub trainers judgement judgment dashboard profile calibration estimation base rates forecasting uncertainty three numbers decisions what to practice next thinking gym real record scoreboard keeping score track record".toLowerCase(),
    bodyText:
      "the practice hub. calibration, estimation, and base-rate updating are three faces of one skill: putting honest numbers on an uncertain world. how wide should your uncertainty be, how do you get to a number at all, and how much should a new fact move the number you've got. this page reads all three trainer records from your browser and shows them together — your ninety-percent hit rate beside your typical estimation miss beside your base-rate lean — so you can see in one glance which of the three your judgement is weakest on, and it suggests where to spend the next ten minutes. below the trainers sits the real game: your record from the decision journal — your real-world overconfidence gap, whether things go the way you say they will, how many reviews are due — because the trainers are a kind learning environment on purpose and your actual decisions are the wicked one they warm you up for. when reviews are due, that outranks any practice suggestion. nothing leaves the browser. paired with the essays three numbers for an uncertain world and experience doesn't teach.".toLowerCase(),
  },
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
    title: "Base-rate trainer",
    href: "/update",
    snippet:
      "A 99%-accurate test for a 1-in-1,000 disease comes back positive — your chance of having it is about 9%, not 99%. Practise updating on evidence the way the numbers demand: weigh a result against how rare the thing was, and watch the base rate do the work. Catches the near-universal habit of trusting the test and forgetting the prior.",
    meta: "Base-rate trainer",
    titleText:
      "base rate trainer update bayes bayesian posterior prior probability conditional false positive base-rate neglect natural frequencies gigerenzer test screening prevalence sensitivity specificity evidence belief reference class outside view inside view planning fallacy pick the prior kahneman flyvbjerg".toLowerCase(),
    bodyText:
      "a base-rate trainer for bayesian updating. a test is 99 percent accurate and you test positive for a disease one person in a thousand has, so what's the chance you have it. almost everyone says ninety-nine percent; it's about nine percent, because the rare true cases are swamped by false positives from the huge healthy majority. that error — fixating on the test's accuracy and forgetting how rare the thing is — is base-rate neglect, and it's behind needless cancer scares, highly accurate screens that are wrong most of the time, fraud alerts you learn to ignore, and mass-surveillance false alarms. the cure is gerd gigerenzer's natural frequencies: stop thinking in percentages and count a concrete crowd, where the answer becomes something you can simply tally. three modes: walk through one scenario slowly (a positive mammogram, a rare-disease test) by guessing first and then watching the numbers redrawn as a crowd; a round of six quick ones (a fraud alert, a drug test, a flu test in season, an airport face-recognition match) scored on how many percentage points off you were and whether you keep landing high — the signature of neglecting the base rate; and pick the prior, which drills the harder upstream judgement of choosing the reference class itself — messy real questions with no answer key (a deadline you're about to promise, a friend's restaurant, a wedding, a startup) where you give a gut answer, then choose the class you'd start from, dodging the traps: classes of one and folklore rates with no study behind them. it tracks your inside-view premium — how far your gut runs above the outside view before any evidence arrives. it isn't always distrust the test: when the base rate is high a positive is strong evidence, and the same test means different things at different base rates. your record accumulates across rounds in your browser. the companions are calibration and estimation: how wide your uncertainty should be, how to get to a number, and how much a new fact should move it.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Pre-mortem",
    href: "/premortem",
    snippet:
      "Declare the plan dead before it starts and write the history of the failure — people are about 30% better at explaining an outcome than predicting one. Then turn every cause into a plan change, a tripwire with a date, or a risk you accept on purpose. Gary Klein's exercise, runnable solo in twenty minutes.",
    meta: "Pre-mortem & tripwires",
    titleText:
      "premortem pre-mortem tool plan failure tripwire tripwires kill criteria quit quitting stop reconsider klein prospective hindsight risk stress test funeral autopsy".toLowerCase(),
    bodyText:
      "a guided pre-mortem room. gary klein's technique: instead of asking what could go wrong, declare that the plan has already failed and write the history of that failure — prospective hindsight, imagining the event as already having happened, raises the ability to identify reasons for future outcomes by about thirty percent (mitchell, russo and pennington). kahneman calls it his favorite counter to overconfidence because it legitimizes doubt. three steps: name the plan and the day you'd know it failed; write the reasons it died, past tense, fast, with lenses for when you're stuck (people, money, time, the outside world, you); then triage every cause — change the plan now while it's cheap, set a tripwire, or accept the risk with open eyes. tripwires are annie duke's kill criteria: a state and a date — an observable signal ('below 100 paying users') and a real calendar day to check it, decided while you're calm, like van halen's brown m&ms clause or the everest turnaround time. each tripwire check can be added to your calendar as an ics reminder for google, apple, or outlook, carrying the signal and the failure it guards. saved pre-mortems stay in your browser; nothing is sent anywhere. pairs with the decision journal for logging the decision itself, and the essay hold the funeral first.".toLowerCase(),
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
      `an interactive decision journal. pick the situation you're in, reason through the models that apply, write the call, record what you expect to happen and how confident you are, and set a review date. add that review to your calendar as a reminder (an ics file for google, apple, or outlook) so it comes back to you on the day — or add every pending review at once. come back later to log what actually happened and compare it against what you predicted — defeating hindsight bias and outcome bias. keeps a decision log in your browser that you can export as a file to back up or move between devices, and import again. shows your calibration once you've reviewed a few decisions — of the calls you were seventy percent sure of, how many actually went your way — and separates decision quality from outcome quality (annie duke's resulting) so a good call that got unlucky doesn't get filed as a mistake. your reviewed record also appears on the practice page, beside the calibration, estimation, and base-rate trainers — the real game next to the warm-up. includes a worked example. ${situations
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
          the decision journal, the practice hub and its calibration, estimation,
          and base-rate trainers, and {books.length} books.
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
