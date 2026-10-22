"use client";

import ClearCallButton from "../components/ClearCallButton";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import AnnounceAnswer from "../components/AnnounceAnswer";
import {
  BLANK_SCAM,
  SCAM_EXAMPLE,
  checkWay,
  parseScamInputs,
  readScam,
  scamHeadline,
  scamRule,
  scamSay,
  scamSummary,
  undoSteps,
  type Ask,
  type Done,
  type Pay,
  type Push,
  type ScamInputs,
  type ScamRead,
  type Start,
  type Tell,
  type Who,
} from "../data/scam";

/**
 * Is it real? Before you pay, click or reply (/scam)
 *
 * The instrument for the message or call that wants something now. People
 * judge these by how they look, and how they look is the one thing a scammer
 * controls (Take Five, 2018: 80% thought they could spot one, 9% aced the
 * quiz). So the read judges what's costly to fake instead: who started the
 * contact, what it asks for, how it wants paying, and what's pushing you
 * (Stajano and Wilson, 2011; Kircanski et al., 2018). It ends in the check a
 * scammer can't fake, contacting them yourself, and the words to end the call,
 * or, if you've already acted, the steps for the first hour.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser. The logic lives
 * in `app/data/scam.ts` so it can be checked without a browser.
 */

const STORE_KEY = "scam:v1";

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
const link = "text-[var(--accent)] hover:opacity-70 transition-opacity";

function loadInputs(): ScamInputs {
  if (typeof window === "undefined") return BLANK_SCAM;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    return raw ? parseScamInputs(JSON.parse(raw)) : BLANK_SCAM;
  } catch {
    return BLANK_SCAM;
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
  label,
  cols = 2,
}: {
  value: T;
  options: { id: T; label: string }[];
  onPick: (v: T) => void;
  label: string;
  cols?: 1 | 2;
}) {
  const grid = cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
  return (
    <div role="group" aria-label={label} className={`grid ${grid} gap-2`}>
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

/** A row of answers where any number can be on. */
function Toggles<T extends string>({
  values,
  options,
  onToggle,
  label,
}: {
  values: T[];
  options: { id: T; label: string }[];
  onToggle: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {options.map((o) => {
        const on = values.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o.id)}
            className={`${chipBase} ${on ? chipOn : chipOff}`}
          >
            <span aria-hidden="true">{on ? "✓ " : ""}</span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ScamClient() {
  const [inp, setInp] = useState<ScamInputs>(BLANK_SCAM);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    const loaded = loadInputs();
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.what.trim();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage and the URL; intentionally synchronous on mount. */
    setInp(seeded ? { ...loaded, what: carried } : loaded);
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

  const set = <K extends keyof ScamInputs>(k: K, v: ScamInputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));
  const toggle = <K extends "asks" | "pushes">(k: K, v: ScamInputs[K][number]) =>
    setInp((prev) => {
      const list = prev[k] as string[];
      const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
      return { ...prev, [k]: next };
    });

  const read = useMemo(() => readScam(inp), [inp]);
  const acted = inp.done !== "" && inp.done !== "no";

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
        {showExample ? <ScamExample /> : null}
      </div>

      {/* ---- First: already acted? ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className={eyebrow}>First</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">
          Have you already done what it asked?
        </p>
        <Chips<Done>
          label="Whether you've already acted"
          value={inp.done}
          onPick={(v) => set("done", v)}
          cols={1}
          options={[
            { id: "no", label: "No, not yet" },
            { id: "paid", label: "Yes, I've paid or sent money" },
            { id: "told", label: "Yes, I've given a code, a password or card details" },
            { id: "installed", label: "Yes, I've installed something or let them see my screen" },
          ]}
        />
        {acted ? (
          <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
            The steps are below. Do them before anything else; the rest of
            the questions can wait.
          </p>
        ) : null}
      </div>

      {/* ---- What it is ---- */}
      <div className={card}>
        <label htmlFor="scam-what" className={`block ${eyebrow} mb-2`}>
          What came in?
        </label>
        <input
          id="scam-what"
          type="text"
          value={inp.what}
          onChange={(e) => set("what", e.target.value)}
          placeholder="e.g. a text saying my parcel is held for a £1.45 fee"
          className={inputClass}
        />
        <p className="mt-1.5 text-xs text-[var(--muted)] leading-relaxed">
          A few words, in your own words. Don&rsquo;t paste in codes or
          account numbers.
        </p>
        <CarriedNote
          show={carriedSeed !== "" && inp.what.trim() === carriedSeed}
          onClear={() => {
            set("what", "");
            setCarriedSeed("");
          }}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Who does it say it&rsquo;s from?</p>
        <Chips<Who>
          label="Who it says it's from"
          value={inp.who}
          onPick={(v) => set("who", v)}
          options={[
            { id: "bank", label: "My bank or card company" },
            { id: "family", label: "Family or a friend" },
            { id: "company", label: "A company: delivery, shop, phone, energy" },
            { id: "official", label: "Tax office, police, court, council" },
            { id: "deal", label: "A buyer, seller or landlord online" },
            { id: "job", label: "An employer or recruiter" },
            { id: "invest", label: "An investment or crypto opportunity" },
            { id: "tech", label: "Tech support or a virus warning" },
            { id: "other", label: "Someone else" },
          ]}
        />
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">Who started it?</p>
        <Chips<Start>
          label="Who started the contact"
          value={inp.start}
          onPick={(v) => set("start", v)}
          cols={1}
          options={[
            { id: "them", label: "They did: a call, text, email or message out of the blue" },
            { id: "link", label: "I did, but on a number or link from a message, an ad or a search" },
            { id: "me", label: "I did, on details I found myself: the app, my card, a bill" },
          ]}
        />
      </div>

      {/* ---- What it wants ---- */}
      <div className={card}>
        <p className={eyebrow}>What it wants</p>
        <p className="mt-3 text-sm text-[var(--foreground)] mb-2">
          What does it ask you to do? Pick any that fit.
        </p>
        <Toggles<Ask>
          label="What it asks you to do"
          values={inp.asks}
          onToggle={(v) => toggle("asks", v)}
          options={[
            { id: "money", label: "Pay, or move money" },
            { id: "code", label: "Read out or forward a code they sent" },
            { id: "login", label: "Sign in or pay through a link" },
            { id: "details", label: "Give personal or card details" },
            { id: "remote", label: "Install an app, or share my screen" },
          ]}
        />
        {inp.asks.includes("money") ? (
          <>
            <p className="mt-5 text-sm text-[var(--foreground)] mb-2">How does it want paying?</p>
            <Chips<Pay>
              label="How it wants paying"
              value={inp.pay}
              onPick={(v) => set("pay", v)}
              options={[
                { id: "card", label: "By card, or the site's own checkout" },
                { id: "transfer", label: "Bank transfer, to an account it names" },
                { id: "app", label: "A payment app (PayPal friends, Zelle, Venmo)" },
                { id: "gift", label: "Gift cards" },
                { id: "crypto", label: "Crypto, or a crypto machine" },
                { id: "cash", label: "Cash, handed over or collected" },
              ]}
            />
          </>
        ) : null}
        <p className="mt-5 text-sm text-[var(--foreground)] mb-2">
          What&rsquo;s pushing you? Pick any that fit.
        </p>
        <Toggles<Push>
          label="What's pushing you"
          values={inp.pushes}
          onToggle={(v) => toggle("pushes", v)}
          options={[
            { id: "rush", label: "A deadline: today, within the hour" },
            { id: "threat", label: "A threat: a fine, arrest, an account closed" },
            { id: "prize", label: "A windfall: a refund, a prize, a sure return" },
            { id: "secret", label: "Keep it quiet: don't tell the bank or family" },
            { id: "stay", label: "Don't hang up, or stay in the chat" },
          ]}
        />
      </div>

      {/* ---- The read ---- */}
      <AnnounceAnswer message={read ? scamHeadline(inp, read) : null} />
      {read ? (
        <ReadBlock inp={inp} read={read} />
      ) : (
        <div className={card}>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Say who it claims to be from and who started it, and the read
            appears: stop, check it another way, or go ahead, with the check
            to make and the words to say.
          </p>
        </div>
      )}
      <ClearCallButton
        storeKey={STORE_KEY}
        onReset={() => {
          setInp(BLANK_SCAM);
          setCarriedSeed("");
        }}
      />
    </div>
  );
}

function TellList({ tells }: { tells: Tell[] }) {
  return (
    <>
      {tells.map((t) => (
        <p key={t.id} className="pl-3 border-l-2 border-[var(--accent)]">
          <span className="font-medium">{t.head}</span> {t.body}
        </p>
      ))}
    </>
  );
}

function ReadBlock({ inp, read }: { inp: ScamInputs; read: ScamRead }) {
  const [copied, setCopied] = useState<"" | "say" | "line" | "all" | "no">("");
  const rule = scamRule();
  const say = scamSay(inp);
  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className={eyebrow}>The read</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {scamHeadline(inp, read)}
      </p>

      {read.kind === "undo" ? (
        <ol className="mt-4 space-y-3 text-sm text-[var(--foreground)] leading-relaxed list-decimal pl-5">
          {undoSteps(inp).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      ) : (
        <div className="mt-4 text-sm text-[var(--foreground)] leading-relaxed space-y-3">
          <ReadBody inp={inp} read={read} />
          {read.red.length > 0 ? <TellList tells={read.red} /> : null}
          {read.amber.length > 0 ? (
            <>
              {read.red.length > 0 ? (
                <p className="pt-1 text-[var(--muted)]">And what made it feel urgent:</p>
              ) : null}
              <TellList tells={read.amber} />
            </>
          ) : null}
        </div>
      )}

      {read.kind === "undo" ? (
        <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
          It happens to careful, clever people, because it&rsquo;s built to.
          Telling the bank fast matters more than anything else on this page.
        </p>
      ) : null}

      {read.kind !== "go" && read.kind !== "undo" ? (
        <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
          <p className={eyebrow}>The check they can&rsquo;t fake</p>
          <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{checkWay(inp.who)}</p>
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <p className={eyebrow}>What to say</p>
            <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{say}</p>
            <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
              Then end it. You don&rsquo;t owe a reason, and a real caller
              won&rsquo;t argue with you checking.
            </p>
            <button
              type="button"
              onClick={async () => setCopied((await copyText(say)) ? "say" : "no")}
              className="mt-3 text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
            >
              {copied === "say" ? "Copied" : "Copy the words"}
            </button>
          </div>
        </div>
      ) : null}

      <ClueSort />

      <div className="mt-5 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>Your line, to keep</p>
        <p className="mt-2 text-base leading-relaxed text-[var(--foreground)]">{rule}</p>
        <p className="mt-3 text-xs text-[var(--muted)] leading-relaxed">
          The next one will arrive on a busy day, sounding calm and official.
          A line decided now means you don&rsquo;t have to judge it then.
          Worth sending to someone you&rsquo;d want to have it too.
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
            onClick={async () => setCopied((await copyText(scamSummary(inp, read))) ? "all" : "no")}
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            {copied === "all" ? "Copied the whole read" : "Copy the whole read as text"}
          </button>
        </div>
        {copied === "no" ? (
          <p className="mt-2 text-xs text-[var(--muted)]">
            Couldn&rsquo;t copy. Select the words above instead.
          </p>
        ) : null}
      </div>
      <Handoffs inp={inp} read={read} />
    </div>
  );
}

function ReadBody({ inp, read }: { inp: ScamInputs; read: ScamRead }) {
  switch (read.kind) {
    case "undo":
      return null;
    case "stop":
      return (
        <p>
          {read.red.length === 1 ? "One thing in it settles it" : "Several things in it settle it"}
          , whatever it looks like and however much it knows about you. Real
          banks, companies, offices and relatives don&rsquo;t ask this way, so
          there&rsquo;s nothing to weigh. Don&rsquo;t pay, don&rsquo;t read
          anything out, and end the call or close the message. If some part
          of you still wonders whether it was real, check it the way below:
          if it was, it&rsquo;ll still be there.
        </p>
      );
    case "check":
      return (
        <p>
          Nothing in it settles it either way, and that&rsquo;s normal: most
          scams look exactly like the real thing. So don&rsquo;t try to decide
          from inside the message.{" "}
          {inp.start === "link"
            ? "The number or link you used came from them, so it checks nothing."
            : "It came to you, so anything in it, the number, the link, the name, is theirs to choose."}{" "}
          Contact them yourself, on details you found yourself. If it&rsquo;s
          real, you lose ten minutes. If it isn&rsquo;t, you&rsquo;ve lost
          nothing at all.
        </p>
      );
    case "wait":
      return (
        <p>
          It hasn&rsquo;t asked for anything yet, which often means it&rsquo;s
          testing whether the number is live, or warming up. Don&rsquo;t reply,
          even to say stop, and don&rsquo;t use its links. If you think it
          might be about something real, check it the way below.
        </p>
      );
    case "go":
      return (
        <p>
          You reached them on details you found yourself, and nothing it asks
          is a way scammers ask. That&rsquo;s as good a check as there is.
          {payPhrase(inp)}
        </p>
      );
  }
}

function payPhrase(inp: ScamInputs): string {
  if (!inp.asks.includes("money")) return "";
  if (inp.pay === "transfer" || inp.pay === "app")
    return " If you can, pay by card rather than a transfer or a payment app: a card payment can be disputed if something goes wrong, and a transfer usually can't.";
  return "";
}

/** The essay's one idea, small enough to sit under every read. */
function ClueSort() {
  return (
    <div className="mt-5 rounded-lg border border-[var(--border)] p-4">
      <p className={eyebrow}>What tells you something, and what doesn&rsquo;t</p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm leading-relaxed">
        <div>
          <p className="font-medium text-[var(--foreground)]">Costs them nothing to fake</p>
          <ul className="mt-1.5 space-y-1 text-[var(--muted)]">
            <li>The logo, the layout, the polite tone</li>
            <li>The name or number on your screen</li>
            <li>Knowing your name, address or card digits</li>
            <li>A small amount, or a familiar voice</li>
          </ul>
        </div>
        <div>
          <p className="font-medium text-[var(--foreground)]">Hard for them to hide</p>
          <ul className="mt-1.5 space-y-1 text-[var(--muted)]">
            <li>That they started it</li>
            <li>What they need you to do, and how fast</li>
            <li>How they want paying</li>
            <li>That you mustn&rsquo;t check or tell anyone</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

type Handoff = { href: string; label: string; note: string };

function Handoffs({ inp, read }: { inp: ScamInputs; read: ScamRead }) {
  const s = inp.what;
  const list: Handoff[] = [];
  if (inp.who === "family" && inp.asks.includes("money") && read.kind !== "undo") {
    list.push({
      href: withSubject("/lend", s),
      label: "If it really is them",
      note: "Once you've reached them on the number you know, a loan to someone close is its own call: lend it, give it, or say no?",
    });
  }
  if (inp.pushes.some((p) => p === "rush" || p === "threat" || p === "prize")) {
    list.push({
      href: withSubject("/cool", s),
      label: "Decide it cold",
      note: "The clock was the point. If you're still shaken, settle whether this needs deciding today at all.",
    });
  }
  list.push({
    href: withSubject("/rule", s),
    label: "Make it a standing rule",
    note: "There'll be another one next month. Decide your line once, so you never have to judge one on the spot.",
  });
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
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        More on why this works:{" "}
        <Link href="/writing/judge-the-ask-not-the-look" className={link}>
          Judge the ask, not the look
        </Link>
        .
      </p>
    </div>
  );
}

/**
 * The worked example, read-only. Runs the same read the live tool does on a
 * fixed case, so a newcomer sees a finished pass without anything landing in
 * their own fields or storage.
 */
function ScamExample() {
  const ex = SCAM_EXAMPLE;
  const read = readScam(ex);
  if (!read) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        A text from my bank asked whether I&rsquo;d made a £1,280 payment to
        a shop I&rsquo;d never heard of. A minute later my phone rang, and the
        screen showed the bank&rsquo;s own number. A calm woman from the fraud
        team knew my name and the last four digits of my card.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        She said my account had been compromised, possibly by someone inside
        the bank, so I mustn&rsquo;t mention it at the branch. To protect my
        savings I needed to move them to a safe account today, and read her
        the code the bank was about to text me.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className={eyebrow}>The read</p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {scamHeadline(ex, read)}
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          Everything I&rsquo;d been checking (the number, my card digits, how
          calm she was) was the part that costs nothing to fake. The three
          things that settled it were the code, the safe account and the
          secret. I said I&rsquo;d call back, hung up, and rang the number on
          my card from my partner&rsquo;s phone. There was no payment, and no
          fraud team had called.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank. Run it on <em>your</em>{" "}message.
      </p>
    </div>
  );
}
