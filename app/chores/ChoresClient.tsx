"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AnnounceAnswer from "../components/AnnounceAnswer";
import {
  BLANK_CHORES,
  CHORES_EXAMPLE,
  MAX_CHORES,
  MAX_PEOPLE,
  MIND_LABEL,
  blankChore,
  choreName,
  choresHeadline,
  choresRule,
  choresSummary,
  choresWhy,
  formatMinutes,
  minutesInvalid,
  nextId,
  parseChoresInputs,
  pct,
  personName,
  readChores,
  type Chore,
  type ChoresInputs,
  type ChoresRead,
  type Mind,
} from "../data/chores";

/**
 * Who does which chore? (/chores)
 *
 * The instrument for dividing housework on purpose instead of by drift.
 * Everyone overclaims their share of joint work (Ross and Sicoly), the
 * remembering and noticing goes unseen (Daminger), and people mind different
 * chores, which is what makes a trade worth having. The household lists the
 * chores with a rough time a week, each person rates how much they mind each
 * one, and the split gives each chore to one owner so that the largest share,
 * as each person counts it, is as small as it can be.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The split lives
 * in `app/data/chores.ts` so it can be checked without a browser.
 */

const STORE_KEY = "chores:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase =
  "text-xs sm:text-sm px-1.5 sm:px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-center";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff =
  "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow =
  "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card =
  "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";
const linkClass = "text-[var(--accent)] hover:opacity-70 transition-opacity";

/** Chores people forget to list: the visible ones and the remembering. */
const USUAL = [
  "Cooking",
  "Washing up",
  "Laundry",
  "Hoovering and floors",
  "Bathroom",
  "Bins and recycling",
  "Food shop",
];
const UNSEEN = [
  "Meal planning",
  "Noticing what's run out",
  "Bills and admin",
  "Birthdays and presents",
  "Booking repairs and appointments",
];

function loadInputs(): ChoresInputs {
  if (typeof window === "undefined") return BLANK_CHORES;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseChoresInputs(JSON.parse(raw)) : BLANK_CHORES;
  } catch {
    return BLANK_CHORES;
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function ChoresClient() {
  const [inp, setInp] = useState<ChoresInputs>(BLANK_CHORES);
  const [hydrated, setHydrated] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const focusId = useRef<string | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount. */
    setInp(loadInputs());
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(inp));
    } catch {
      /* storage full or blocked — the tool still works, just won't persist */
    }
  }, [inp, hydrated]);

  // After adding a person or a chore, move focus into its name field.
  useEffect(() => {
    const id = focusId.current;
    if (!id) return;
    focusId.current = null;
    document.getElementById(id)?.focus();
  }, [inp]);

  const setPerson = (id: string, name: string) =>
    setInp((prev) => ({ ...prev, people: prev.people.map((p) => (p.id === id ? { ...p, name } : p)) }));
  const addPerson = () =>
    setInp((prev) => {
      if (prev.people.length >= MAX_PEOPLE) return prev;
      const id = nextId("p", prev.people);
      focusId.current = `chores-${id}-name`;
      return { ...prev, people: [...prev.people, { id, name: "" }] };
    });
  const removePerson = (id: string) =>
    setInp((prev) => {
      if (prev.people.length <= 2) return prev;
      return {
        people: prev.people.filter((p) => p.id !== id),
        chores: prev.chores.map((c) => {
          const mind = { ...c.mind };
          delete mind[id];
          return { ...c, mind, now: c.now === id ? "" : c.now };
        }),
      };
    });
  const setChore = <K extends keyof Chore>(id: string, k: K, v: Chore[K]) =>
    setInp((prev) => ({ ...prev, chores: prev.chores.map((c) => (c.id === id ? { ...c, [k]: v } : c)) }));
  const setMind = (choreId: string, personId: string, m: Mind) =>
    setInp((prev) => ({
      ...prev,
      chores: prev.chores.map((c) => (c.id === choreId ? { ...c, mind: { ...c.mind, [personId]: m } } : c)),
    }));
  const addChore = (name = "") =>
    setInp((prev) => {
      if (prev.chores.length >= MAX_CHORES) return prev;
      // Fill an untouched blank card before adding a new one.
      const blank = prev.chores.find((c) => !c.name.trim() && !c.minutes.trim() && Object.keys(c.mind).length === 0);
      if (blank && name) {
        focusId.current = `chores-${blank.id}-minutes`;
        return { ...prev, chores: prev.chores.map((c) => (c.id === blank.id ? { ...c, name } : c)) };
      }
      const id = nextId("c", prev.chores);
      focusId.current = name ? `chores-${id}-minutes` : `chores-${id}-name`;
      return { ...prev, chores: [...prev.chores, blankChore(id, name)] };
    });
  const removeChore = (id: string) =>
    setInp((prev) => {
      const chores = prev.chores.filter((c) => c.id !== id);
      return { ...prev, chores: chores.length ? chores : [blankChore("c1")] };
    });

  const read = useMemo(() => readChores(inp), [inp]);
  const headline = useMemo(() => choresHeadline(inp, read), [inp, read]);
  const listed = new Set(inp.chores.map((c) => c.name.trim().toLowerCase()));

  return (
    <div>
      {/* ---- New here? A read-only worked example ---- */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowExample((s) => !s)}
          aria-expanded={showExample}
          className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {showExample ? "Hide the worked example ↑" : "New here? See a worked example ↓"}
        </button>
        {showExample ? <ChoresExample /> : null}
      </div>

      {/* ---- Step 1: who's in the house ---- */}
      <section aria-label="Who's sharing the chores" className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>Who&rsquo;s sharing the chores</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {inp.people.map((p, i) => (
            <div key={p.id} className="flex items-center gap-2">
              <label htmlFor={`chores-${p.id}-name`} className="sr-only">
                Person {i + 1}
              </label>
              <input
                id={`chores-${p.id}-name`}
                type="text"
                value={p.name}
                onChange={(e) => setPerson(p.id, e.target.value)}
                placeholder={`Person ${i + 1}`}
                className={inputClass}
              />
              {inp.people.length > 2 ? (
                <button
                  type="button"
                  onClick={() => removePerson(p.id)}
                  aria-label={`Remove ${personName(inp, p.id)}`}
                  className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors shrink-0"
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {inp.people.length < MAX_PEOPLE ? (
          <button
            type="button"
            onClick={addPerson}
            className="mt-3 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            + Add someone
          </button>
        ) : null}
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Anyone old enough to own a chore. Up to {MAX_PEOPLE}.
        </p>
      </section>

      {/* ---- Step 2: list them all ---- */}
      <section aria-label="List the chores" className={card}>
        <p className={eyebrow}>Then list them all, including the unseen ones</p>
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          Agree each chore&rsquo;s rough time a week together, out loud. Then
          let each person say how much they mind it, before the others do if
          you can: one &ldquo;I hate it&rdquo; makes the next one harder to say.
        </p>
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          The remembering counts as a chore. Noticing the milk is low, planning
          the week&rsquo;s meals, booking the boiler service: whoever does it is
          working, even if nobody sees it.
        </p>
        <div className="mt-4">
          <p className="text-xs text-[var(--muted)] mb-2">Tap to add:</p>
          <div className="flex flex-wrap gap-2">
            {[...USUAL, ...UNSEEN].map((name) => {
              const has = listed.has(name.toLowerCase());
              return (
                <button
                  key={name}
                  type="button"
                  disabled={has || inp.chores.length >= MAX_CHORES}
                  onClick={() => addChore(name)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    has
                      ? "border-[var(--border)] text-[var(--muted)] opacity-50 cursor-default"
                      : UNSEEN.includes(name)
                        ? "border-dashed border-[var(--accent)] text-[var(--accent)] hover:opacity-70"
                        : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)]"
                  }`}
                >
                  {has ? `✓ ${name}` : `+ ${name}`}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">Dashed ones are the remembering.</p>
        </div>
      </section>

      {inp.chores.map((c, i) => (
        <ChoreCard
          key={c.id}
          chore={c}
          index={i}
          inp={inp}
          setChore={setChore}
          setMind={setMind}
          onRemove={() => removeChore(c.id)}
        />
      ))}
      <div className="mt-4">
        {inp.chores.length < MAX_CHORES ? (
          <button
            type="button"
            onClick={() => addChore()}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            + Add another chore
          </button>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            That&rsquo;s {MAX_CHORES}. Fold the small ones together (&ldquo;bins,
            recycling and the compost&rdquo;) to make room.
          </p>
        )}
      </div>

      {/* ---- The split ---- */}
      <AnnounceAnswer message={headline} />
      {read && headline ? (
        <ReadBlock inp={inp} read={read} headline={headline} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give a chore its time a week and the split appears. Ratings left
            blank count as &ldquo;fine&rdquo;.
          </p>
        </div>
      )}
      <ClearCallButton storeKey={STORE_KEY} onReset={() => setInp(BLANK_CHORES)} />
    </div>
  );
}

function ChoreCard({
  chore,
  index,
  inp,
  setChore,
  setMind,
  onRemove,
}: {
  chore: Chore;
  index: number;
  inp: ChoresInputs;
  setChore: <K extends keyof Chore>(id: string, k: K, v: Chore[K]) => void;
  setMind: (choreId: string, personId: string, m: Mind) => void;
  onRemove: () => void;
}) {
  const id = `chores-${chore.id}`;
  const label = choreName(chore, index);
  const bad = minutesInvalid(chore.minutes);
  const minds = Object.keys(MIND_LABEL) as Exclude<Mind, "">[];
  const nowOptions = [
    ...inp.people.map((p) => ({ id: p.id, label: personName(inp, p.id) })),
    { id: "shared", label: "Shared" },
  ];
  return (
    <section aria-label={label} className={card}>
      <div className="flex items-baseline justify-between gap-3">
        <p className={eyebrow}>Chore {index + 1}</p>
        {inp.chores.length > 1 ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label}`}
            className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Remove
          </button>
        ) : null}
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-[3fr_2fr] gap-3">
        <div>
          <label htmlFor={`${id}-name`} className="block text-sm text-[var(--muted)] mb-1.5">
            What it is
          </label>
          <input
            id={`${id}-name`}
            type="text"
            value={chore.name}
            onChange={(e) => setChore(chore.id, "name", e.target.value)}
            placeholder="e.g. Cooking"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${id}-minutes`} className="block text-sm text-[var(--muted)] mb-1.5">
            Time a week, roughly
          </label>
          <input
            id={`${id}-minutes`}
            type="text"
            value={chore.minutes}
            onChange={(e) => setChore(chore.id, "minutes", e.target.value)}
            placeholder="e.g. 1h 30m"
            aria-invalid={bad || undefined}
            aria-describedby={bad ? `${id}-minutes-bad` : undefined}
            className={inputClass}
          />
          {bad ? (
            <p id={`${id}-minutes-bad`} className="mt-1.5 text-xs text-[var(--muted)]">
              Type a time, like 45, 1h or 1h 30m.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {inp.people.map((p) => {
          const who = personName(inp, p.id);
          const q = `How much does ${who} mind ${chore.name.trim() ? label.toLowerCase() : "this one"}?`;
          return (
            <div key={p.id}>
              <p className="text-sm text-[var(--foreground)] mb-1.5">{q}</p>
              <div role="group" aria-label={q} className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {minds.map((m) => {
                  const on = chore.mind[p.id] === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setMind(chore.id, p.id, on ? "" : m)}
                      className={`${chipBase} ${on ? chipOn : chipOff}`}
                    >
                      {MIND_LABEL[m]}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <label className="mt-4 flex items-start gap-2 text-sm text-[var(--foreground)] cursor-pointer">
        <input
          type="checkbox"
          checked={chore.turns}
          onChange={(e) => setChore(chore.id, "turns", e.target.checked)}
          className="mt-1 accent-[var(--accent)]"
        />
        <span>
          Take turns on this one
          <span className="block text-xs text-[var(--muted)]">
            For the chore everyone hates, or one too big to give to one person.
          </span>
        </span>
      </label>

      <div className="mt-4">
        <p className="text-sm text-[var(--muted)] mb-1.5">
          Who does it now? <span className="opacity-70">(optional)</span>
        </p>
        <div role="group" aria-label={`Who does ${label.toLowerCase()} now?`} className="flex flex-wrap gap-2">
          {nowOptions.map((o) => {
            const on = chore.now === o.id;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={on}
                onClick={() => setChore(chore.id, "now", on ? "" : o.id)}
                className={`${chipBase} ${on ? chipOn : chipOff}`}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ReadBlock({ inp, read, headline }: { inp: ChoresInputs; read: ChoresRead; headline: string }) {
  const [copied, setCopied] = useState<"" | "line" | "all" | "no">("");
  const rule = choresRule();
  const withNow = read.people.every((p) => p.nowMinutes !== null);
  const nowTotal = withNow ? read.people.reduce((a, p) => a + (p.nowMinutes ?? 0), 0) : 0;
  const envy = read.people.filter((p) => p.envies.length > 0);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The split</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{headline}</p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">{choresWhy(inp, read)}</p>

      <ul className="mt-5 space-y-4">
        {read.people.map((p) => (
          <li key={p.id} className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-[var(--foreground)] break-words">{p.name}</span>
              <span className="text-xs text-[var(--muted)] shrink-0">
                {pct(p.share)} as {p.name} counts it · {formatMinutes(p.minutes)} a week
              </span>
            </div>
            <ShareBar share={p.share} fair={read.fair} />
            <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
              {p.owns.length ? p.owns.join(", ") : "No chores of their own"}
              {read.turns.length ? `, plus a turn at ${read.turns.join(", ").toLowerCase()}` : ""}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2 text-sm text-[var(--muted)] leading-relaxed">
        <p>
          Your share counts each chore&rsquo;s time, weighted by how much you
          mind it: an hour you hate counts six times an hour you&rsquo;re happy
          to do. Because it&rsquo;s measured against your own ratings, marking
          everything &ldquo;hate it&rdquo; doesn&rsquo;t lighten your load. Only
          how you rank the chores matters.
        </p>
        {read.turns.length ? (
          <p>
            Taking turns on {read.turns.join(", ").toLowerCase()} means
            {inp.people.length === 2 ? " alternate weeks" : ` one week in ${inp.people.length} each`}.
          </p>
        ) : null}
        {withNow && nowTotal > 0 ? (
          <p>
            <span className="text-[var(--foreground)]">Now, by the clock:</span>{" "}
            {read.people.map((p) => `${p.name} ${pct((p.nowMinutes ?? 0) / nowTotal)}`).join(", ")}
            {" "}of the time you assigned. <span className="text-[var(--foreground)]">After:</span>{" "}
            {read.people.map((p) => `${p.name} ${pct(p.minutes / read.totalMinutes)}`).join(", ")}.
          </p>
        ) : null}
        <p>
          {envy.length === 0
            ? "Nobody would rather swap lists with anyone else, judging by their own ratings."
            : envy.map((p) => `${p.name} would rather have ${p.envies.join(" or ")}'s list, by ${p.name}'s own ratings.`).join(" ") +
              " Swap one chore and run it again, or talk through the one that stings."}
        </p>
        {read.missing > 0 ? (
          <p>
            {read.missing === 1 ? "One rating is" : `${read.missing} ratings are`}{" "}still blank and
            counted as &ldquo;fine&rdquo;.
          </p>
        ) : null}
      </div>

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Owning a chore includes noticing it&rsquo;s due. &ldquo;Just ask me
          and I&rsquo;ll do it&rdquo; leaves the noticing, the hardest part to
          see, with someone else.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={async () => setCopied((await copyText(rule)) ? "line" : "no")}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "line" ? "Copied your line" : "Copy your line"}
          </button>
          <button
            type="button"
            onClick={async () => setCopied((await copyText(choresSummary(inp, read))) ? "all" : "no")}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "all" ? "Copied the split" : "Copy the split to send the house"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Couldn&rsquo;t copy. Select the text above instead.
          </p>
        ) : null}
      </div>

      <div className="mt-5 pt-5 border-t border-[var(--border)]">
        <p className={eyebrow}>Where to take it next</p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link href="/worth" className={`${linkClass} font-medium`}>
              Pay someone to do one →
            </Link>{" "}
            If a chore nobody wants takes hours, price a cleaner or a delivery
            against what those hours are worth to you.
          </li>
          <li>
            <Link href="/crux" className={`${linkClass} font-medium`}>
              Stuck on one chore? →
            </Link>{" "}
            If someone won&rsquo;t accept the split, it&rsquo;s usually one
            chore and one disagreement. Find out which kind.
          </li>
          <li>
            <Link href="/split" className={`${linkClass} font-medium`}>
              Splitting the rent too →
            </Link>{" "}
            Rooms that aren&rsquo;t equal, priced so nobody would swap.
          </li>
        </ul>
      </div>
    </div>
  );
}

/**
 * A person's share against an even one. A picture of the number beside it,
 * so it's hidden from screen readers.
 */
function ShareBar({ share, fair }: { share: number; fair: number }) {
  const w = Math.min(100, share * 100);
  return (
    <div className="mt-2 relative h-2 rounded-full bg-[var(--border)]" aria-hidden="true">
      <div className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)]" style={{ width: `${w}%` }} />
      <div
        className="absolute -top-1 -bottom-1 w-px bg-[var(--foreground)]"
        style={{ left: `${Math.min(100, fair * 100)}%` }}
        title="An even share"
      />
    </div>
  );
}

/**
 * The worked example, read-only: the same split the live tool runs, on a
 * fixed household, so nothing lands in your own fields or storage.
 */
function ChoresExample() {
  const ex = CHORES_EXAMPLE;
  const read = readChores(ex);
  const headline = choresHeadline(ex, read);
  if (!read || !headline) return null;
  const [alex, sam] = read.people;
  const nowTotal = (alex.nowMinutes ?? 0) + (sam.nowMinutes ?? 0);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Alex and Sam never divided the chores. Alex liked cooking, so Alex
        cooked, and the rest followed the cook. Sam did the laundry and the
        bins and felt that was about half. Listed, with times, Alex was doing{" "}
        {pct((alex.nowMinutes ?? 0) / nowTotal)} of the{" "}
        {formatMinutes(read.totalMinutes)}{" "}a week, including the bills and
        birthdays nobody had counted.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        Then they rated each chore. Sam would rather not cook and hates the food
        shop; Alex hates hoovering and minds washing up. They both hate the
        bathroom, so they take turns on it.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The split</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">{headline}</p>
        <ul className="mt-3 space-y-1.5 text-sm text-[var(--foreground)] leading-relaxed">
          {read.people.map((p) => (
            <li key={p.id}>
              <span className="font-medium">{p.name}:</span> {p.owns.join(", ").toLowerCase()} (
              {formatMinutes(p.minutes)} a week)
            </li>
          ))}
          <li>
            <span className="font-medium">Taking turns:</span> {read.turns.join(", ").toLowerCase()}
          </li>
        </ul>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          By the clock it&rsquo;s now close to even. By their own ratings, each
          does under a third of the housework, because each hands the other the
          chores they mind and takes the ones they don&rsquo;t.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own list below is untouched. Run it on <em>your</em>{" "}house.
      </p>
    </div>
  );
}
