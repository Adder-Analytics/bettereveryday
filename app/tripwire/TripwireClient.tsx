"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  armTripwire,
  answerTripwire,
  deleteTripwire,
  reopenTripwire,
  loadTripwires,
  isDueTripwire,
  type Tripwire,
} from "../data/tripwires";
import { whenLabel, daysBetween } from "../data/review";
import { SITE_URL, icsEscape, icsStamp, wrapCalendar } from "../data/ics";

/**
 * The tripwire tool (/tripwire): arm a state-and-a-date anywhere, answer it here.
 *
 * The pre-mortem room already grows tripwires out of a full failure analysis;
 * this is the standalone version the rest of the site hands off to. It reads and
 * writes its own store (data/tripwires.ts) and, like every client here, hydrates
 * once from the browser on mount to avoid a hydration mismatch. Three ways in:
 * type one here; land from the return desk with ?check=<id> to answer one that's
 * due; or arrive pre-filled from a tool (?signal=…&on=…&guard=…&from=/act), the
 * whole reason this exists — a reconsider line computed elsewhere finally has
 * somewhere to land, and it comes back on its date at /review.
 */

const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";

const textareaClass = `${inputClass} resize-y leading-relaxed`;

function todayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formatHuman(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// A tripwire only works if the check actually happens — the 1996 Everest
// turnaround time failed the man who set it because nothing outside his own
// summit-fevered judgement enforced it. This drops the check into the calendar
// you already look at. Spec plumbing shared with the other tools (data/ics.ts).
function tripwireICS(t: Tripwire): string {
  const day = t.checkOn.replace(/-/g, "");
  const signal = t.signal.replace(/\s+/g, " ").trim();
  const title = signal.length > 70 ? `${signal.slice(0, 69)}…` : signal;
  const desc: string[] = [
    t.guard.trim()
      ? `Tripwire check for: ${t.guard.replace(/\s+/g, " ").trim()}`
      : "A tripwire check you set.",
    `\nThe signal you named: ${signal}`,
    t.failure.trim()
      ? `\nWhat it guards against: ${t.failure.replace(/\s+/g, " ").trim()}`
      : "",
    "\nIf the signal has fired, the plan doesn't get the benefit of the doubt — you decided that in advance, while you were calm. Stop and reconsider, or recommit on purpose.",
    `\nAnswer it: ${SITE_URL}/tripwire`,
  ];
  const event = [
    "BEGIN:VEVENT",
    `UID:tripwire-${t.id}@bettereveryday`,
    `DTSTAMP:${icsStamp()}`,
    `DTSTART:${day}T090000`,
    `DTEND:${day}T093000`,
    `SUMMARY:${icsEscape(`Tripwire check: ${title}`)}`,
    `DESCRIPTION:${icsEscape(desc.join(""))}`,
    `URL:${SITE_URL}/tripwire`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Tripwire check",
    "TRIGGER:-PT0M",
    "END:VALARM",
    "END:VEVENT",
  ];
  return wrapCalendar([event], "Tripwires");
}

function downloadICS(t: Tripwire) {
  try {
    const blob = new Blob([tripwireICS(t)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tripwire-${t.checkOn || "check"}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    /* download blocked — the tripwire is still safe in the browser and at /review */
  }
}

// The example that runs on the same store shapes the live tool uses, so it can
// never drift from what the tool actually does. Read-only; never persisted.
const EXAMPLE: Tripwire = {
  id: "example",
  guard: "Keep pushing the side project instead of shutting it down",
  signal: "still under 25 paying users",
  checkOn: "2026-10-01",
  failure: "sinking another quarter into something the market already answered",
  source: "/quit",
  createdOn: "2026-07-25",
  checkedOn: "",
  fired: null,
};

type Row = { t: Tripwire; due: boolean; rel: number };

export default function TripwireClient() {
  const [hydrated, setHydrated] = useState(false);
  const [list, setList] = useState<Tripwire[]>([]);
  const [showExample, setShowExample] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  // draft form
  const [guard, setGuard] = useState("");
  const [signal, setSignal] = useState("");
  const [checkOn, setCheckOn] = useState("");
  const [failure, setFailure] = useState("");
  const [from, setFrom] = useState("");
  const [justArmed, setJustArmed] = useState<string | null>(null);

  const focusRef = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration and
       deep-link read from the browser on mount; can't run in render. */
    setList(loadTripwires());
    setHydrated(true);

    const params = new URLSearchParams(window.location.search);
    const check = params.get("check");
    if (check) setFocusId(check);
    // Pre-fill from a hand-off (?signal=…&on=…&guard=…&failure=…&from=/act).
    const pSignal = params.get("signal");
    const pOn = params.get("on");
    const pGuard = params.get("guard");
    const pFailure = params.get("failure");
    const pFrom = params.get("from");
    if (pSignal) setSignal(pSignal);
    if (pOn) setCheckOn(pOn);
    if (pGuard) setGuard(pGuard);
    if (pFailure) setFailure(pFailure);
    if (pFrom) setFrom(pFrom);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Scroll a deep-linked tripwire into view and glow it once the list is drawn.
  useEffect(() => {
    if (focusId && focusRef.current) {
      focusRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [focusId, hydrated, list.length]);

  const today = todayISO();

  function refresh() {
    setList(loadTripwires());
  }

  function arm() {
    if (!signal.trim() || !checkOn) return;
    const created = armTripwire({
      guard: guard.trim(),
      signal: signal.trim(),
      checkOn,
      failure: failure.trim(),
      source: from.trim(),
    });
    refresh();
    setGuard("");
    setSignal("");
    setCheckOn("");
    setFailure("");
    setFrom("");
    setJustArmed(created.id);
    setFocusId(created.id);
    window.setTimeout(() => setJustArmed(null), 2200);
  }

  const canArm = signal.trim().length > 0 && !!checkOn;

  const armed: Row[] = list
    .filter((t) => !t.checkedOn)
    .map((t) => ({
      t,
      due: isDueTripwire(t, today),
      rel: daysBetween(t.checkOn, today),
    }))
    .sort((a, b) => a.t.checkOn.localeCompare(b.t.checkOn));

  const answered = list.filter((t) => !!t.checkedOn);

  if (!hydrated) {
    return (
      <p className="text-sm text-[var(--muted)]">Reading your tripwires…</p>
    );
  }

  return (
    <div className="space-y-14">
      {/* ---- Arm a tripwire ------------------------------------------------ */}
      <section>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Set a tripwire
          </h2>
          <button
            type="button"
            onClick={() => setShowExample((v) => !v)}
            className="text-xs text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {showExample ? "Hide example" : "See a worked example"}
          </button>
        </div>

        {showExample && (
          <div className="mb-6 rounded-lg border border-dashed border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-xs text-[var(--muted)] mb-3">
              A read-only example — nothing here is saved. This is one tripwire
              handed over from the quit-or-stay tool.
            </p>
            <ExampleCard />
          </div>
        )}

        {from && (
          <p className="mb-4 text-sm text-[var(--muted)] leading-relaxed">
            Handed over from{" "}
            <span className="text-[var(--foreground)] font-medium">{from}</span>
            . Check the state and the date, then arm it — it&rsquo;ll come back
            to you on that day at the{" "}
            <Link
              href="/review"
              className="text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              return desk
            </Link>
            .
          </p>
        )}

        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
          <div>
            <label
              htmlFor="tw-guard"
              className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
            >
              What are you protecting?
            </label>
            <input
              id="tw-guard"
              type="text"
              value={guard}
              onChange={(e) => setGuard(e.target.value)}
              placeholder="The plan or decision this guards — one line"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="tw-signal"
              className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
            >
              The signal — what would tell you to stop and reconsider?
            </label>
            <textarea
              id="tw-signal"
              rows={2}
              value={signal}
              onChange={(e) => setSignal(e.target.value)}
              placeholder="An observable state you can't argue with — “under 25 paying users,” not “if it isn't working”"
              className={textareaClass}
            />
            <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
              &ldquo;Working&rdquo; renegotiates itself in the moment and never
              fires. Name something a stranger could check.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <label
                htmlFor="tw-date"
                className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
              >
                The date you&rsquo;ll look
              </label>
              <input
                id="tw-date"
                type="date"
                value={checkOn}
                min={today}
                onChange={(e) => setCheckOn(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex-1 min-w-[12rem]">
              <label
                htmlFor="tw-failure"
                className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
              >
                What it guards against{" "}
                <span className="text-[var(--muted)] font-normal">
                  (optional)
                </span>
              </label>
              <input
                id="tw-failure"
                type="text"
                value={failure}
                onChange={(e) => setFailure(e.target.value)}
                placeholder="The failure you'd be walking into"
                className={inputClass}
              />
            </div>
          </div>

          {canArm && (
            <p className="text-sm text-[var(--foreground)] leading-relaxed rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 py-2.5">
              <span className="text-[var(--muted)]">Reads as: </span>
              If {signal.trim()}, by {formatHuman(checkOn)}, stop and reconsider
              {guard.trim() ? ` — ${guard.trim()}` : ""}.
            </p>
          )}

          <div className="flex items-center gap-4 pt-1">
            <button
              type="button"
              onClick={arm}
              disabled={!canArm}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                canArm
                  ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--background)] hover:opacity-90"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] cursor-not-allowed"
              }`}
            >
              Arm this tripwire
            </button>
            {!canArm && (
              <span className="text-xs text-[var(--muted)]">
                A state and a date — both are required.
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ---- Armed ---------------------------------------------------------- */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
          {armed.length > 0 ? `Armed · ${armed.length}` : "Armed"}
        </h2>
        {armed.length === 0 ? (
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            No tripwires armed yet. The one above is the whole idea: a signal you
            can&rsquo;t argue with and a day you&rsquo;re obligated to look, set
            now while you&rsquo;re calm — so a decision going quietly wrong
            can&rsquo;t coast past the point it stopped being right.
          </p>
        ) : (
          <ul className="space-y-3">
            {armed.map(({ t, due, rel }) => (
              <li
                key={t.id}
                ref={t.id === focusId ? focusRef : null}
                className={`rounded-lg border bg-[var(--card)] px-4 py-3.5 transition-shadow ${
                  due ? "border-[var(--accent)]" : "border-[var(--border)]"
                } ${
                  justArmed === t.id || focusId === t.id
                    ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)]"
                    : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    {t.source ? `from ${t.source}` : "Tripwire"}
                  </span>
                  <span
                    className={`shrink-0 text-xs tabular-nums ${
                      due
                        ? "text-[var(--accent)] font-medium"
                        : "text-[var(--muted)]"
                    }`}
                  >
                    {whenLabel(rel)} · {formatHuman(t.checkOn)}
                  </span>
                </div>
                {t.guard && (
                  <p className="mt-1.5 text-sm font-medium text-[var(--foreground)] leading-snug">
                    {t.guard}
                  </p>
                )}
                <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
                  Watch for: {t.signal}
                </p>
                {t.failure && (
                  <p className="mt-1 text-xs text-[var(--muted)] italic">
                    guards against: {t.failure}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      answerTripwire(t.id, true);
                      refresh();
                    }}
                    className="text-xs font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
                  >
                    It appeared — reconsider →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      answerTripwire(t.id, false);
                      refresh();
                    }}
                    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    All clear
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadICS(t)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Add to calendar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteTripwire(t.id);
                      refresh();
                    }}
                    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors ml-auto"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- Answered ------------------------------------------------------- */}
      {answered.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Answered · {answered.length}
          </h2>
          <ul className="space-y-3">
            {answered.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 opacity-90"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={`text-xs font-medium uppercase tracking-wider ${
                      t.fired ? "text-[var(--accent)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {t.fired ? "Fired — reconsidered" : "All clear"}
                  </span>
                  <span className="shrink-0 text-xs text-[var(--muted)]">
                    answered {formatHuman(t.checkedOn)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted)] leading-snug">
                  {t.guard || t.signal}
                </p>
                <div className="mt-2 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      reopenTripwire(t.id);
                      refresh();
                    }}
                    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Re-arm
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteTripwire(t.id);
                      refresh();
                    }}
                    className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

// The worked example, rendered read-only from the same Tripwire shape.
function ExampleCard() {
  const t = EXAMPLE;
  return (
    <div className="rounded-lg border border-[var(--accent)] bg-[var(--background)] px-4 py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
          from {t.source}
        </span>
        <span className="shrink-0 text-xs text-[var(--accent)] font-medium">
          due {formatHuman(t.checkOn)}
        </span>
      </div>
      <p className="mt-1.5 text-sm font-medium text-[var(--foreground)] leading-snug">
        {t.guard}
      </p>
      <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed">
        Watch for: {t.signal}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)] italic">
        guards against: {t.failure}
      </p>
      <p className="mt-3 text-xs text-[var(--muted)]">
        On October 1 this asks one question — is it still under 25 paying users?
        — and the answer, fired or all clear, is the whole check.
      </p>
    </div>
  );
}
