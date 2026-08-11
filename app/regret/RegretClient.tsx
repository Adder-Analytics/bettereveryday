"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";

/**
 * Ask your older self (/regret)
 *
 * The instrument for the calm-but-conflicted moment: you keep leaning one way,
 * and you can't tell whether that's the real call or just the version of you
 * sitting here right now. It isn't the hot state the cooling-off tool meets —
 * no anger, no clock, no pulse up — it's the quieter distortion: comfort,
 * avoidance, the fear of trying, the shine of a new thing. All of them are
 * *present-weighted*, and present weight is exactly what you can't feel from
 * inside the present.
 *
 * The frame is two well-worn techniques the site had only ever mentioned in
 * passing (inside the cooling-off tool, as one tactic for a hot state). Suzy
 * Welch's 10-10-10 asks how a call will look in ten minutes, ten months, ten
 * years — because a strong feeling collapses the horizons into one loud *now*,
 * and stretching them back out shows which pulls are durable and which
 * evaporate. Bezos's regret-minimization asks the same question from the end:
 * project to your older self and choose what they'd least regret. The two meet
 * on one insight the site had nowhere else — the *asymmetry* Gilovich and Medvec
 * measured: in the long run people regret the things they didn't do far more
 * than the things they did. The regret of a road not taken is systematically
 * underweighted in the moment and grows with time, so it belongs on the board as
 * its own weight, not folded into the pull.
 *
 * So the tool does two readings. It plays the option you're leaning toward
 * across the three horizons and reads the *trajectory* — the same "read the sign
 * pattern" idiom the consequence trace uses, applied to how a feeling changes
 * over time rather than how an effect ripples through the world. And it asks,
 * separately, about the road you'd be giving up, because the omission is the
 * half the present hides. Then it crosses the two.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser so a reload
 * doesn't wipe them. There's no forecast to log — a horizon read isn't a
 * prediction — only a handoff to the right next tool for the shape you find.
 */

const STORE_KEY = "regret:v1";

/** How you'd feel about going with the pull, at a given horizon. */
type Feel = "" | "glad" | "mixed" | "regret";
/** How the road you'd be giving up sits, ten years on. */
type Foregone = "" | "let-go" | "mixed" | "regret";

type Inputs = {
  decision: string;
  pull: string;
  min10: Feel;
  mon10: Feel;
  yr10: Feel;
  foregone: Foregone;
};

const BLANK: Inputs = {
  decision: "",
  pull: "",
  min10: "",
  mon10: "",
  yr10: "",
  foregone: "",
};

const EXAMPLE: Inputs = {
  decision: "Whether to take the job in another city",
  pull: "Turn it down and keep the life I have",
  min10: "glad",
  mon10: "mixed",
  yr10: "regret",
  foregone: "regret",
};

function isFeel(v: unknown): v is Feel {
  return v === "glad" || v === "mixed" || v === "regret";
}
function isForegone(v: unknown): v is Foregone {
  return v === "let-go" || v === "mixed" || v === "regret";
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      pull: typeof v.pull === "string" ? v.pull : BLANK.pull,
      min10: isFeel(v.min10) ? v.min10 : BLANK.min10,
      mon10: isFeel(v.mon10) ? v.mon10 : BLANK.mon10,
      yr10: isFeel(v.yr10) ? v.yr10 : BLANK.yr10,
      foregone: isForegone(v.foregone) ? v.foregone : BLANK.foregone,
    };
  } catch {
    return BLANK;
  }
}

/** The trajectory shape the three horizons trace. */
type Shape =
  | "lasting" // glad and stays glad — it holds
  | "rises" // starts rough, ends better — short-term cost, lasting gain
  | "dip" // glad, rough middle, glad again — a J-curve you come through
  | "fades" // loud now, regret later — the classic trap
  | "spike" // a flare in the middle that fades — novelty
  | "sours" // drifts to regret — nothing durable underneath
  | "fizzles" // glad now, nothing later — a want, not a need
  | "flat"; // no signal — the horizons don't decide it

type Verdict = {
  shape: Shape;
  /** The three horizon scores, glad=+1 · mixed=0 · regret=−1, for the chart. */
  vals: [number, number, number];
};

function score(f: Feel): number {
  return f === "glad" ? 1 : f === "regret" ? -1 : 0;
}

/**
 * Read the trajectory. Ends-in-glad shapes recommend acting (differing only in
 * how much the near term stings on the way); ends-in-regret shapes say the pull
 * won't last; a flat read means the horizons give no signal and the call belongs
 * on its merits. The middle horizon breaks ties — a rough or bright *middle*
 * that doesn't match the ends is its own tell.
 */
function classify(inp: Inputs): Verdict | null {
  if (!inp.min10 || !inp.mon10 || !inp.yr10) return null;
  const a = score(inp.min10);
  const b = score(inp.mon10);
  const c = score(inp.yr10);
  const vals: [number, number, number] = [a, b, c];

  let shape: Shape;
  if (a === -1 && b === -1 && c === -1) {
    shape = "sours"; // all regret — the strongest "don't"
  } else if (c === -1) {
    if (a === 1) shape = "fades";
    else if (a === -1 && b === 1) shape = "spike";
    else shape = "sours";
  } else if (c === 1) {
    if (a >= 0 && b < 0) shape = "dip";
    else if (a <= 0) shape = "rises";
    else shape = "lasting";
  } else {
    // ends neutral
    if (a === 1 && b <= 0) shape = "fizzles";
    else if (a === -1) shape = "rises"; // eased up from regret
    else shape = "flat";
  }
  return { shape, vals };
}

const inputClass =
  "w-full px-3 py-2 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const chipBase =
  "text-sm px-3 py-1.5 rounded-lg border transition-colors cursor-pointer text-left";
const chipOn = "border-[var(--accent)] text-[var(--accent)] font-medium";
const chipOff =
  "border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]";

const FEEL_OPTIONS: { id: Feel; label: string }[] = [
  { id: "glad", label: "Glad I did" },
  { id: "mixed", label: "Mixed" },
  { id: "regret", label: "Wish I hadn't" },
];

const FOREGONE_OPTIONS: { id: Foregone; label: string; hint: string }[] = [
  { id: "let-go", label: "I could let it go", hint: "The other road closing doesn't cost me much — I'd make my peace with it." },
  { id: "mixed", label: "Mixed", hint: "Some pang, but not one that would follow me." },
  { id: "regret", label: "I'd regret not taking it", hint: "Not trying it is the thing I'd still be turning over years from now." },
];

const HORIZONS: { key: "min10" | "mon10" | "yr10"; when: string; sub: string }[] = [
  { key: "min10", when: "In ten minutes", sub: "The immediate feeling — relief, a thrill, the weight lifting or landing." },
  { key: "mon10", when: "In ten months", sub: "Once the first feeling has worn off and you're living with the choice." },
  { key: "yr10", when: "In ten years", sub: "Your older self, looking back. The horizon the present hides hardest." },
];

export default function RegretClient() {
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

  const verdict = useMemo(() => classify(inp), [inp]);
  const pull = inp.pull.trim();

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
        {showExample ? <RegretExample /> : null}
      </div>

      {/* ---- The decision ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you deciding?
        </label>
        <input
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Whether to take the job in another city"
          className={inputClass}
        />
        <CarriedNote
          show={carriedSeed !== "" && inp.decision.trim() === carriedSeed}
          onClear={() => {
            set("decision", "");
            setCarriedSeed("");
          }}
        />

        <label className="mt-5 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          Which way are you leaning right now?
        </label>
        <input
          type="text"
          value={inp.pull}
          onChange={(e) => set("pull", e.target.value)}
          placeholder="e.g. Turn it down and keep the life I have"
          className={inputClass}
        />
        <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
          Name the pull as a plain statement of what you&rsquo;re tempted to
          choose — whether that&rsquo;s doing the thing or leaving it. The three
          horizons play <em>that</em> forward.
        </p>
      </div>

      {/* ---- The three horizons ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Play it forward
        </p>
        <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
          If you go with{" "}
          {pull ? (
            <span className="font-medium text-[var(--foreground)]">{pull}</span>
          ) : (
            "that leaning"
          )}
          , how will you feel about it —{" "}
          <span className="text-[var(--foreground)]">then?</span> A strong pull
          collapses all three of these into one loud <em>now</em>; answering them
          apart is how you pull them back out.
        </p>
        <div className="space-y-4">
          {HORIZONS.map((h) => (
            <div key={h.key}>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {h.when}
                </span>
                <span className="text-xs text-[var(--muted)] leading-relaxed">
                  {h.sub}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FEEL_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => set(h.key, o.id)}
                    className={`${chipBase} ${inp[h.key] === o.id ? chipOn : chipOff}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---- The road not taken ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          The road not taken
        </p>
        <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
          Now the other path — the one you&rsquo;d be giving up. Ten years on, how
          does letting it go sit? This is the half the present hides: the pull you
          feel is loud, the road you don&rsquo;t take is silent — and silence gets
          underweighted exactly when it matters most.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {FOREGONE_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => set("foregone", o.id)}
              className={`${chipBase} ${inp.foregone === o.id ? chipOn : chipOff}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {inp.foregone ? (
          <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
            {FOREGONE_OPTIONS.find((o) => o.id === inp.foregone)?.hint}
          </p>
        ) : null}
      </div>

      {/* ---- The verdict ---- */}
      {verdict ? (
        <VerdictBlock verdict={verdict} inp={inp} />
      ) : (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Answer the three horizons and the shape of the pull appears — whether
            it lasts, or whether it&rsquo;s only loud right now.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * The horizon chart — three points across time, glad at the top, regret at the
 * bottom, connected so the *trajectory* is the thing you see, not the endpoints.
 * The same "draw the road, not just its ends" instinct the practice sparkline
 * uses. Responsive width via a non-uniform viewBox scale; the labels sit under
 * each horizon.
 */
function HorizonChart({ vals }: { vals: [number, number, number] }) {
  // Map score (+1 glad, 0 mixed, −1 regret) to a y in a 0..56 box (y grows down).
  const y = (v: number) => (v === 1 ? 10 : v === 0 ? 28 : 46);
  const xs = [12, 50, 88];
  const pts = vals.map((v, i) => `${xs[i]},${y(v)}`).join(" ");
  return (
    <div className="mt-5">
      <svg
        viewBox="0 0 100 56"
        preserveAspectRatio="none"
        className="w-full h-16"
        aria-hidden
      >
        {/* the neutral mid-line */}
        <line
          x1="0"
          y1="28"
          x2="100"
          y2="28"
          stroke="var(--border)"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        <polyline
          points={pts}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {vals.map((v, i) => (
          <circle
            key={i}
            cx={xs[i]}
            cy={y(v)}
            r="2.4"
            fill="var(--accent)"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-[var(--muted)] px-1">
        <span>10 min</span>
        <span>10 months</span>
        <span>10 years</span>
      </div>
    </div>
  );
}

const SHAPE_COPY: Record<Shape, { verdict: string; go: "yes" | "no" | "flat" }> = {
  lasting: { verdict: "It lasts. This isn't the feeling talking.", go: "yes" },
  rises: { verdict: "Short-term cost, lasting gain.", go: "yes" },
  dip: { verdict: "A rough middle you'd come through.", go: "yes" },
  fades: { verdict: "Loud now, gone later. The classic trap.", go: "no" },
  spike: { verdict: "A flare that fades. Don't let the middle decide it.", go: "no" },
  sours: { verdict: "Nothing durable underneath the pull.", go: "no" },
  fizzles: { verdict: "A want, not a need. It drains to nothing.", go: "no" },
  flat: { verdict: "The horizons don't decide this one.", go: "flat" },
};

function VerdictBlock({ verdict, inp }: { verdict: Verdict; inp: Inputs }) {
  const { shape } = verdict;
  const copy = SHAPE_COPY[shape];
  const it = inp.pull.trim();
  const pull = it ? <span className="font-medium">{it}</span> : "the pull";

  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        What your older self sees
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        {copy.verdict}
      </p>

      <HorizonChart vals={verdict.vals} />

      <div className="mt-5 text-sm text-[var(--foreground)] leading-relaxed">
        <ShapeBody shape={shape} pull={pull} />
      </div>

      <ForegoneRead shape={shape} foregone={inp.foregone} />

      <Handoffs shape={shape} inp={inp} />
    </div>
  );
}

function ShapeBody({ shape, pull }: { shape: Shape; pull: React.ReactNode }) {
  switch (shape) {
    case "lasting":
      return (
        <p>
          You&rsquo;d be glad you went with {pull}{" "}now <em>and</em> a decade out.
          A pull that survives all three horizons isn&rsquo;t the present talking
          — it&rsquo;s the call. The horizons are supposed to catch a feeling that
          evaporates; this one doesn&rsquo;t. Go, and stop re-litigating it.
        </p>
      );
    case "rises":
      return (
        <p>
          {pull}{" "}starts rough and gets better with distance — the shape of nearly
          everything worth doing. The ten-minute version is real, but it&rsquo;s
          the most temporary thing on the board, and it&rsquo;s the one loudest
          right now. Don&rsquo;t let it cast the deciding vote over the self who
          has to live with the choice. Your older self is on the side of going.
        </p>
      );
    case "dip":
      return (
        <p>
          {pull}{" "}is good at the start, hard in the middle, and good again on the
          far side — a J-curve. The trap here isn&rsquo;t the decision, it&rsquo;s
          quitting in the trough and calling the trough the verdict. Go, but go in
          knowing the rough stretch is coming, so it can&rsquo;t ambush you into
          bailing right before it turns.
        </p>
      );
    case "fades":
      return (
        <p>
          {pull}{" "}is loud right now and a regret later — the single most common
          shape a bad call makes. The appeal is front-loaded: it pays out in the
          first ten minutes and bills you for years. That&rsquo;s present bias
          doing exactly what it does, inflating the near reward until the later
          cost disappears behind it. The ten-minute glow is not information about
          whether this is right.
        </p>
      );
    case "spike":
      return (
        <p>
          {pull}{" "}looks worst up close, best in the middle distance, and sours
          again by the end — a flare, not a fire. The bright middle is usually
          novelty: the part that feels good precisely because it&rsquo;s new, and
          new is the one thing guaranteed to wear off. Discount the middle;
          it&rsquo;s the least durable reading of the three.
        </p>
      );
    case "sours":
      return (
        <p>
          {pull}{" "}doesn&rsquo;t hold up at any horizon that matters — and the
          further out you look, the worse it sits. There&rsquo;s no durable reason
          under it, only a present-moment pull dressed as a decision. Your older
          self is clear on this one. The honest move is not to.
        </p>
      );
    case "fizzles":
      return (
        <p>
          {pull}{" "}feels good now and simply thins out to nothing — no lasting glad,
          no lasting regret, just a want that doesn&rsquo;t survive contact with
          time. That&rsquo;s the tell of an impulse rather than a decision: it
          needs the present moment to feel like anything at all. If it&rsquo;s
          cheap and reversible, fine — but don&rsquo;t give it the weight of a real
          call.
        </p>
      );
    case "flat":
      return (
        <p>
          The horizons come out level — no version of you, near or far, feels
          strongly either way about {pull}. That&rsquo;s a real answer: the pull
          isn&rsquo;t what should decide this, because there barely is one. Take it
          to a tool that weighs the <em>merits</em> instead of the feeling.
        </p>
      );
  }
}

/**
 * The omission overlay — the asymmetry the tool exists to surface. A road you'd
 * regret giving up is the heaviest, most-underweighted weight on the board; it
 * can agree with the trajectory or cut against it, and the cross is the most
 * useful thing the read produces.
 */
function ForegoneRead({ shape, foregone }: { shape: Shape; foregone: Foregone }) {
  if (!foregone) {
    return (
      <p className="mt-4 pt-4 border-t border-[var(--border)] text-sm text-[var(--muted)] leading-relaxed">
        One question left — the road not taken, above. Answer it and this read
        weighs the regret of walking away against the regret of going, which is
        the whole point of asking your older self.
      </p>
    );
  }
  const go = SHAPE_COPY[shape].go;
  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        And the road not taken
      </p>
      {foregone === "regret" ? (
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          You said you&rsquo;d regret not taking the other road — and that is the
          heaviest weight here, because it&rsquo;s the one you can least feel right
          now. Over a lifetime people regret the things they didn&rsquo;t do far
          more than the things they did; a regret of <em>omission</em> is quiet
          today and grows.{" "}
          {go === "no" ? (
            <>
              So notice the tension: the pull you&rsquo;re leaning toward
              doesn&rsquo;t last, yet walking away from the other road is a lasting
              regret. That usually means it isn&rsquo;t <em>this</em> version you
              want — it&rsquo;s some version of the road you&rsquo;d regret giving
              up. Don&rsquo;t take this one on the strength of the feeling; go find
              the one your older self is actually asking for.
            </>
          ) : go === "flat" ? (
            <>
              The horizons were level on the pull, but this isn&rsquo;t: not trying
              is the thing you&rsquo;d turn over for years. When the feeling
              doesn&rsquo;t decide and the omission does, the omission wins. That
              settles it — go.
            </>
          ) : (
            <>
              And it points the same way the horizons did. Both signals agree: the
              pull lasts, and the road not taken is a regret. Go — this is as clear
              as the read gets.
            </>
          )}
        </p>
      ) : foregone === "let-go" ? (
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          You could let the other road go — so the pull has to earn the yes on its
          own.{" "}
          {go === "yes" ? (
            <>It did, above, and nothing you&rsquo;d regret is riding on the other side. Clean go.</>
          ) : go === "no" ? (
            <>It didn&rsquo;t, above — and there&rsquo;s no lasting regret waiting on the road you&rsquo;d skip. Walking away is clean, not a loss.</>
          ) : (
            <>It didn&rsquo;t, above — the horizons were level — and there&rsquo;s no regret on the other side either. With nothing durable pulling either way, treat this as the small, reversible call it is and move on fast.</>
          )}
        </p>
      ) : (
        <p className="mt-2 text-sm text-[var(--foreground)] leading-relaxed">
          A pang, but not one that would follow you — so the road not taken
          doesn&rsquo;t override the trajectory above. Let the horizons carry the
          call.
        </p>
      )}
    </div>
  );
}

type Handoff = { href: string; label: string; note: React.ReactNode };

function Handoffs({ shape, inp }: { shape: Shape; inp: Inputs }) {
  const s = inp.decision;
  const go = SHAPE_COPY[shape].go;
  const list: Handoff[] = [];

  if (go === "yes") {
    list.push({
      href: withSubject("/act", s),
      label: "Turn it into the first move",
      note: "A call your older self endorses still dies if nothing moves this week. Set the smallest first step and the cue that fires it.",
    });
    list.push({
      href: withSubject("/premortem", s),
      label: "Pre-mortem it, if it's big",
      note: "Going doesn't mean going blind — if it's hard to undo, write the story of how it fails before you commit, and turn each cause into a fix or a tripwire.",
    });
    if (shape === "dip") {
      list.push({
        href: withSubject("/tripwire", s),
        label: "Arm the trough",
        note: "Set the signal now, while you're clear-eyed, that tells the difference between the rough middle you expected and a real reason to stop — so you don't bail in the dip.",
      });
    }
  } else if (go === "no") {
    list.push({
      href: withSubject("/cool", s),
      label: "Get distance first",
      note: "If the near-term pull is this loud, put real space between you and it — answer it in a friend's name, or sleep on it — before it decides anything.",
    });
    if (shape === "fades") {
      list.push({
        href: withSubject("/trace", s),
        label: "Trace where the bill lands",
        note: "If the later regret is a concrete downstream cost and not just a mood, follow the move past its first-order payoff to the exact place it flips on you.",
      });
    }
  } else {
    // flat — decide on the merits
    list.push({
      href: withSubject("/weigh", s),
      label: "Weigh it on the merits",
      note: "If it's two options and the feeling won't break the tie, find the flip point — the odds where the call tips — and just ask which side you're on.",
    });
    list.push({
      href: withSubject("/compare", s),
      label: "Compare, if there are several",
      note: "More than two live options? Score them a factor at a time so no single first impression halos the whole choice.",
    });
  }

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Where to take it next
      </p>
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
 * The worked example, rendered read-only. Runs the same classify() the live tool
 * does, on a fixed scenario — the comfortable default that curdles while the road
 * not taken becomes a lasting regret — so a newcomer sees a finished pass, and
 * the tool's signature move (the omission outweighing the pull), without a single
 * character landing in their own fields or storage.
 */
function RegretExample() {
  const verdict = classify(EXAMPLE);
  if (!verdict) return null;
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{EXAMPLE.decision}.</span> The leaning:{" "}
        <span className="font-medium">turn it down and keep the life I have.</span>{" "}
        Played forward, that&rsquo;s a <span className="font-medium">relief</span>{" "}
        in ten minutes, <span className="font-medium">mixed</span> in ten months,
        and a <span className="font-medium">regret</span> in ten years — while not
        taking the job is the road you&rsquo;d{" "}
        <span className="font-medium">regret giving up.</span>
      </p>
      <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          What your older self sees
        </p>
        <p className="mt-1 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          {SHAPE_COPY[verdict.shape].verdict}
        </p>
        <HorizonChart vals={verdict.vals} />
        <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
          The comfortable choice pays out in the first ten minutes and bills you
          for years — and the road you&rsquo;d be giving up is exactly the kind of
          thing people regret <em>not</em> doing most. Two independent signals, one
          direction: the pull to stay is the present talking. Lean toward going.
        </p>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank — play <em>your</em> call forward.
      </p>
    </div>
  );
}
