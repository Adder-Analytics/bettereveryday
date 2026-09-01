"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import PrintButton from "../components/PrintButton";

/**
 * Can you survive the worst case? (/ruin)
 *
 * The survivability gate — the one instrument that runs the check every
 * quantitative tool on the site quietly defers to. The flip point (/weigh) finds
 * the probability where a call tips; the value-of-information test (/enough) asks
 * whether a fact would move a fixed choice; the expected-value model sums
 * probability times magnitude. Every one of them ends with the same caveat, in
 * almost the same words: "one caveat overrides the whole calculation — expected
 * value assumes you survive to keep playing, so against a downside you can't
 * recover from, the average is a lie and margin of safety wins." That caveat had
 * no home. This tool is its home.
 *
 * The core distinction is loss vs. ruin. A loss is recoverable — you take a hit
 * and you're still in the game. A ruin is an absorbing barrier (Taleb): there's
 * no coming back, so the odds and the upside stop mattering, because there's no
 * "on average" for someone who's out of the game. Buffett's rule 1 ("never lose
 * money") means never the ruinous kind; Taleb's "never cross a river that's four
 * feet deep on average" is the same point; Ole Peters' ergodicity makes it
 * formal — the ensemble average (what happens across many people) diverges from
 * the time average (what happens to you, playing repeatedly), and ruin is exactly
 * where they part.
 *
 * The flow refuses the math and keeps the rigor, the site's signature move:
 *   1. Name the decision (carries as the subject across the kit).
 *   2. Name the worst *realistic* outcome — concretely, not the theoretical worst.
 *      Writing it is itself the anti-availability move: people who won't picture
 *      the bad tail are the ones who walk into it.
 *   3. The survival gate: if that outcome happened, where would it leave you?
 *      recover (a loss) / setback (grey zone, maybe) / no return (ruin) / can't
 *      tell. This is the decisive fork.
 *   4. How likely is it, honestly? — used two opposite ways: for a survivable
 *      loss, the odds *decide*; for a ruin, the odds are *confronted* ("probably
 *      fine" is the trap).
 *   5. Once, or repeatedly? — the ergodicity question. A small chance of ruin
 *      taken once may be fine; taken again and again it's a schedule, not a risk.
 *
 * The reads route the position. A survivable loss isn't a ruin problem at all, so
 * it routes *out* to the flip point and the trace — don't let loss-aversion veto
 * a bet you could absorb. A ruin doesn't route to "don't do it" but to *reshape*
 * it: cap the downside below ruin (bet a fraction, keep a floor, hedge, stage) so
 * you'd still be standing after the worst case — that's what margin of safety
 * means here — via /widen and /doors. The grey zone is treated as ruin until a
 * floor is drawn, which is exactly what a /tripwire does. Nothing is sent
 * anywhere; inputs persist in the browser. There's no forecast to log — a
 * survivability check isn't a prediction — only the handoff.
 */

const STORE_KEY = "ruin:v1";

/** Where the worst case would leave you — the decisive fork. */
type Survive = "" | "recover" | "setback" | "noreturn" | "cant";
/** How likely the worst case is, honestly — a band, not a number. */
type Odds = "" | "remote" | "possible" | "real" | "likely";
/** One-time bet, or one you'll face again and again — the ergodicity axis. */
type Repeat = "" | "once" | "often";

type Inputs = {
  /** The decision — carries as the subject on handoffs. */
  decision: string;
  /** The worst realistic outcome, in the person's own words. */
  worst: string;
  /** Where that outcome would leave you. */
  survive: Survive;
  /** How likely it is. */
  odds: Odds;
  /** How often you'll face a bet like this. */
  repeat: Repeat;
};

const BLANK: Inputs = {
  decision: "",
  worst: "",
  survive: "",
  odds: "",
  repeat: "",
};

function isSurvive(v: unknown): v is Survive {
  return (
    v === "" ||
    v === "recover" ||
    v === "setback" ||
    v === "noreturn" ||
    v === "cant"
  );
}
function isOdds(v: unknown): v is Odds {
  return (
    v === "" ||
    v === "remote" ||
    v === "possible" ||
    v === "real" ||
    v === "likely"
  );
}
function isRepeat(v: unknown): v is Repeat {
  return v === "" || v === "once" || v === "often";
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      worst: typeof v.worst === "string" ? v.worst : BLANK.worst,
      survive: isSurvive(v.survive) ? v.survive : BLANK.survive,
      odds: isOdds(v.odds) ? v.odds : BLANK.odds,
      repeat: isRepeat(v.repeat) ? v.repeat : BLANK.repeat,
    };
  } catch {
    return BLANK;
  }
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase =
  "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff =
  "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";

/** How the odds band reads in prose. */
const ODDS_PHRASE: Record<Exclude<Odds, "">, string> = {
  remote: "vanishingly unlikely",
  possible: "possible, but not likely",
  real: "a real chance",
  likely: "more likely than not",
};

export default function RuinClient() {
  const [inp, setInp] = useState<Inputs>(BLANK);
  const [hydrated, setHydrated] = useState(false);
  const [carriedSeed, setCarriedSeed] = useState("");
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    const loaded = loadInputs();
    const carried = readCarriedSubject();
    const seeded = Boolean(carried) && !loaded.decision.trim();
    const next = seeded ? { ...loaded, decision: carried } : loaded;
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from
       browser storage; intentionally synchronous on mount, can't run in render. */
    setInp(next);
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

  const set = <K extends keyof Inputs>(k: K, v: Inputs[K]) =>
    setInp((prev) => ({ ...prev, [k]: v }));

  const decision = inp.decision.trim();
  const worst = inp.worst.trim();

  return (
    <div>
      {/* ---- New here? A read-only worked example ---- */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => setShowExample((s) => !s)}
          className="text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          {showExample
            ? "Hide the worked example ↑"
            : "New here? See a worked example ↓"}
        </button>
        {showExample ? <RuinExample /> : null}
      </div>

      {/* ---- The decision, and the worst realistic outcome ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you weighing?
        </label>
        <input
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Put most of our savings into the new business"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.decision.trim() === carriedSeed}
          onClear={() => {
            set("decision", "");
            setCarriedSeed("");
          }}
        />

        {decision ? (
          <div className="mt-5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
              What&rsquo;s the worst that could realistically happen?
            </label>
            <p className="mb-2 text-sm text-[var(--muted)] leading-relaxed">
              Not the theoretical worst &mdash; a meteor, a once-in-a-century
              crash. The worst <em>plausible</em> outcome, the bad tail you can
              actually picture. Write it concretely: what you&rsquo;d lose, and how
              much.
            </p>
            <textarea
              value={inp.worst}
              onChange={(e) => set("worst", e.target.value)}
              rows={3}
              placeholder="e.g. The business folds, and the whole stake is gone — about two years of savings, including the money that covers us if the car dies or a job ends."
              className={`${inputClass} resize-y`}
            />
          </div>
        ) : null}
      </div>

      {/* ---- The survival gate ---- */}
      {decision && worst ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            If that happened, where would it leave you?
          </p>
          <p className="mb-3 text-sm text-[var(--muted)] leading-relaxed">
            This is the whole question. Not how bad it feels &mdash; whether
            you&rsquo;d come back from it.
          </p>
          <div className="flex flex-col gap-2">
            {(
              [
                [
                  "recover",
                  "I'd take a real hit — but I'd recover",
                  "It would hurt, maybe for a while, but I'd still be standing and able to try again.",
                ],
                [
                  "setback",
                  "It would knock me down hard, and I'm not sure I'd fully come back",
                  "Recovery would be slow and uncertain — the kind of hole you might climb out of, and might not.",
                ],
                [
                  "noreturn",
                  "There'd be no coming back — it's the kind of thing you don't recover from",
                  "It would take out something I can't rebuild, or leave me unable to keep going at all.",
                ],
                [
                  "cant",
                  "Honestly, I can't tell",
                  "I don't know whether that outcome is one I'd recover from or not.",
                ],
              ] as [Survive, string, string][]
            ).map(([val, label, detail]) => (
              <button
                key={val}
                type="button"
                onClick={() => set("survive", inp.survive === val ? "" : val)}
                className={`${chipBase} ${inp.survive === val ? chipOn : chipOff}`}
              >
                <span className="block font-medium">{label}</span>
                <span className="block mt-0.5 text-xs text-[var(--muted)] leading-relaxed">
                  {detail}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ---- Odds + repetition ---- */}
      {decision && worst && inp.survive !== "" ? (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            How likely is that worst case, honestly?
          </p>
          <p className="mb-3 text-sm text-[var(--muted)] leading-relaxed">
            A rough, honest sense &mdash; no number needed. (Watch what you feel
            pulled to click: &ldquo;probably fine&rdquo; is the exact reflex the
            check exists to catch.)
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {(
              [
                ["remote", "Vanishingly unlikely"],
                ["possible", "Possible, but not likely"],
                ["real", "A real chance"],
                ["likely", "More likely than not"],
              ] as [Odds, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => set("odds", inp.odds === val ? "" : val)}
                className={`${chipBase} ${inp.odds === val ? chipOn : chipOff}`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
            Is this a one-time bet, or one you&rsquo;ll face again and again?
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {(
              [
                ["once", "Once — this specific call, this one time"],
                ["often", "I take bets like this repeatedly"],
              ] as [Repeat, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => set("repeat", inp.repeat === val ? "" : val)}
                className={`${chipBase} ${inp.repeat === val ? chipOn : chipOff}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* ---- The read + handoff ---- */}
      <Verdict inp={inp} />
    </div>
  );
}

function Verdict({ inp }: { inp: Inputs }) {
  const decision = inp.decision.trim();
  const worst = inp.worst.trim();
  const subject = inp.decision;

  // ---- Nothing to read yet ----
  if (!decision) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Name the call and the worst that could realistically come of it, and the
          read appears: whether this is a loss you can take &mdash; in which case
          the odds decide &mdash; or a ruin you should refuse and reshape.
        </p>
      </div>
    );
  }

  if (!worst) {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Write the worst realistic outcome above. Naming it plainly is half the
          work &mdash; the outcomes people won&rsquo;t picture are the ones they
          walk into.
        </p>
      </div>
    );
  }

  if (inp.survive === "") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Now the one question that decides everything else: if that worst case
          happened, would you come back from it? Answer it above.
        </p>
      </div>
    );
  }

  if (inp.odds === "" || inp.repeat === "") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Last two: how likely the worst case is, and whether you&rsquo;ll face a
          bet like this once or many times. Then the read turns into the move.
        </p>
      </div>
    );
  }

  return (
    <SurviveRead
      survive={inp.survive}
      odds={inp.odds}
      repeat={inp.repeat}
      worst={worst}
      subject={subject}
    />
  );
}

/** A short quotation of the worst case, so the read speaks to the actual outcome. */
function WorstQuote({ worst }: { worst: string }) {
  return (
    <span className="text-[var(--foreground)]">
      &ldquo;{worst.length > 140 ? `${worst.slice(0, 140).trimEnd()}…` : worst}
      &rdquo;
    </span>
  );
}

function SurviveRead({
  survive,
  odds,
  repeat,
  worst,
  subject,
}: {
  survive: Exclude<Survive, "">;
  odds: Exclude<Odds, "">;
  repeat: Exclude<Repeat, "">;
  worst: string;
  subject: string;
}) {
  const oddsPhrase = ODDS_PHRASE[odds];
  const often = repeat === "often";
  const lowOdds = odds === "remote" || odds === "possible";

  // ============ A survivable loss — not a ruin problem at all ============
  if (survive === "recover") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          This is a loss you can take.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The worst case you named &mdash; <WorstQuote worst={worst} /> &mdash; is
          a real hit, but one you&rsquo;d recover from. That changes what kind of
          decision this is. A ruin check exists to catch the outcomes there&rsquo;s
          no coming back from, and this isn&rsquo;t one: you&rsquo;d still be
          standing, still in the game, still able to try again. So this isn&rsquo;t
          a bet to <em>veto</em> on the downside &mdash; it&rsquo;s an ordinary
          risk-and-reward call, and the move is to weigh the odds against the
          stakes, not to freeze.
        </p>
        <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
          The trap on this side is the opposite one: refusing a loss you could
          absorb. Loss aversion makes a recoverable setback <em>feel</em> like
          ruin, and that&rsquo;s how people talk themselves out of good bets
          they&rsquo;d have been glad they took. If you&rsquo;d genuinely recover,
          don&rsquo;t let the flinch make the call.
        </p>
        {odds === "real" || odds === "likely" ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
            One thing to weigh, though: you&rsquo;ve marked the bad case{" "}
            <span className="font-medium">{oddsPhrase}</span>. At those odds
            it isn&rsquo;t really a tail &mdash; it&rsquo;s close to the base case.
            Price the decision around it actually happening, not around the version
            where it doesn&rsquo;t.
          </p>
        ) : null}
        {often ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
            And since you&rsquo;ll take bets like this repeatedly, size each one so
            a bad run can&rsquo;t add up to something you <em>can&rsquo;t</em> take.
            A loss you&rsquo;d shrug off once can still bleed you white if you keep
            taking it at full size &mdash; survivable-per-bet and survivable-in-a-row
            aren&rsquo;t the same test.
          </p>
        ) : null}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            So weigh it, don&rsquo;t fear it
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/weigh", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Find the flip point &rarr;
              </Link>{" "}
              Work out the probability at which acting and not acting break even,
              so all that&rsquo;s left is which side of the line you&rsquo;re on
              &mdash; the right question now that ruin is off the table.
            </li>
            <li>
              <Link
                href={withSubject("/trace", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Trace the downside forward &rarr;
              </Link>{" "}
              Follow the bad case a step or two further &mdash; and then what?
              &mdash; to be sure it really does stay recoverable and doesn&rsquo;t
              cascade into something that isn&rsquo;t.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ============ Ruin — the absorbing barrier ============
  if (survive === "noreturn") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Don&rsquo;t take this bet &mdash; take the version you&rsquo;d survive.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The worst case you named &mdash; <WorstQuote worst={worst} /> &mdash; is
          one there&rsquo;s no coming back from. That single fact overrides
          everything else, and here&rsquo;s the part worth sitting with:{" "}
          <em>the odds don&rsquo;t save you and the upside doesn&rsquo;t pay for
          it.</em> Every expected-value sum, every flip point, every &ldquo;the
          average says go&rdquo; quietly assumes one thing &mdash; that you&rsquo;re
          still around afterward to keep playing. Against an outcome you can&rsquo;t
          recover from, that assumption breaks, and the average becomes a lie.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          It&rsquo;s the oldest rule the people who survive risk for a living all
          share. Taleb: don&rsquo;t cross a river because it&rsquo;s four feet deep{" "}
          <em>on average</em>. Buffett&rsquo;s first rule of investing is just
          &ldquo;never lose money&rdquo; &mdash; meaning never the kind you
          can&rsquo;t come back from. In any strategy that risks ruin, the benefits
          never offset it, because there is no &ldquo;on average&rdquo; for someone
          who&rsquo;s out of the game. First survive; then optimize.
        </p>
        {lowOdds ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            You marked it <span className="font-medium">{oddsPhrase}</span> &mdash;
            and that is exactly the trap. &ldquo;Probably fine&rdquo; is the
            sentence people say on the way into the one outcome they can&rsquo;t
            undo. A small chance of ruin is still ruin: the rare catastrophe only
            has to reach you <em>once</em>, and then there&rsquo;s no next round to
            win it back. Low odds are a reason to feel safe, not to be safe.
          </p>
        ) : (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            And you&rsquo;ve marked it <span className="font-medium">{oddsPhrase}</span>{" "}
            &mdash; a serious likelihood of an outcome you can&rsquo;t come back
            from. That isn&rsquo;t a risk to manage or a number to argue; it&rsquo;s
            one to refuse outright.
          </p>
        )}
        {often ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--foreground)] leading-relaxed">
            And you&rsquo;ll face bets like this again and again &mdash; the
            deadliest shape of all. A one-in-a-hundred chance of ruin sounds
            ignorable, but take that bet weekly and ruin stops being a risk and
            becomes a <em>schedule</em>. Each round looks acceptable on its own;
            the sequence only ends one way. (It&rsquo;s why a single round of
            Russian roulette for a fortune still isn&rsquo;t a deal &mdash; and why
            playing it repeatedly is madness, however good any one pull&rsquo;s
            odds.)
          </p>
        ) : null}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Don&rsquo;t refuse the goal &mdash; refuse this version of it
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
            You almost never have to give up what you&rsquo;re after. You have to
            give up the <em>un-survivable way</em> of getting it. Cap the downside
            below ruin, so even the worst case leaves you standing:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-[var(--muted)] leading-relaxed list-disc pl-5">
            <li>
              <span className="text-[var(--foreground)]">Bet only what you can
              lose in full</span> &mdash; a fraction of the stake, never the whole
              reserve.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Keep a floor you never
              touch</span> &mdash; the runway, the emergency fund, the thing that
              keeps a bad outcome from becoming a final one.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Buy the hedge</span>{" "}
              &mdash; insurance, a fallback, a second option &mdash; that turns a
              catastrophe into a cost.
            </li>
            <li>
              <span className="text-[var(--foreground)]">Stage it</span> &mdash;
              commit in reversible steps instead of one irreversible leap, so no
              single step can end you.
            </li>
          </ul>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
            That&rsquo;s what a margin of safety means here: arranging things so
            that surviving the worst case doesn&rsquo;t depend on the worst case
            not happening.
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/widen", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Find the versions that cap the downside &rarr;
              </Link>{" "}
              The whole point is that there&rsquo;s more than one way to do this.
              Widen the frame until you find the one whose worst case you&rsquo;d
              survive.
            </li>
            <li>
              <Link
                href={withSubject("/doors", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Can you make it staged and reversible? &rarr;
              </Link>{" "}
              Sort whether this has to be one irreversible leap &mdash; and if it
              doesn&rsquo;t, break it into steps no single one of which is fatal.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ============ The grey zone — treat as ruin until floored ============
  if (survive === "setback") {
    return (
      <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The read
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Treat it as ruin until you&rsquo;ve put a floor under it.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          You&rsquo;re in the grey zone: you&rsquo;d <em>probably</em> come back
          from <WorstQuote worst={worst} />, but slowly, and you&rsquo;re not sure
          you fully would. &ldquo;Not sure I&rsquo;d recover&rdquo; sits close
          enough to &ldquo;wouldn&rsquo;t&rdquo; that the safe move is to handle it
          like ruin until you&rsquo;ve capped it. This middle case is the dangerous
          one precisely because it doesn&rsquo;t feel like a cliff &mdash; so
          it&rsquo;s the one people walk off <em>slowly</em>. The business that
          bleeds a little more each month, the debt that creeps, the health cost
          you keep deferring: every step survivable, the sum of them not.
        </p>
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The way to stop that is to convert the fuzzy &ldquo;maybe I&rsquo;d be
          okay&rdquo; into a hard line drawn <em>now</em>, while you&rsquo;re calm:
          the specific point &mdash; a number, a date, a state &mdash; past which
          this stops being recoverable, and which you commit in advance not to
          cross. A line set in the cold light beats a judgement made in the moment,
          when every reason to push a little further will sound convincing.
        </p>
        {lowOdds ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
            Don&rsquo;t let {oddsPhrase === "vanishingly unlikely" ? "the long odds" : "the low odds"}{" "}
            ({oddsPhrase}) talk you out of the floor. A slow ruin arrives
            exactly by way of &ldquo;it probably won&rsquo;t come to that&rdquo; &mdash;
            the line costs nothing if you&rsquo;re right and saves you if
            you&rsquo;re not.
          </p>
        ) : (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
            And you&rsquo;ve put the bad case at {oddsPhrase} &mdash; all the more
            reason the floor isn&rsquo;t optional. At those odds you should assume
            you&rsquo;ll be tested against the line, not spared it.
          </p>
        )}
        {often ? (
          <p className="mt-3 pl-3 border-l-2 border-[var(--accent)] text-sm text-[var(--muted)] leading-relaxed">
            Repeated, a maybe-recoverable hit is even more dangerous: you might
            climb out of one, but a second before you&rsquo;ve recovered from the
            first is what turns a bad patch into a hole with no bottom. Size it so
            one setback never leaves you unable to take the next.
          </p>
        ) : null}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Put the floor in
          </p>
          <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
            <li>
              <Link
                href={withSubject("/tripwire", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Set the line: a state and a date &rarr;
              </Link>{" "}
              Name the observable point past which you stop &mdash; drawn now,
              while you&rsquo;re calm &mdash; so a slow ruin can&rsquo;t creep past
              the point of no return while you keep telling yourself it&rsquo;s
              fine. It&rsquo;s handed back to you on its day at the return desk.
            </li>
            <li>
              <Link
                href={withSubject("/widen", subject)}
                className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
              >
                Find a version that caps the loss &rarr;
              </Link>{" "}
              Better than a line you might cross is a shape where the worst case is
              a clean, survivable setback rather than a maybe-ruin at all.
            </li>
          </ul>
        </div>
        <PrintNote />
      </div>
    );
  }

  // ============ Can't tell — settle the one question first ============
  return (
    <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        The read
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        Settle this one question first &mdash; it changes everything else.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        You can&rsquo;t tell whether <WorstQuote worst={worst} /> is something
        you&rsquo;d recover from &mdash; and that&rsquo;s the one thing you need to
        know before any other tool can help, because it decides which <em>kind</em>{" "}
        of decision this is. If it&rsquo;s survivable, this is an ordinary
        risk-and-reward call and the odds decide it. If it isn&rsquo;t, no odds and
        no upside can justify it. Everything downstream &mdash; the flip point, the
        expected value, the &ldquo;but the upside&rdquo; &mdash; only means anything
        on the survivable side of that line.
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        So settle it directly. Name your <em>point of no return</em> &mdash; not
        vaguely, concretely: the specific loss (of money, health, time, a
        relationship, a reputation, a career) past which there&rsquo;s genuinely no
        coming back. Then ask whether the worst case you wrote actually reaches it.
        The answer is usually clearer than the dread: either it stops well short of
        the line (a real loss, but survivable), or it crosses it (ruin &mdash;
        refuse this version and cap it).
      </p>
      <div className="mt-4 pt-4 border-t border-[var(--border)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Draw the line, then come back
        </p>
        <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
          <li>
            <Link
              href={withSubject("/trace", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Follow the worst case forward &rarr;
            </Link>{" "}
            Trace it a step at a time &mdash; and then what? &mdash; to see whether
            it bottoms out at a bad-but-survivable place or runs into a point of no
            return.
          </li>
          <li>
            <Link
              href={withSubject("/tripwire", subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              Once you can name the line, set it &rarr;
            </Link>{" "}
            Turn the point of no return into an observable signal and a date you
            commit not to cross &mdash; the floor that keeps the uncertainty from
            becoming a slow ruin while you decide.
          </li>
        </ul>
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          Then come back and answer the survival question again &mdash; it&rsquo;ll
          have turned into one of the other three.
        </p>
      </div>
      <PrintNote />
    </div>
  );
}

/** The keep-a-copy affordance, shown under a real read. Matches the siblings. */
function PrintNote() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <PrintButton label="Print / Save as PDF" />
    </div>
  );
}

/**
 * The worked example, rendered read-only. Walks the canonical ruin case — a
 * genuine opportunity with a ruinous tail — and, crucially, shows the *reshape*:
 * the move isn't "don't do it," it's "do the version you'd survive." That's the
 * useful part, and the part people miss. Nothing lands in the person's own fields
 * or storage.
 */
function RuinExample() {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example &mdash; nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        A friend offers you in on their business. If it works it changes your life;
        the upside is real and the founder is sharp. But to take the full stake
        you&rsquo;d have to put in nearly everything you&rsquo;ve saved &mdash;
        including the money that covers you if the car dies or a job ends.
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4 space-y-3">
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">Worst realistic case:</span> the business
          folds &mdash; most do &mdash; and the whole stake is gone.
        </p>
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">Would you recover?</span> No &mdash; not
          because you couldn&rsquo;t earn again, but because with no reserve, the
          next unlucky month (a medical bill, a layoff) has nothing behind it. The
          loss isn&rsquo;t just the money; it&rsquo;s the floor under everything
          else. That&rsquo;s an absorbing barrier: <span className="italic">ruin</span>,
          not a loss.
        </p>
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          <span className="font-medium">&ldquo;But it&rsquo;ll probably
          work&rdquo;:</span> probably isn&rsquo;t the question. A small chance of
          losing your floor is still losing your floor, and you only need it to
          happen once.
        </p>
      </div>
      <p className="mt-4 text-sm text-[var(--foreground)] leading-relaxed">
        The move isn&rsquo;t to pass on the business. It&rsquo;s to take the version
        you&rsquo;d survive: put in the slice you could lose in full without
        changing how you sleep, and keep six months&rsquo; runway untouched. The
        upside is smaller &mdash; but the worst case is now &ldquo;I lost some money
        I&rsquo;d set aside for a bet,&rdquo; not &ldquo;I have nothing when
        something breaks.&rdquo; Same opportunity, survivable shape. That&rsquo;s
        the whole discipline:{" "}
        <span className="font-medium">bet what you can lose; keep the floor.</span>
      </p>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank &mdash; run it on <em>your</em> call.
      </p>
    </div>
  );
}
