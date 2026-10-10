"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import {
  BLANK_LATER,
  LATER_EXAMPLE,
  askName,
  formatHours,
  hiddenShare,
  hoursInDays,
  hoursInvalid,
  isPressure,
  laterHeadline,
  laterSummary,
  parseLaterInputs,
  readLater,
  replyText,
  totalHours,
  type Exit,
  type LaterInputs,
  type LaterRead,
  type NextWeek,
  type Reason,
  type When,
} from "../data/later";

/**
 * If it were next week (/later)
 *
 * The instrument for a request that lands a good way off: a talk, a committee
 * seat, a favour, a trip. Yes is easy because the cost falls on a future week
 * that looks empty from here (Zauberman and Lynch's "future time slack"), and
 * because far-off plans get judged on how good they'd be, not how they'd fit
 * (Liberman and Trope). The tool moves the ask into the near view (real hours,
 * then "if it were next week?") and ends in a reply the person can send.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/later.ts` so it can be checked without a browser.
 */

const STORE_KEY = "later:v1";

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase =
  "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff =
  "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";
const eyebrow =
  "text-xs font-semibold uppercase tracking-widest text-[var(--muted)]";
const card =
  "mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6";

function loadInputs(): LaterInputs {
  if (typeof window === "undefined") return BLANK_LATER;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseLaterInputs(JSON.parse(raw)) : BLANK_LATER;
  } catch {
    return BLANK_LATER;
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

/** A row of mutually exclusive answers. */
function Chips<T extends string>({
  value,
  options,
  onPick,
  cols = 3,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onPick: (v: T) => void;
  cols?: 2 | 3;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`grid grid-cols-1 ${cols === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2`}
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onPick(o.id)}
          className={`${chipBase} ${value === o.id ? chipOn : chipOff}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** An hours field that says so under itself when it can't read the input. */
function HoursField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const bad = hoursInvalid(value);
  return (
    <div>
      <label htmlFor={id} className="block text-sm text-[var(--muted)] mb-1.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={bad || undefined}
        aria-describedby={bad ? `${id}-bad` : undefined}
        className={inputClass}
      />
      {bad ? (
        <p id={`${id}-bad`} className="mt-1.5 text-xs text-[var(--muted)]">
          Type hours as a number, like 3 or 1.5, or minutes, like 90 min.
        </p>
      ) : null}
    </div>
  );
}

const WHEN_OPTIONS: { id: When; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "weeks", label: "In a few weeks" },
  { id: "months", label: "In a few months" },
  { id: "far", label: "Half a year or more" },
];

const REASON_OPTIONS: { id: Reason; label: string }[] = [
  { id: "want", label: "I'd genuinely enjoy it" },
  { id: "useful", label: "It'd be good for my work or for someone I care about" },
  { id: "guilt", label: "I'd feel bad saying no" },
  { id: "flattered", label: "It's flattering to be asked" },
  { id: "owe", label: "I owe them one" },
];

export default function LaterClient() {
  const [inp, setInp] = useState<LaterInputs>(BLANK_LATER);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    const loaded = loadInputs();
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.ask.trim();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage and the URL; intentionally synchronous on mount. */
    setInp(seeded ? { ...loaded, ask: carried } : loaded);
    setHydrated(true);
    if (seeded) setCarriedSeed(carried);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (carried) clearCarriedSubject();
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(inp));
    } catch {
      /* storage full or blocked — the tool still works, just won't persist */
    }
  }, [inp, hydrated]);

  const set = <K extends keyof LaterInputs>(k: K, v: LaterInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const read = useMemo(() => readLater(inp), [inp]);
  const hours = totalHours(inp);
  const days = hoursInDays(hours.total);
  const hidden = hiddenShare(hours);

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
        {showExample ? <LaterExample /> : null}
      </div>

      {/* ---- The ask ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label htmlFor="later-ask" className={`block ${eyebrow} mb-2`}>
          What have you been asked to do?
        </label>
        <input
          id="later-ask"
          type="text"
          value={inp.ask}
          onChange={(e) => set("ask", e.target.value)}
          placeholder="e.g. Give a talk at the regional meetup in October"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.ask.trim() === carriedSeed}
          onClear={() => {
            set("ask", "");
            setCarriedSeed("");
          }}
        />
        <label htmlFor="later-who" className="mt-4 block text-sm text-[var(--muted)] mb-1.5">
          Who&rsquo;s asking? <span className="opacity-70">(optional)</span>
        </label>
        <input
          id="later-who"
          type="text"
          value={inp.who}
          onChange={(e) => set("who", e.target.value)}
          placeholder="e.g. A friend from my old job"
          className={inputClass}
        />
        <p className="mt-4 text-sm text-[var(--foreground)] mb-2">When is it?</p>
        <Chips<When>
          label="When is it?"
          value={inp.when}
          onPick={(v) => set("when", v)}
          cols={2}
          options={WHEN_OPTIONS}
        />
        {inp.when === "week" ? (
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            Then you&rsquo;re already seeing it up close, which is the point of this
            tool. Answer on the week you actually have.
          </p>
        ) : null}
      </div>

      {/* ---- Step 1: the real hours ---- */}
      <div className={card}>
        <p className={eyebrow}>The real cost, in hours</p>
        <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
          From far away, a thing is just its headline: a 45-minute talk, one
          evening. Count everything it takes. Leave a box blank if it doesn&rsquo;t
          apply.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <HoursField
            id="later-h-event"
            label="The thing itself"
            value={inp.hoursEvent}
            onChange={(v) => set("hoursEvent", v)}
            placeholder="e.g. 3"
          />
          <HoursField
            id="later-h-prep"
            label="Preparing for it"
            value={inp.hoursPrep}
            onChange={(v) => set("hoursPrep", v)}
            placeholder="e.g. 10"
          />
          <HoursField
            id="later-h-travel"
            label="Getting there and back"
            value={inp.hoursTravel}
            onChange={(v) => set("hoursTravel", v)}
            placeholder="e.g. 2"
          />
          <HoursField
            id="later-h-after"
            label="Recovering, following up"
            value={inp.hoursAfter}
            onChange={(v) => set("hoursAfter", v)}
            placeholder="e.g. 1"
          />
        </div>
        {hours.total > 0 ? (
          <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
            That&rsquo;s{" "}
            <span className="font-semibold">{formatHours(hours.total)}</span>
            {days ? <>, {days}</> : null}.
            {hidden !== null && hidden >= 0.5 ? (
              <>
                {" "}
                {Math.round(hidden * 100)}% of it is the part nobody puts in the
                invitation.
              </>
            ) : null}
          </p>
        ) : null}
        <label htmlFor="later-displaces" className="mt-5 block text-sm text-[var(--muted)] mb-1.5">
          Those hours have to come out of something. What?
        </label>
        <input
          id="later-displaces"
          type="text"
          value={inp.displaces}
          onChange={(e) => set("displaces", e.target.value)}
          placeholder="e.g. Two evenings and a Saturday with the kids"
          className={inputClass}
        />
      </div>

      {/* ---- Step 2: the next-week test ---- */}
      <div className={card}>
        <p className={eyebrow}>The next-week test</p>
        <p className="mt-2 mb-4 text-sm text-[var(--foreground)] leading-relaxed">
          Now picture it landing <span className="font-medium">next week</span>, not
          the week you&rsquo;ve been imagining. Next week as it really is, with
          everything already in it
          {hours.total > 0 ? <>, and {formatHours(hours.total)} to clear for this</> : null}
          {inp.displaces.trim() ? <>, taken from <em>{lowerStart(inp.displaces)}</em></> : null}.
          Would you say yes?
        </p>
        <p className="-mt-2 mb-4 text-xs text-[var(--muted)] leading-relaxed">
          If it needs months of lead time (a race, a speech, a big trip), picture
          the first week of preparation landing next week instead.
        </p>
        <Chips<NextWeek>
          label="If it were next week, would you say yes?"
          value={inp.nextWeek}
          onPick={(v) => set("nextWeek", v)}
          options={[
            { id: "yes", label: "Yes, I'd clear the space" },
            { id: "grudging", label: "Only grudgingly" },
            { id: "no", label: "No" },
          ]}
        />
      </div>

      {/* ---- Step 3: why yes is tempting ---- */}
      {inp.nextWeek === "yes" || inp.nextWeek === "grudging" ? (
        <div className={card}>
          <p className={eyebrow}>Why say yes?</p>
          <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
            Pick the reason that&rsquo;s doing most of the work, not the one that
            sounds best.
          </p>
          <Chips<Reason>
            label="What's the main reason to say yes?"
            value={inp.reason}
            onPick={(v) => set("reason", v)}
            cols={2}
            options={REASON_OPTIONS}
          />
          <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
            If you said yes and wanted out later, how hard would that be?
          </p>
          <Chips<Exit>
            label="If you said yes and wanted out later, how hard would that be?"
            value={inp.exit}
            onPick={(v) => set("exit", v)}
            options={[
              { id: "easy", label: "Easy, nobody's relying on me" },
              { id: "awkward", label: "Awkward, but possible" },
              { id: "stuck", label: "Others would plan around me" },
            ]}
          />
        </div>
      ) : null}

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? laterHeadline(read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} set={set} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Answer the questions above and the read appears: a yes, a no, a smaller
            yes, or a no you&rsquo;re finding hard to say, with a reply you can send.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_LATER);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function lowerStart(raw: string): string {
  const s = raw.trim().replace(/[.!\s]+$/, "");
  return /^[A-Z][a-z]/.test(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

type Setter = <K extends keyof LaterInputs>(k: K, v: LaterInputs[K]) => void;

function ReadBlock({
  inp,
  read,
  set,
}: {
  inp: LaterInputs;
  read: LaterRead;
  set: Setter;
}) {
  const [copied, setCopied] = useState<"" | "reply" | "all" | "no">("");
  const reply = replyText(inp, read);
  const needsSmaller = read.kind === "smaller" || read.kind === "pressure";
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {laterHeadline(read)}
      </p>
      <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
        <ReadBody inp={inp} read={read} />
      </div>

      {needsSmaller ? (
        <div className="mt-5">
          <label htmlFor="later-smaller" className="block text-sm text-[var(--foreground)] mb-1.5">
            {read.kind === "smaller"
              ? "What's a version you'd do next week without resenting it?"
              : "Is there a smaller thing you'd happily offer instead? (optional)"}
          </label>
          <input
            id="later-smaller"
            type="text"
            value={inp.smaller}
            onChange={(e) => {
              set("smaller", e.target.value);
              setCopied("");
            }}
            placeholder="e.g. A ten-minute slot instead of the full talk"
            className={inputClass}
          />
        </div>
      ) : null}

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>A reply you can send</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{reply}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          Short on purpose. A no that explains too much reads like an opening for
          a counter-offer. Change the words to sound like you, and send it today,
          while it&rsquo;s still easy for them to ask someone else.
        </p>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={async () => setCopied((await copyText(reply)) ? "reply" : "no")}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "reply" ? "Copied the reply" : "Copy the reply"}
          </button>
          <button
            type="button"
            onClick={async () =>
              setCopied((await copyText(laterSummary(inp, read))) ? "all" : "no")
            }
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "all" ? "Copied the whole read" : "Copy the whole read as text"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Couldn&rsquo;t copy. Select the reply above instead.
          </p>
        ) : null}
      </div>
      <Handoffs inp={inp} read={read} />
    </div>
  );
}

function ReadBody({ inp, read }: { inp: LaterInputs; read: LaterRead }) {
  const ask = askName(inp);
  const h = totalHours(inp);
  const cost = h.total > 0 ? formatHours(h.total) : null;
  switch (read.kind) {
    case "yes":
      return (
        <>
          <p>
            You&rsquo;d make room for {ask}{" "}even out of the week you actually
            have, so the distance isn&rsquo;t what&rsquo;s saying yes.
            {isPressure(inp.reason) ? (
              <>
                {" "}It&rsquo;s more a debt you&rsquo;re willing to pay than a
                treat, and that&rsquo;s a fine reason. Just count it as one.
              </>
            ) : null}
          </p>
          <p>
            The one thing the far-off view still gets wrong is the prep. Put{" "}
            {cost ? <>all {cost}</> : <>the preparation, not just the day,</>}{" "}in
            your calendar now, in blocks with dates, or it will be squeezed into
            the two evenings before.
          </p>
          {inp.exit === "stuck" ? (
            <p className="text-[var(--muted)]">
              Others will plan around this, so treat the yes as fixed. If
              there&rsquo;s a reason you might pull out, say it now, not in the
              last week.
            </p>
          ) : null}
        </>
      );
    case "no":
      return (
        <>
          <p>
            If you wouldn&rsquo;t do {ask}{" "}next week, the only thing making it a
            yes is that it&rsquo;s far away. That week will be as full as this one
            when it comes. People expect to have more spare time in the future
            than they do now, and the gap is wider for time than for money.
          </p>
          <p>
            So say no now, while it&rsquo;s cheap. It&rsquo;s cheaper for them too:
            they have months to find someone else, not days. And it&rsquo;s likely
            to land better than you fear. In a set of studies of declined
            invitations, the people turned down were less upset than the
            people declining expected them to be.
          </p>
          {inp.exit === "stuck" ? (
            <p className="text-[var(--muted)]">
              You said others would plan around you. That&rsquo;s the strongest
              reason of all to decline today rather than drop out later.
            </p>
          ) : null}
        </>
      );
    case "smaller":
      return (
        <>
          <p>
            You want this, or it&rsquo;d be useful, but not at its full size: up
            close, {cost ? <>{cost}</> : <>the whole of it</>}{" "}is more than
            you&rsquo;d give it. That&rsquo;s the most common honest answer to a
            far-off ask, and the usual mistake is to round it up to a full yes.
          </p>
          <p>
            Offer the part you&rsquo;d do next week without resenting it: a shorter
            slot, one meeting instead of the series, help on the day but not the
            planning. A clear smaller yes is worth more to the person asking than
            a full yes you deliver tired.
          </p>
        </>
      );
    case "pressure": {
      const why =
        inp.reason === "guilt"
          ? "the discomfort of saying no"
          : inp.reason === "flattered"
            ? "the pleasure of being asked"
            : "a sense that you owe them";
      return (
        <>
          <p>
            Up close, you&rsquo;d do it grudgingly, and what&rsquo;s pulling you
            toward yes is {why}. That feeling is real, but it&rsquo;s a feeling
            about <em>today&rsquo;s</em>{" "}conversation. The cost
            {cost ? <> ({cost})</> : null}{" "}lands on a future week, which is why
            it&rsquo;s so easy to pay with.
          </p>
          <p>
            {inp.reason === "owe"
              ? "If you do owe them, repay it with something you'd choose to give. A grudging yes is a poor way to settle a debt."
              : "Decline, or offer something smaller that you'd give gladly. The person asking is usually less hurt by a no than you expect. They tend to think about why you said it more than about the no itself."}
          </p>
        </>
      );
    }
  }
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: LaterInputs; read: LaterRead }) {
  const s = inp.ask;
  const list: Handoff[] = [];
  switch (read.kind) {
    case "yes":
    case "smaller":
      list.push({
        href: withSubject("/act", s),
        label: "Block the prep now",
        note: "Name the first piece of preparation and the exact slot it goes in, so it doesn't all land the night before.",
      });
      break;
    case "no":
    case "pressure":
      list.push({
        href: withSubject("/rule", s),
        label: "Asked this kind of thing often?",
        note: "If these requests keep coming, decide once: a rule like “one talk a quarter” answers the next one before the guilt does.",
      });
      break;
  }
  if (read.kind === "yes" && inp.when !== "week") {
    list.push({
      href: withSubject("/outside", s),
      label: "Check the prep estimate",
      note: "Prep time is the number people get most wrong. Set yours against how long it took last time.",
    });
  }
  return (
    <div className="mt-5 pt-5 border-t border-[var(--border)]">
      <p className={eyebrow}>Where to take it next</p>
      <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
        {list.map((h) => (
          <li key={h.href}>
            <Link
              href={h.href}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              {h.label} →
            </Link>{" "}
            {h.note}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The worked example, read-only. Runs the same read the live tool does on a
 * fixed case, so a newcomer sees a finished pass without anything landing in
 * their own fields or storage.
 */
function LaterExample() {
  const ex = LATER_EXAMPLE;
  const read = readLater(ex);
  if (!read) return null;
  const h = totalHours(ex);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        In June, an organiser I&rsquo;d met once asked me to{" "}
        {askName(ex)}. October looked empty, it was nice to be asked, and I
        nearly said yes on the spot.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        The talk is 45 minutes. Counted properly, it&rsquo;s {formatHours(h.event)}{" "}on
        the evening, {formatHours(h.prep)}{" "}of preparation and {formatHours(h.travel)}{" "}
        getting there: {formatHours(h.total)}, {hoursInDays(h.total)}, taken from{" "}
        {lowerStart(ex.displaces)}. If it were next week? Only grudgingly. And
        the honest reason I wanted to say yes was that it was flattering to be asked.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {laterHeadline(read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          So I sent this the same day:
        </p>
        <p className="mt-2 text-base leading-snug text-[var(--foreground)]">
          {replyText(ex, read)}
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}ask.
      </p>
    </div>
  );
}
