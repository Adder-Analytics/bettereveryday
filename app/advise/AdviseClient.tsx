"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readCarriedSubject, clearCarriedSubject, withSubject } from "../data/carry";
import CarriedNote from "../components/CarriedNote";
import { toThirdPerson } from "../data/reframe";

/**
 * Advise a friend (/advise)
 *
 * The across-person self-distancing instrument, for the calm decider. Its
 * sibling is the older-self tool (/regret), which runs the across-*time* move;
 * this one runs the across-*person* move, and the two now give the
 * self-distancing cluster a calm home on each of its axes. Both moves also live,
 * as quick passes, inside the cooling-off tool (/cool) — but /cool is framed for
 * a *hot* decider, and Solomon's paradox needs no heat: you reason worse about
 * your own dilemma than a friend's identical one stone-cold sober. So the
 * across-person move earns its own calm front door here, the way the across-time
 * move already had one in /regret.
 *
 * The genuinely distinct thing this tool does — the reason it isn't a second copy
 * of /cool's reframe — is that /cool *shows* you the third-person sentence and
 * stops. This walks the whole procedure the essay is named for ("You Give Better
 * Advice Than You *Take*"): reframe, then say the advice out loud, then face the
 * second question the reframe usually skips — *would you take it?* When the
 * answer is no, the decision was never the unclear part; the obstacle was, and
 * naming which obstacle (and handing you the tool built for it) is the work.
 * When the answer is "my case is different," it runs the honest test for
 * special-pleading.
 *
 * Nothing here is sent anywhere. Inputs persist in the browser under `advise:v1`
 * so a reload doesn't wipe them. There's no forecast to log — a reframe isn't a
 * prediction — only a routed handoff to the tool for whatever the read surfaces.
 */

const STORE_KEY = "advise:v1";

/** Would you take the advice you just gave a friend? */
type Take = "" | "yes" | "no" | "different";
/** If not — the obstacle that's actually in the way (not the decision). */
type Block = "" | "downside" | "opinion" | "sunk" | "comfort" | "distrust" | "other";

type Inputs = {
  decision: string;
  friend: string;
  advice: string;
  take: Take;
  block: Block;
  realDiff: string;
};

const BLANK: Inputs = {
  decision: "",
  friend: "",
  advice: "",
  take: "",
  block: "",
  realDiff: "",
};

const EXAMPLE: Inputs = {
  decision: "Whether to leave the career I've spent a decade building",
  friend: "Sam",
  advice:
    "Leave. You've been miserable for two years, you light up talking about the other thing, and the money isn't worth what this is doing to you.",
  take: "no",
  block: "sunk",
  realDiff: "",
};

function isTake(v: unknown): v is Take {
  return v === "yes" || v === "no" || v === "different";
}
function isBlock(v: unknown): v is Block {
  return (
    v === "downside" ||
    v === "opinion" ||
    v === "sunk" ||
    v === "comfort" ||
    v === "distrust" ||
    v === "other"
  );
}

function loadInputs(): Inputs {
  if (typeof window === "undefined") return BLANK;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return BLANK;
    const v = JSON.parse(raw) as Partial<Inputs>;
    return {
      decision: typeof v.decision === "string" ? v.decision : BLANK.decision,
      friend: typeof v.friend === "string" ? v.friend : BLANK.friend,
      advice: typeof v.advice === "string" ? v.advice : BLANK.advice,
      take: isTake(v.take) ? v.take : BLANK.take,
      block: isBlock(v.block) ? v.block : BLANK.block,
      realDiff: typeof v.realDiff === "string" ? v.realDiff : BLANK.realDiff,
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

const TAKE_OPTIONS: { id: Take; label: string; detail: string }[] = [
  {
    id: "yes",
    label: "Yes — and hearing it out loud is what I needed",
    detail: "Said plainly, in someone else's name, the answer stops being a fog.",
  },
  {
    id: "no",
    label: "No — and that's the actual problem",
    detail: "I know what I'd tell them. I just won't do it myself.",
  },
  {
    id: "different",
    label: "It's genuinely different for me",
    detail: "There's something about my case that changes the advice.",
  },
];

/** The obstacles that stand between the advice and taking it — each with the
 *  instrument built for exactly that obstacle. The routing is the payoff: a call
 *  that's clear but blocked doesn't need more deciding, it needs the block
 *  named and worked. */
const BLOCKS: {
  id: Block;
  label: string;
  /** The honest line about this obstacle, shown in the read. */
  read: string;
  /** The tool(s) for it. */
  routes: { tool: string; label: string; note: string }[];
}[] = [
  {
    id: "downside",
    label: "The downside scares me",
    read: "You're weighting the worst case far past its odds — the signature of loss aversion, where a possible loss looms about twice as large as the same-sized gain. That's not a reason to ignore the risk; it's a reason to size it honestly instead of letting the fear do the arithmetic.",
    routes: [
      {
        tool: "/weigh",
        label: "Find the flip point",
        note: "Put a real number on how likely the downside has to be before the call actually tips — usually it's further from the edge than the fear insists.",
      },
      {
        tool: "/premortem",
        label: "Face the failure squarely",
        note: "If it's big and hard to undo, write the story of how it goes wrong, then turn each cause into a fix, an accepted risk, or a tripwire — so the fear becomes a plan instead of a fog.",
      },
    ],
  },
  {
    id: "opinion",
    label: "What people will think",
    read: "You'd tell your friend that whose approval you're protecting won't be in the room for the life that follows — but it's your own audience, so it feels load-bearing. The tell is that you can't usually name who, exactly, and what they'd actually do. An audience you can't name isn't a reason; it's a weather system.",
    routes: [
      {
        tool: "/regret",
        label: "Ask your older self",
        note: "Play it to ten years and ask whether the opinion you're bending to will weigh anything then, against the road you'd have given up to keep it.",
      },
    ],
  },
  {
    id: "sunk",
    label: "I've already put too much in",
    read: "The years and money already spent are gone whichever way you choose — they're a cost you've paid, not a reason to keep paying. You'd see that instantly in your friend's case. In your own, the sunk cost dresses itself up as commitment. The only honest question is whether you'd start this fresh today.",
    routes: [
      {
        tool: "/quit",
        label: "Take the sunk cost out of the vote",
        note: "Ask whether you'd begin this again today, and weigh one more push against the best other use of the same time and money — the exact move your friend's version makes obvious.",
      },
    ],
  },
  {
    id: "comfort",
    label: "The comfort of not choosing",
    read: "Not deciding feels safe because the cost is invisible — nothing changes, so nothing seems lost. But the drift is a choice too, quietly made for the status quo every day you don't act, and it's the one option you'd never actually advise. Your friend didn't come to you to be told to keep waiting.",
    routes: [
      {
        tool: "/act",
        label: "Turn the advice into the first move",
        note: "Name the smallest concrete step you'd tell them to take this week and the cue that fires it — so the advice becomes a motion, not another thing you're sitting with.",
      },
      {
        tool: "/doors",
        label: "Check the weight first",
        note: "If the call is reversible, you may be agonizing over something you could simply try and walk back — which is its own permission to move.",
      },
    ],
  },
  {
    id: "distrust",
    label: "I don't fully trust the advice",
    read: "Fair — maybe you gave the glib answer, the one that's easy to say to a friend across a table and wrong once you know the details. That's worth taking seriously rather than overriding. But it's also exactly what the resistance would say to protect itself, so don't stop at the doubt: name the specific thing your quick advice missed, and check whether it actually holds.",
    routes: [
      {
        tool: "/test",
        label: "Reality-test the assumption",
        note: "Name the one thing that, if true, would make your quick advice wrong — then check whether you've gone looking for it, or only for reasons to keep doubting.",
      },
      {
        tool: "/compare",
        label: "Lay the options side by side",
        note: "If the real trouble is that there are several live paths, not one, score them a factor at a time so no single first impression carries the whole call.",
      },
    ],
  },
  {
    id: "other",
    label: "Something else",
    read: "Whatever it is, it's the obstacle — not the decision. The decision, you answered clearly the moment it had someone else's name on it. Name the thing that's actually in the way as plainly as you named the advice, and the next move usually shows itself.",
    routes: [
      {
        tool: "/decide",
        label: "Log what you actually expect",
        note: "Write the call and your reasoning down while it's clear, and schedule the day you'll come back and see whether the advice you resisted was right.",
      },
    ],
  },
];

function blockDef(id: Block) {
  return BLOCKS.find((b) => b.id === id) ?? null;
}

/** The read the tool produces. Pure, so the live tool and the worked example run
 *  identical logic. Null until there's enough answered to say something true. */
type Outcome = "already-know" | "obstacle" | "different-real" | "different-pleading";

function computeOutcome(inp: Inputs): Outcome | null {
  if (inp.take === "yes") return "already-know";
  if (inp.take === "no") return inp.block ? "obstacle" : null;
  if (inp.take === "different")
    return inp.realDiff.trim() ? "different-real" : "different-pleading";
  return null;
}

export default function AdviseClient() {
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

  const thirdPerson = useMemo(
    () => toThirdPerson(inp.decision.trim() || "my decision", inp.friend),
    [inp.decision, inp.friend]
  );
  const outcome = useMemo(() => computeOutcome(inp), [inp]);
  const adviceGiven = inp.advice.trim() !== "";

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
        {showExample ? <AdviseExample /> : null}
      </div>

      {/* ---- The decision, in a friend's name ---- */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What are you deciding?
        </label>
        <input
          type="text"
          value={inp.decision}
          onChange={(e) => set("decision", e.target.value)}
          placeholder="e.g. Whether to leave the career I've spent a decade building"
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
          Whose name should be on it?
        </label>
        <input
          type="text"
          value={inp.friend}
          onChange={(e) => set("friend", e.target.value)}
          placeholder="a friend's name (or leave blank)"
          className={inputClass}
        />
        <div className="mt-3 rounded-lg border border-[var(--border)] p-4">
          <p className="text-xs text-[var(--muted)]">
            Read it as theirs. This is the exact question you&rsquo;d answer
            without a second thought if a friend brought it to you:
          </p>
          <p className="mt-1.5 text-base font-medium text-[var(--foreground)] leading-snug">
            &ldquo;{thirdPerson}?&rdquo;
          </p>
        </div>
      </div>

      {/* ---- The advice ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
          What would you tell {inp.friend.trim() || "them"}?
        </label>
        <p className="mb-3 text-sm text-[var(--muted)] leading-relaxed">
          Say it straight — the way you would if it were their call and they
          were waiting for your honest answer, not a hedge. Don&rsquo;t soften it
          into &ldquo;it depends.&rdquo;
        </p>
        <textarea
          value={inp.advice}
          onChange={(e) => set("advice", e.target.value)}
          rows={3}
          placeholder="e.g. Leave. You've been miserable for two years and the money isn't worth what it's doing to you."
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* ---- Would you take it? ---- */}
      <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Now the real question
        </p>
        <p className="mt-2 mb-4 text-sm text-[var(--muted)] leading-relaxed">
          You&rsquo;d give that advice to {inp.friend.trim() || "a friend"}{" "}
          without hesitating. So &mdash; would you take it yourself?
        </p>
        {!adviceGiven ? (
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Write the advice above first. The question only bites once
            it&rsquo;s in words.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {TAKE_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => set("take", o.id)}
                className={`${chipBase} ${inp.take === o.id ? chipOn : chipOff}`}
              >
                <span className="block font-medium">{o.label}</span>
                <span
                  className={`block text-xs mt-0.5 ${
                    inp.take === o.id ? "text-[var(--accent)]" : "text-[var(--muted)]"
                  }`}
                >
                  {o.detail}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* No → name the obstacle */}
        {adviceGiven && inp.take === "no" ? (
          <div className="mt-5">
            <p className="block text-sm font-medium text-[var(--foreground)] mb-2">
              What&rsquo;s actually stopping you?
            </p>
            <p className="mb-3 text-xs text-[var(--muted)] leading-relaxed">
              Not the decision &mdash; you just answered that. The thing between
              you and taking your own advice.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BLOCKS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => set("block", b.id)}
                  className={`${chipBase} ${inp.block === b.id ? chipOn : chipOff}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* Different → name the real difference (or fail to) */}
        {adviceGiven && inp.take === "different" ? (
          <div className="mt-5">
            <p className="block text-sm font-medium text-[var(--foreground)] mb-2">
              Then name the difference — the specific one.
            </p>
            <p className="mb-3 text-xs text-[var(--muted)] leading-relaxed">
              What is true about your case that would make you give{" "}
              {inp.friend.trim() || "a friend"} <em>different</em> advice if it
              were theirs? &ldquo;My situation is more complicated&rdquo; is not a
              difference — it&rsquo;s what everyone says. A real one you can state
              in a sentence.
            </p>
            <textarea
              value={inp.realDiff}
              onChange={(e) => set("realDiff", e.target.value)}
              rows={2}
              placeholder="the specific fact that changes the advice"
              className={`${inputClass} resize-none`}
            />
          </div>
        ) : null}
      </div>

      {/* ---- The read ---- */}
      {outcome ? (
        <ReadBlock outcome={outcome} inp={inp} />
      ) : (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-6">
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            Give the advice, then answer whether you&rsquo;d take it &mdash; and
            the read appears: whether you already knew, or what&rsquo;s really in
            the way.
          </p>
        </div>
      )}
    </div>
  );
}

function ReadBlock({ outcome, inp }: { outcome: Outcome; inp: Inputs }) {
  const friend = inp.friend.trim() || "a friend";
  const advice = inp.advice.trim();
  const block = blockDef(inp.block);

  let headline: string;
  let body: React.ReactNode;
  let routes: { tool: string; label: string; note: string }[] = [];

  if (outcome === "already-know") {
    headline = "You already knew. You just needed to hear it in the open.";
    body = (
      <p>
        That&rsquo;s the whole of Solomon&rsquo;s paradox: the answer was never
        missing, only muffled by being <em>yours</em>. Said in{" "}
        {friend}&rsquo;s name, it came out clear. Don&rsquo;t re-open it now that
        it&rsquo;s clear &mdash; the work left isn&rsquo;t more deciding, it&rsquo;s
        moving before the fog rolls back in.
      </p>
    );
    routes = [
      {
        tool: "/act",
        label: "Turn it into the first move",
        note: "Clarity fades. Set the smallest concrete step and the cue that fires it, this week, while the answer still rings true.",
      },
      {
        tool: "/decide",
        label: "Log it, if it's worth grading later",
        note: "Write down what you expect and how sure you are, and schedule the look-back — so a clear call becomes a call you can learn from.",
      },
    ];
  } else if (outcome === "obstacle" && block) {
    headline = "The decision was never the unclear part. This is.";
    body = (
      <>
        <p>
          You gave {friend} a clear answer{advice ? " — " : "."}
          {advice ? <span className="italic">&ldquo;{advice}&rdquo;</span> : null}
          {advice ? " — " : " "}and you won&rsquo;t take it. So the thing to work
          isn&rsquo;t the call. It&rsquo;s the block you just named:{" "}
          <span className="font-medium text-[var(--foreground)]">
            {block.label.toLowerCase()}
          </span>
          .
        </p>
        <p className="mt-3">{block.read}</p>
      </>
    );
    routes = block.routes;
  } else if (outcome === "different-real") {
    headline = "Fair — if that difference is real, it changes the advice.";
    body = (
      <>
        <p>
          You could name it, and in a sentence:{" "}
          <span className="italic">&ldquo;{inp.realDiff.trim()}&rdquo;</span>. That
          clears the special-pleading bar most &ldquo;my case is different&rdquo;
          claims fail &mdash; so the reframe genuinely doesn&rsquo;t transfer, and
          you shouldn&rsquo;t force it to.
        </p>
        <p className="mt-3">
          But run one honest check: would you still advise {friend} the same way
          if <em>their</em> case had that exact feature? If yes, the difference is
          real and the advice really does change — decide it on its own merits. If
          you flinch, it was the resistance talking after all, and the advice
          stands.
        </p>
      </>
    );
    routes = [
      {
        tool: "/weigh",
        label: "Weigh it on the merits",
        note: "The reframe doesn't decide this one. If it's two options, find the flip point and ask which side of the line you're on.",
      },
      {
        tool: "/compare",
        label: "Compare, if there are several",
        note: "More than two live paths? Score them a factor at a time so the genuine difference gets weighed, not just felt.",
      },
    ];
  } else {
    // different-pleading
    headline = "“My case is different” — but you can't say how.";
    body = (
      <p>
        That&rsquo;s the tell. An asymmetry you can feel but can&rsquo;t state in
        a sentence is almost always the resistance protecting itself, not a real
        feature of the case &mdash; everyone believes their own situation is the
        exception, which is exactly why the belief carries no information. Until
        you can name the specific thing that would make you advise {friend}{" "}
        differently, the honest move is the one you&rsquo;d press on them: take
        your own advice.
      </p>
    );
    routes = [
      {
        tool: "/act",
        label: "Take your own advice — make it a move",
        note: "Set the smallest first step your advice implies, and the cue that fires it, before the exception starts arguing again.",
      },
    ];
  }

  return (
    <div className="mt-5 rounded-xl border border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        What the reframe shows
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)] leading-snug">
        {headline}
      </p>
      <div className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        {body}
      </div>
      <Handoffs routes={routes} subject={inp.decision} />
    </div>
  );
}

function Handoffs({
  routes,
  subject,
}: {
  routes: { tool: string; label: string; note: string }[];
  subject: string;
}) {
  if (routes.length === 0) return null;
  return (
    <div className="mt-4 pt-4 border-t border-[var(--border)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
        Where to take it next
      </p>
      <ul className="mt-3 space-y-2.5 text-sm text-[var(--muted)] leading-relaxed">
        {routes.map((r) => (
          <li key={r.tool}>
            <Link
              href={withSubject(r.tool, subject)}
              className="text-[var(--accent)] hover:opacity-70 transition-opacity font-medium"
            >
              {r.label} →
            </Link>{" "}
            {r.note}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The worked example, rendered read-only. Runs the same computeOutcome the live
 * tool does, on a fixed scenario — the friend you'd tell to leave, held back by a
 * sunk cost you'd never let them count — so a newcomer sees the tool's signature
 * move (clear advice, unheeded, its real obstacle named) without a character
 * landing in their own fields or storage.
 */
function AdviseExample() {
  const outcome = computeOutcome(EXAMPLE);
  const third = toThirdPerson(EXAMPLE.decision, EXAMPLE.friend);
  const block = blockDef(EXAMPLE.block);
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[var(--accent)] bg-[var(--card)] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        A worked example — nothing here is saved
      </p>
      <p className="mt-3 text-sm text-[var(--foreground)] leading-relaxed">
        <span className="font-medium">{EXAMPLE.decision}.</span> In{" "}
        {EXAMPLE.friend}&rsquo;s name it reads:{" "}
        <span className="font-medium">&ldquo;{third}?&rdquo;</span> — and the
        advice comes easily:{" "}
        <span className="italic">&ldquo;{EXAMPLE.advice}&rdquo;</span>
      </p>
      <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
        <span className="font-medium text-[var(--foreground)]">
          Would you take it?
        </span>{" "}
        No — and the block is{" "}
        <span className="font-medium text-[var(--foreground)]">
          {block?.label.toLowerCase()}
        </span>
        .
      </p>
      {outcome === "obstacle" && block ? (
        <div className="mt-4 rounded-lg border border-[var(--accent)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            What the reframe shows
          </p>
          <p className="mt-1.5 text-lg font-semibold tracking-tight text-[var(--foreground)] leading-snug">
            The decision was never the unclear part.
          </p>
          <p className="mt-2 text-sm text-[var(--muted)] leading-relaxed">
            The advice is clear and unheeded, so the work isn&rsquo;t more
            deciding — it&rsquo;s the sunk cost you&rsquo;d never let{" "}
            {EXAMPLE.friend} count. A decade spent is gone either way; the only
            honest question is whether you&rsquo;d start this career fresh today.
            That points straight at one tool, not another round of agonizing.
          </p>
        </div>
      ) : null}
      <p className="mt-4 text-xs text-[var(--muted)] leading-relaxed">
        Your own fields below are blank — put <em>your</em> call in a
        friend&rsquo;s name.
      </p>
    </div>
  );
}
