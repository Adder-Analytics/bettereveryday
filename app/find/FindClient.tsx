"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getTool } from "../data/tools";
import {
  getTriageNode,
  TRIAGE_ROOT,
  type TriageNode,
  type TriageRec,
} from "../data/triage";
import { withSubject, readCarriedSubject } from "../data/carry";

/**
 * The guided front door, made interactive.
 *
 * Walks the decision tree in `triage.ts` one question at a time and lands on a
 * single instrument, with the decision you typed carried onto the handoff link
 * (the same through-line the tools use between each other) and the honest next
 * step named. It holds nothing and persists nothing — the subject lives only in
 * this component's state until you click through, exactly like the "what are you
 * deciding?" field every tool opens with.
 */

type Position =
  | { kind: "node"; node: TriageNode }
  | { kind: "rec"; rec: TriageRec };

type Answered = { node: TriageNode; choiceLabel: string };

/**
 * Walk the tree from the root following the chosen choice ids. Returns the
 * answered trail (for the breadcrumb) and where we are now — still choosing at a
 * node, or landed on a recommendation. Defensive: an id that doesn't resolve
 * (a stale/hand-edited state) just stops the walk where it still makes sense.
 */
function walk(steps: string[]): { trail: Answered[]; position: Position } {
  let node = getTriageNode(TRIAGE_ROOT);
  const trail: Answered[] = [];
  for (const id of steps) {
    const choice = node.choices.find((c) => c.id === id);
    if (!choice) break;
    trail.push({ node, choiceLabel: choice.label });
    if ("rec" in choice) {
      return { trail, position: { kind: "rec", rec: choice.rec } };
    }
    node = getTriageNode(choice.next);
  }
  return { trail, position: { kind: "node", node } };
}

export default function FindClient() {
  const [subject, setSubject] = useState("");
  const [steps, setSteps] = useState<string[]>([]);

  // Seed the field if a decision was carried in from elsewhere (a tool could
  // hand off to the router the same way it hands off to another tool). Read
  // once on mount; nothing is persisted and nothing is sent anywhere.
  useEffect(() => {
    const carried = readCarriedSubject();
    if (!carried) return;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       the incoming handoff URL; intentionally synchronous on mount, can't run in
       render (reads window.location). */
    setSubject(carried);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const { trail, position } = useMemo(() => walk(steps), [steps]);

  const choose = (id: string) => setSteps((s) => [...s, id]);
  const back = () => setSteps((s) => s.slice(0, -1));
  const rewindTo = (i: number) => setSteps((s) => s.slice(0, i));
  const restart = () => setSteps([]);

  return (
    <div>
      {/* What are you deciding? — carried onto every handoff below. */}
      <div className="mb-10">
        <label
          htmlFor="find-subject"
          className="block text-sm font-medium text-[var(--foreground)] mb-2"
        >
          What are you deciding?{" "}
          <span className="font-normal text-[var(--muted)]">(optional)</span>
        </label>
        <input
          id="find-subject"
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Take the Berlin role, or stay?"
          className="w-full rounded-md border border-[var(--border)] bg-[var(--card)] px-3.5 py-2.5 text-base text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors"
        />
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Name it in a line and it comes with you into whichever instrument you
          land on — so you don&rsquo;t retype it. It stays in your browser and is
          sent nowhere.
        </p>
      </div>

      {/* The breadcrumb: what you've said so far, each step clickable to rewind. */}
      {trail.length > 0 && (
        <nav aria-label="Your answers" className="mb-6 flex flex-col gap-1.5">
          {trail.map((step, i) => (
            <button
              key={i}
              type="button"
              onClick={() => rewindTo(i)}
              className="group flex items-start gap-2 text-left"
            >
              <span className="shrink-0 mt-0.5 text-[var(--muted)] group-hover:text-[var(--accent)] transition-colors">
                &#8627;
              </span>
              <span className="text-sm text-[var(--muted)] group-hover:text-[var(--foreground)] transition-colors leading-snug">
                {step.choiceLabel}
              </span>
            </button>
          ))}
        </nav>
      )}

      {position.kind === "node" ? (
        <QuestionCard node={position.node} onChoose={choose} />
      ) : (
        <Recommendation rec={position.rec} subject={subject} />
      )}

      {/* Controls + the escape hatch to the full browse index. */}
      <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-wrap items-center gap-x-6 gap-y-2">
        {steps.length > 0 && (
          <>
            <button
              type="button"
              onClick={back}
              className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              &larr; Back
            </button>
            <button
              type="button"
              onClick={restart}
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Start over
            </button>
          </>
        )}
        <Link
          href="/tools"
          className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          Or browse all fifteen instruments &rarr;
        </Link>
      </div>
    </div>
  );
}

function QuestionCard({
  node,
  onChoose,
}: {
  node: TriageNode;
  onChoose: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)] leading-snug">
        {node.question}
      </h2>
      {node.hint && (
        <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
          {node.hint}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-3">
        {node.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => onChoose(choice.id)}
            className="group flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3.5 text-left hover:border-[var(--accent)] transition-colors"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-base font-medium text-[var(--foreground)] leading-snug">
                {choice.label}
              </span>
              {choice.detail && (
                <span className="mt-1 block text-sm text-[var(--muted)] leading-relaxed">
                  {choice.detail}
                </span>
              )}
            </span>
            <span
              aria-hidden
              className="shrink-0 mt-0.5 text-[var(--muted)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all"
            >
              &rarr;
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Recommendation({
  rec,
  subject,
}: {
  rec: TriageRec;
  subject: string;
}) {
  const tool = getTool(rec.toolId);
  const then = rec.then ? getTool(rec.then.toolId) : null;
  const carried = subject.trim().length > 0;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
        Start here
      </p>
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] leading-tight">
        {tool.name}
      </h2>
      <p className="mt-2 text-sm font-medium text-[var(--foreground)] pl-4 border-l-2 border-[var(--accent)] leading-relaxed">
        Ask: {tool.ask}
      </p>
      <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
        {rec.because}
      </p>

      <div className="mt-6">
        <Link
          href={withSubject(tool.href, subject)}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--background)] hover:opacity-90 transition-opacity"
        >
          Open {tool.short}{" "}&rarr;
        </Link>
        {carried && (
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            Your decision comes with you — the tool opens pre-filled.
          </p>
        )}
      </div>

      {then && rec.then && (
        <div className="mt-8 pt-6 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            And then
          </p>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {rec.then.note}
          </p>
          <Link
            href={withSubject(then.href, subject)}
            className="mt-2 inline-block text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {then.name}{" "}&rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
