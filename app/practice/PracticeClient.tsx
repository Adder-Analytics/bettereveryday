"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadProfiles,
  suggestNext,
  type TrainerProfile,
  type Suggestion,
  type Tone,
  type Trend,
  type TrendSeries,
} from "../data/trainers";
import { loadJournalProfile, type JournalProfile } from "../data/journal";
import { loadWaitProfile, type WaitProfile } from "../data/wait";

/**
 * The Practice hub. Calibration, estimation, and base-rate updating are three
 * questions about one thing — how to put an honest number on an uncertain
 * world. Each trainer keeps its own record in the browser; this reads all three
 * and shows them side by side, so the family is concrete and you can see, in
 * one glance, which of the three skills your judgement is weakest on.
 *
 * Below the trainers sits the column they all point at: the decision journal's
 * real record. The trainers are the warm-up — trivia with answer keys, instant
 * feedback. The journal is the game: forecasts on your actual decisions, graded
 * by reality on a delay. When reviews are due there, that outranks any trainer
 * suggestion, because a real data point is worth more than another practice
 * round.
 *
 * Records live only in the browser, so they load after mount: the first client
 * render matches the server (an empty shell), then the real profiles apply.
 */

const toneText: Record<Tone, string> = {
  good: "text-[var(--accent)]",
  mid: "text-[var(--foreground)]",
  work: "text-[var(--foreground)]",
  none: "text-[var(--muted)]",
};

/** The stroke a tone draws its line in — the same restraint as the headline
 *  colour: amber only when calibrated, ink otherwise. */
const toneStroke: Record<Tone, string> = {
  good: "var(--accent)",
  mid: "var(--foreground)",
  work: "var(--foreground)",
  none: "var(--muted)",
};

export default function PracticeClient() {
  const [mounted, setMounted] = useState(false);
  const [profiles, setProfiles] = useState<TrainerProfile[]>([]);
  const [journal, setJournal] = useState<JournalProfile | null>(null);
  const [wait, setWait] = useState<WaitProfile | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setProfiles(loadProfiles());
    setJournal(loadJournalProfile());
    setWait(loadWaitProfile());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!mounted) {
    return <Shell profiles={null} journal={null} wait={null} />;
  }

  return <Shell profiles={profiles} journal={journal} wait={wait} />;
}

function Shell({
  profiles,
  journal,
  wait,
}: {
  profiles: TrainerProfile[] | null;
  journal: JournalProfile | null;
  wait: WaitProfile | null;
}) {
  const anyTrainerData = !!profiles?.some((p) => p.hasData);
  const due = journal?.due ?? 0;
  // A due review beats any trainer suggestion: it's a real forecast reality
  // has already graded, waiting for you to look.
  const suggestion = anyTrainerData && profiles ? suggestNext(profiles) : null;

  return (
    <div>
      {due > 0 ? (
        <ReviewDueBanner due={due} />
      ) : (
        suggestion && <SuggestionBanner suggestion={suggestion} />
      )}

      <section className={due > 0 || suggestion ? "mt-8" : ""}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          The warm-up — trivia with answer keys
        </p>
        {anyTrainerData && profiles ? (
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {profiles.map((p) => (
              <StatCard key={p.id} profile={p} />
            ))}
          </div>
        ) : (
          <TrainerInvitation />
        )}
      </section>

      <section className="mt-10">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          The real game — bets reality grades
        </p>
        <JournalCard journal={journal} />
      </section>

      <section className="mt-10">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          The wait — does sleeping on it change your mind?
        </p>
        <WaitCard wait={wait} />
      </section>

      <p className="mt-8 text-xs text-[var(--muted)] leading-relaxed">
        Every number here is computed in your browser from the rounds
        you&rsquo;ve done and the decisions you&rsquo;ve reviewed, and never
        leaves it. Each tool keeps its own detailed record; these are the
        headlines.{" "}
        <Link
          href="/writing/three-numbers-for-an-uncertain-world"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          Why these three →
        </Link>
      </p>
      <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
        As your record grows, each card also answers the question in the
        site&rsquo;s name: your first rounds beside your latest, once each half
        is big enough to mean something and your record spans a couple of
        weeks. Until then the cards stay quiet on purpose — a trend read off a
        handful of noisy answers would be astrology with axes.{" "}
        <Link
          href="/writing/the-compound-needs-evidence"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          Why the trend is slow to speak →
        </Link>
      </p>
    </div>
  );
}

function ReviewDueBanner({ due }: { due: number }) {
  return (
    <div className="rounded-lg border border-[var(--accent)] bg-[var(--card)] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)]">
        Review first
      </p>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        {due === 1 ? "A decision in your journal is" : `${due} decisions in your journal are`}{" "}
        due for review — {due === 1 ? "a forecast" : "forecasts"} reality has
        already graded. Closing {due === 1 ? "it" : "them"} out is worth more
        than any practice round: it&rsquo;s your real calibration, one data
        point at a time.
      </p>
      <Link
        href="/decide?log=1"
        className="mt-4 inline-block px-4 py-2 text-sm font-medium rounded-lg border border-[var(--accent)] bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
      >
        Review {due === 1 ? "it" : "them"} →
      </Link>
    </div>
  );
}

function SuggestionBanner({ suggestion }: { suggestion: Suggestion }) {
  const { profile, reason } = suggestion;
  return (
    <div className="rounded-lg border border-[var(--accent)] bg-[var(--card)] p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--accent)]">
        Practise next
      </p>
      <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
        <Link
          href={profile.route}
          className="font-semibold text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {profile.name}
        </Link>{" "}
        — {reason}
      </p>
      <Link
        href={profile.route}
        className="mt-4 inline-block px-4 py-2 text-sm font-medium rounded-lg border border-[var(--accent)] bg-[var(--accent)] text-[var(--background)] hover:opacity-90 transition-opacity"
      >
        Open {profile.name} →
      </Link>
    </div>
  );
}

function StatCard({ profile }: { profile: TrainerProfile }) {
  const started = profile.hasData;
  return (
    <Link
      href={profile.route}
      className="group flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--accent)] transition-colors"
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
        {profile.name}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)] leading-snug">
        {profile.question}
      </p>

      <div className="mt-4">
        {started ? (
          <>
            <span
              className={`text-3xl font-semibold tracking-tight tabular-nums ${toneText[profile.tone]}`}
            >
              {profile.headline}
            </span>
            <p className="mt-1 text-xs text-[var(--muted)] leading-snug">
              {profile.headlineLabel}
            </p>
          </>
        ) : (
          <span className="inline-block text-sm font-medium text-[var(--accent)]">
            Not started →
          </span>
        )}
      </div>

      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        {profile.verdict}
      </p>

      {profile.trend && <TrendBlock trend={profile.trend} />}

      <span className="mt-4 text-xs text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
        {started ? `${profile.n} answered · open →` : "Try it →"}
      </span>
    </Link>
  );
}

/**
 * The trajectory between the endpoints, drawn as a sparkline. The two-number
 * read tells you where you started and where you are; this shows the *shape* of
 * the road between — a steady climb, a dip and recovery, a plateau — off the
 * per-window series data/trainers.ts and data/journal.ts already compute.
 *
 * Honest by construction: the line carries only shape (no axis labels), the
 * endpoint numbers above carry the real values, and where a metric has a fixed
 * ideal (a true 90%, no gap, dead-on) a faint dotted line marks it — so on the
 * calibration card, where higher is not simply better, "toward the line" still
 * reads as improvement. Decorative to a screen reader: the numbers and the
 * plain-language reading beside it carry the same meaning in words.
 */
function Sparkline({ series, tone }: { series: TrendSeries; tone: Tone }) {
  const { points, target } = series;
  if (points.length < 2) return null;

  const W = 100;
  const H = 30;
  const padY = 4;
  const domain = target === undefined ? points : [...points, target];
  let lo = Math.min(...domain);
  let hi = Math.max(...domain);
  if (hi - lo < 1e-9) {
    // A perfectly flat run: centre it so the line sits mid-height, not on an edge.
    lo -= 1;
    hi += 1;
  }
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => padY + (1 - (v - lo) / (hi - lo)) * (H - 2 * padY);

  const line = points
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const lastX = x(points.length - 1).toFixed(1);
  const lastY = y(points[points.length - 1]).toFixed(1);
  const stroke = toneStroke[tone];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="mt-2 block h-8 w-full"
      aria-hidden="true"
    >
      <path d={area} fill={stroke} fillOpacity={0.08} stroke="none" />
      {target !== undefined && (
        <path
          d={`M 0 ${y(target).toFixed(1)} L ${W} ${y(target).toFixed(1)}`}
          stroke="var(--muted)"
          strokeWidth={1}
          strokeDasharray="2 2"
          strokeOpacity={0.7}
          vectorEffect="non-scaling-stroke"
          fill="none"
        />
      )}
      <path
        d={line}
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        fill="none"
      />
      {/* "You are here": a degenerate round-capped segment renders as a crisp,
          fixed-size dot even under the non-uniform x-scaling. */}
      <path
        d={`M ${lastX} ${lastY} L ${lastX} ${lastY}`}
        stroke={stroke}
        strokeWidth={4}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * The answer to the site's own name: your first rounds beside your latest.
 * Only rendered when the halves can carry the claim — enough volume per half
 * and enough calendar between them (see the trend logic in data/trainers.ts
 * and data/journal.ts, and the essay "The Compound Needs Evidence").
 */
function TrendBlock({ trend }: { trend: Trend }) {
  return (
    <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--background)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
        Since you started
      </p>
      {trend.series && <Sparkline series={trend.series} tone={trend.tone} />}
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--foreground)] tabular-nums">
        <span className="text-[var(--muted)]">{trend.earlyLabel}:</span>{" "}
        <span className="font-medium">{trend.early}</span>
        <span className="text-[var(--muted)]"> · {trend.lateLabel}:</span>{" "}
        <span className="font-medium">{trend.late}</span>
        {trend.series?.targetLabel && (
          <>
            <span className="text-[var(--muted)]">
              {" "}
              · <span className="tracking-[0.2em]">···</span>{" "}
              {trend.series.targetLabel}
            </span>
          </>
        )}
      </p>
      <p className={`mt-1 text-xs leading-relaxed ${toneText[trend.tone]}`}>
        {trend.reading}
      </p>
    </div>
  );
}

/**
 * The journal's row on the hub. Four states, in the order a visitor moves
 * through them: nothing logged (the invitation), logged but nothing scored
 * (the record is in the mail), a few scored (honest counts), enough scored
 * (the real-world overconfidence gap). All the wording comes from the shared
 * profile so this card and the journal itself never disagree.
 */
function JournalCard({ journal }: { journal: JournalProfile | null }) {
  // Pre-hydration and brand-new visitors get the same invitation shell.
  if (!journal || !journal.hasLog) {
    return (
      <Link
        href="/decide"
        className="group mt-3 flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--accent)] transition-colors"
      >
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            Your real record
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            The trainers above grade you on trivia with answer keys — feedback in
            seconds. The{" "}
            <span className="font-medium text-[var(--accent)]">decision journal</span>{" "}
            grades you on your actual decisions: write down what you expect and
            how sure you are, review when the outcome is in, and your real-world
            calibration accumulates here — beside the warm-up scores it exists to
            keep honest.
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-[var(--accent)] group-hover:opacity-70 transition-opacity">
          Log a decision →
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/decide?log=1"
      className="group mt-3 flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--accent)] transition-colors"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            Your real record
          </p>
          <p className="mt-1 text-xs text-[var(--muted)] leading-snug">
            Do things go the way you say they will?
          </p>
        </div>
        {journal.headline && (
          <div className="text-right">
            <span
              className={`text-3xl font-semibold tracking-tight tabular-nums ${toneText[journal.tone]}`}
            >
              {journal.headline}
            </span>
            <p className="mt-1 text-xs text-[var(--muted)] leading-snug">
              {journal.headlineLabel}
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        {journal.verdict}
      </p>

      {journal.trend && <TrendBlock trend={journal.trend} />}

      <span className="mt-4 text-xs text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
        {journal.total} logged
        {journal.scored > 0 ? ` · ${journal.scored} scored` : ""}
        {journal.due > 0 ? ` · ${journal.due} due for review` : ""}
        {" · open the journal →"}
      </span>
    </Link>
  );
}

/**
 * The cooling-off tool's row on the hub — the third face of one skill. The
 * trainers ask how sure you are; the journal asks whether you're right; this
 * asks whether waiting is worth it. All three are readings of the same private
 * records, and the wording comes from the shared profile (data/wait.ts) so this
 * card and the cooling-off tool never disagree about the same record.
 */
function WaitCard({ wait }: { wait: WaitProfile | null }) {
  // Pre-hydration and anyone who's never parked a call get the invitation shell.
  if (!wait || !wait.hasData) {
    return (
      <Link
        href="/cool"
        className="group mt-3 flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--accent)] transition-colors"
      >
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            Your cooling-off record
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            The{" "}
            <span className="font-medium text-[var(--accent)]">cooling-off tool</span>{" "}
            rests on one bet: on a reversible call with no real clock, the calm
            version of you is worth waiting for. Park a hot decision there, decide
            it cold, and grade whether the wait moved you — and the answer to{" "}
            <em>does sleeping on it actually change my mind?</em> accumulates here.
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-[var(--accent)] group-hover:opacity-70 transition-opacity">
          Cool a call →
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/cool"
      className="group mt-3 flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--accent)] transition-colors"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            Your cooling-off record
          </p>
          <p className="mt-1 text-xs text-[var(--muted)] leading-snug">
            Is the calm call worth waiting for?
          </p>
        </div>
        {wait.headline && (
          <div className="text-right">
            <span
              className={`text-3xl font-semibold tracking-tight tabular-nums ${toneText[wait.tone]}`}
            >
              {wait.headline}
            </span>
            <p className="mt-1 text-xs text-[var(--muted)] leading-snug max-w-[12rem]">
              {wait.headlineLabel}
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        {wait.verdict}
      </p>

      <span className="mt-4 text-xs text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
        {[
          wait.waiting > 0 ? `${wait.waiting} waiting` : null,
          wait.resolved > 0 ? `${wait.resolved} decided cold` : null,
          wait.graded > 0 ? `${wait.graded} graded` : null,
          "open the cooling-off tool →",
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
    </Link>
  );
}

/** The three trainers, pitched for someone who hasn't tried any of them. */
function TrainerInvitation() {
  const cards = [
    {
      id: "calibrate",
      name: "Calibration",
      route: "/calibrate",
      question: "How wide should your uncertainty be?",
      verdict:
        "Find out whether your “90% sure” is worth anything — most people's ranges are far too narrow.",
    },
    {
      id: "estimate",
      name: "Estimation",
      route: "/estimate",
      question: "How do you get to a number at all?",
      verdict:
        "How many piano tuners work in Chicago? Learn to get within a factor of two without looking it up.",
    },
    {
      id: "update",
      name: "Base rates",
      route: "/update",
      question: "How much should new evidence move you?",
      verdict:
        "A 99%-accurate test for a 1-in-1,000 disease comes back positive. Your odds aren't 99% — they're about 9%. Learn why.",
    },
  ];

  return (
    <div>
      <div className="mt-3 rounded-lg border border-dashed border-[var(--border)] px-5 py-4">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">
            Three short trainers, one skill.
          </span>{" "}
          Each is a game you can play in a few minutes; each keeps a private
          record in your browser so a pattern can emerge over time. Once
          you&rsquo;ve done a round or two, this page fills in with your whole
          judgement profile and points you at the weakest of the three.
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.id}
            href={c.route}
            className="group flex flex-col rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 hover:border-[var(--accent)] transition-colors"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
              {c.name}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--foreground)] leading-snug">
              {c.question}
            </p>
            <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed flex-1">
              {c.verdict}
            </p>
            <span className="mt-4 text-sm font-medium text-[var(--accent)] group-hover:opacity-70 transition-opacity">
              Start →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
