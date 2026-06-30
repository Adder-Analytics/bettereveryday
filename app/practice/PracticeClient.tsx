"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadProfiles,
  suggestNext,
  type TrainerProfile,
  type Suggestion,
  type Tone,
} from "../data/trainers";

/**
 * The Practice hub. Calibration, estimation, and base-rate updating are three
 * questions about one thing — how to put an honest number on an uncertain
 * world. Each trainer keeps its own record in the browser; this reads all three
 * and shows them side by side, so the family is concrete and you can see, in
 * one glance, which of the three skills your judgement is weakest on. Then it
 * points you at the next ten minutes.
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

export default function PracticeClient() {
  const [mounted, setMounted] = useState(false);
  const [profiles, setProfiles] = useState<TrainerProfile[]>([]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setProfiles(loadProfiles());
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!mounted) {
    return <Shell profiles={null} suggestion={null} anyData={false} />;
  }

  const anyData = profiles.some((p) => p.hasData);
  const suggestion = suggestNext(profiles);
  return <Shell profiles={profiles} suggestion={suggestion} anyData={anyData} />;
}

function Shell({
  profiles,
  suggestion,
  anyData,
}: {
  profiles: TrainerProfile[] | null;
  suggestion: Suggestion | null;
  anyData: boolean;
}) {
  // Before hydration, or for a brand-new visitor, lead with the invitation
  // rather than three empty stat cards.
  if (!profiles || !anyData) {
    return <EmptyState profiles={profiles} />;
  }

  return (
    <div>
      {suggestion && <SuggestionBanner suggestion={suggestion} />}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {profiles.map((p) => (
          <StatCard key={p.id} profile={p} />
        ))}
      </div>

      <p className="mt-8 text-xs text-[var(--muted)] leading-relaxed">
        Every number here is computed in your browser from the rounds you&rsquo;ve
        done, and never leaves it. Each trainer keeps its own detailed record;
        these are the headlines.{" "}
        <Link
          href="/writing/three-numbers-for-an-uncertain-world"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          Why these three →
        </Link>
      </p>
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

      <span className="mt-4 text-xs text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
        {started ? `${profile.n} answered · open →` : "Try it →"}
      </span>
    </Link>
  );
}

function EmptyState({ profiles }: { profiles: TrainerProfile[] | null }) {
  // Fall back to a static description of the three when records haven't loaded.
  const cards = profiles ?? [
    {
      id: "calibrate" as const,
      name: "Calibration",
      route: "/calibrate",
      question: "How wide should your uncertainty be?",
      verdict:
        "Find out whether your “90% sure” is worth anything — most people's ranges are far too narrow.",
    },
    {
      id: "estimate" as const,
      name: "Estimation",
      route: "/estimate",
      question: "How do you get to a number at all?",
      verdict:
        "How many piano tuners work in Chicago? Learn to get within a factor of two without looking it up.",
    },
    {
      id: "update" as const,
      name: "Base rates",
      route: "/update",
      question: "How much should new evidence move you?",
      verdict:
        "A 99%-accurate test for a 1-in-1,000 disease comes back positive. Your odds aren't 99% — they're about 9%. Learn why.",
    },
  ];

  return (
    <div>
      <div className="rounded-lg border border-dashed border-[var(--border)] px-5 py-4">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          <span className="font-semibold text-[var(--foreground)]">
            Three short trainers, one skill.
          </span>{" "}
          Each is a game you can play in a few minutes; each keeps a private
          record in your browser so a pattern can emerge over time. Once you&rsquo;ve
          done a round or two, this page fills in with your whole judgement
          profile and points you at the weakest of the three.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
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

      <p className="mt-8 text-xs text-[var(--muted)] leading-relaxed">
        New to the idea behind all three?{" "}
        <Link
          href="/writing/three-numbers-for-an-uncertain-world"
          className="text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          Three numbers for an uncertain world →
        </Link>
      </p>
    </div>
  );
}
