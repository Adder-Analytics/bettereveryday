import { getTool } from "./tools";

/**
 * The guided front door: two or three questions that hand you the one instrument.
 *
 * The toolkit has over a dozen instruments and a good browse-by-moment index at
 * `/tools`. But that page *organizes* the doors — its own header admits the
 * problem it can't solve ("you don't arrive knowing which one you need") — it
 * doesn't *reduce* them. A first-time visitor standing in front of a real,
 * loaded decision won't read a dozen-plus "when you're here" paragraphs to
 * self-diagnose; choice overload at the point of need is exactly how a good tool
 * goes unused. What was missing was the interactive version: answer *which of
 * these is you?*, once or twice, and be handed the single instrument — with your
 * decision already carried in, and the honest next step named.
 *
 * The value this adds over the static index is three things the index can't:
 *   1. It narrows instead of listing — one tight question at a time, not a wall.
 *   2. It carries your decision through — the subject you type here rides the
 *      handoff (see `carry.ts`) so you land on the tool pre-filled, not blank.
 *   3. It names the *itinerary* — most real calls aren't one tool but a short
 *      chain (weigh, then arm a tripwire; pre-mortem, then log it), and each
 *      leaf names the natural next step, which the `/example` walkthroughs show
 *      for one decision but you could never get for your own.
 *
 * This module is data only — a small decision tree — rendered by `FindClient`.
 * Same throw-on-unknown discipline the rest of the site runs on: every tool id a
 * leaf points to is checked against `tools.ts` at module load (via `getTool`),
 * and every `next` is checked to name a real node, so the tree can't silently
 * drift from the toolkit it routes into. It knows nothing about state and
 * persists nothing — it only decides which door to open.
 */

/** A leaf: the instrument an answer routes to, why, and the next step if any. */
export type TriageRec = {
  /** The instrument this answer lands on. Must be an id in `tools.ts`. */
  toolId: string;
  /** Why this one, for the answer that led here — second person, tight. */
  because: string;
  /** The natural next step in the itinerary, if there is one. */
  then?: {
    /** Must be an id in `tools.ts`. */
    toolId: string;
    /** What that next step does *after* this one — second person. */
    note: string;
  };
};

/** One answer at a node: a tell, and where it goes — deeper, or to a leaf. */
export type TriageChoice = {
  /** Stable, unique within its node — the token a chosen path is built from. */
  id: string;
  /** The tell: "which of these is you?" — second person. */
  label: string;
  /** An optional muted sub-line that sharpens the tell. */
  detail?: string;
} & ({ next: string } | { rec: TriageRec });

/** A question and its answers. */
export type TriageNode = {
  id: string;
  /** The question asked here. */
  question: string;
  /** An optional one-line framing under the question. */
  hint?: string;
  choices: TriageChoice[];
};

/** Where the walk starts. */
export const TRIAGE_ROOT = "root";

const nodes: Record<string, TriageNode> = {
  root: {
    id: "root",
    question: "Where are you with this decision?",
    choices: [
      {
        id: "making",
        label: "I have to make the call.",
        detail: "It's in front of me and I have to choose.",
        next: "making",
      },
      {
        id: "after",
        label: "I've made the call — now I have to act on it, or keep it from quietly going wrong.",
        next: "after",
      },
      {
        id: "past",
        label: "It already happened. I want to learn from it.",
        next: "learn",
      },
      {
        id: "sharpen",
        label: "No decision right now — I just want to get sharper.",
        detail: "There's nothing in front of me; I want to train the judgement underneath.",
        rec: {
          toolId: "practice",
          because:
            "No decision in front of you is the right time to train the three numbers under every one — how sure to be, how to reach a number at all, and how much a new fact should move you — drilled against feedback and shown beside your real record from the journal.",
        },
      },
    ],
  },

  making: {
    id: "making",
    question: "What's making it hard?",
    hint: "Most hard calls are hard for one of these reasons. Pick the one that fits best — you can back up and try another.",
    choices: [
      {
        id: "reversible",
        label: "Honestly, I might be over-thinking it.",
        detail: "I've been agonizing — but I could probably undo this if it went wrong.",
        rec: {
          toolId: "doors",
          because:
            "Before you spend another week on it, sort the call by how reversible it really is. Slow, careful deliberation is for the doors that don't swing back; a choice you can walk back deserves the speed you've been denying it.",
          then: {
            toolId: "premortem",
            note: "If it turns out to be a one-way door after all, stress-test it with a pre-mortem before you commit.",
          },
        },
      },
      {
        id: "downside-scary",
        label: "The upside is real — but there's a downside I keep waving off.",
        detail: "\"It probably won't happen.\" Maybe not — but if it did, I'm not sure I'd recover from it.",
        rec: {
          toolId: "ruin",
          because:
            "Before you weigh the odds or the upside, run the survival check they both assume: name the worst realistic outcome and ask whether you'd come back from it. If you'd recover, this is an ordinary risk call — go weigh it. If you wouldn't, no odds and no upside justify it, because there's no \"on average\" for someone who's out of the game — so don't refuse the goal, refuse the un-survivable version of it and cap the downside below ruin.",
          then: {
            toolId: "widen",
            note: "If the worst case is one you couldn't take, widen the frame to find the version of the same ambition whose downside you'd survive.",
          },
        },
      },
      {
        id: "hot",
        label: "I'm deciding while hot.",
        detail: "Angry, panicked, infatuated, or rushed by a clock.",
        rec: {
          toolId: "cool",
          because:
            "The first question isn't which way to go — it's whether to decide this now at all. Settle decide-now-or-later while you're hot, then borrow one of two research-backed ways to manufacture the distance to see it straight.",
        },
      },
      {
        id: "advise-self",
        label: "I could tell a friend exactly what to do — but I can't see my own version straight.",
        detail: "Not hot, just fogged: identical dilemma, obvious to me for anyone else, a blank for me.",
        rec: {
          toolId: "advise",
          because:
            "That's Solomon's paradox — you reason more wisely about a friend's dilemma than your own, and it needs no heat. Put your call in a friend's name, say what you'd tell them, then face the half the reframe skips: would you take that advice? If not, the decision was never unclear — the obstacle was, and naming it is the work.",
          then: {
            toolId: "regret",
            note: "If the pull is really about how a feeling will age rather than advice you won't take, play it forward to your older self across the three horizons.",
          },
        },
      },
      {
        id: "whether-or-not",
        label: "It's a yes-or-no — whether or not to do this one thing.",
        detail: "Take the job or not, make the move or not. One option, weighed against nothing.",
        rec: {
          toolId: "widen",
          because:
            "A “whether or not” is the most common decision trap: it feels like a choice, but it’s one option and its shadow, and it quietly throws away every alternative nobody named. Force the frame open before you weigh a single thing — the vanishing-options test surfaces the real choices you already have.",
          then: {
            toolId: "compare",
            note: "Once you’ve got a real slate, score them past the halo — or if it narrows to two, take those to the flip point.",
          },
        },
      },
      {
        id: "two-odds",
        label: "Two options, and I keep re-arguing the odds.",
        detail: "Is it 60% or 70%? I can't pin the number down.",
        rec: {
          toolId: "weigh",
          because:
            "You don't need the exact probability — you need to know which side of the line you're on. The flip point finds the probability where the decision tips, so all that's left is a higher-or-lower call you can actually make.",
          then: {
            toolId: "tripwire",
            note: "Once you've picked a side, set the signal that would tell you you were wrong.",
          },
        },
      },
      {
        id: "several",
        label: "Several options, and one keeps pulling ahead.",
        detail: "A few jobs, apartments, or offers — and one made the best first impression.",
        rec: {
          toolId: "compare",
          because:
            "Score them one factor at a time, so a single strong impression can't halo the whole choice — then set the tally against your gut and make the disagreement the thing you examine.",
          then: {
            toolId: "weigh",
            note: "If two finalists end up too close to call, take both to the flip point.",
          },
        },
      },
      {
        id: "keep-looking",
        label: "There's always another option — I can't tell when to stop looking.",
        detail: "Apartments, jobs, candidates coming one at a time; each is take-it-or-leave-it, and I might be settling early or holding out too long.",
        rec: {
          toolId: "stop",
          because:
            "When options arrive in a sequence and passing is final, there's a proven answer: look at (and pass) the first 37% to learn what good looks like, then take the first that beats them all. It names the two ways people fail — grabbing the first shiny thing, and passing the best one hoping — and tells you which side of the line you're on right now.",
          then: {
            toolId: "act",
            note: "When one clears the bar, commit it before it's gone — turn “this is the one” into the first concrete move.",
          },
        },
      },
      {
        id: "leaning-unsure",
        label: "I keep leaning one way, but can't tell if it's the real call or just how I feel right now.",
        detail: "Not hot exactly — a pull toward comfort, or a new thing's shine, that I can't tell is durable.",
        rec: {
          toolId: "regret",
          because:
            "Play the pull forward to ten minutes, ten months, ten years — a feeling that's loud now often lies about how long it lasts. Read whether it holds or evaporates, then weigh it against the regret you can't feel today: the road not taken.",
          then: {
            toolId: "act",
            note: "If your older self endorses it, turn the call into the first concrete move before the moment passes.",
          },
        },
      },
      {
        id: "later-bill",
        label: "It looks good right now, but I suspect the bill comes later.",
        rec: {
          toolId: "trace",
          because:
            "Follow the decision past its first-order effect — and then what, and then what — until you find where the effect you want turns into the one you'll have to live with.",
          then: {
            toolId: "tripwire",
            note: "If the later cost is real, set a tripwire for the turn so it can't sneak up on you.",
          },
        },
      },
      {
        id: "promise",
        label: "I'm about to promise a timeline or a budget.",
        detail: "Every step of the plan looks doable.",
        rec: {
          toolId: "outside",
          because:
            "Seal your own estimate first, then set it against what actually happened to everyone who tried something like this — the surprises the plan's best-case story quietly leaves out.",
          then: {
            toolId: "premortem",
            note: "If the plan still holds, pre-mortem the surprises the class already counts.",
          },
        },
      },
      {
        id: "already-sure",
        label: "I'm fairly sure it's the right call — I just want to pressure-test that before I commit.",
        detail: "I've mostly been collecting reasons it'll work. I haven't really tried to prove myself wrong.",
        rec: {
          toolId: "test",
          because:
            "“Fairly sure” is the exact state that stops you looking — once you're leaning, research quietly turns into building the case for what you already wanted. Name the one assumption the whole call rests on, force out what would prove it false, and check whether you've gone looking for that or only its opposite. Then, where you can, run the cheapest real test instead of trusting the prediction.",
          then: {
            toolId: "decide",
            note: "If it survives, log what you expect and how sure you are — so reality, not memory, grades the call later.",
          },
        },
      },
      {
        id: "need-more",
        label: "I keep feeling I need to know more before I can decide.",
        detail: "One more data point, one more opinion, one more week of research — and I can't tell if that's diligence or a way to put off deciding.",
        rec: {
          toolId: "enough",
          because:
            "Run the value-of-information test before you gather another thing: name the one fact you're waiting on, then say what you'd do under each way it could turn out. If your move is the same either way, you already have enough — more research is delay, not diligence. Only a fact that would actually change the call is worth chasing, and only when it's cheap and in time.",
          then: {
            toolId: "test",
            note: "If the missing fact would change the call, don't predict it — design the cheapest real test that would settle it before you commit.",
          },
        },
      },
      {
        id: "sunk",
        label: "I've put years or money in, and can't tell if I should walk away.",
        rec: {
          toolId: "quit",
          because:
            "Take the sunk cost out of the vote: ask whether you'd start this fresh today, and weigh one more push against the best other use of the same time and money.",
          then: {
            toolId: "tripwire",
            note: "If you carry on, set the kill criterion now — while you're calm enough to mean it.",
          },
        },
      },
      {
        id: "big-undo",
        label: "It's big and hard to undo — I want to stress-test it first.",
        rec: {
          toolId: "premortem",
          because:
            "Declare it already failed a year from now and write the history of what went wrong — imagining a failure as real surfaces the causes a hopeful forward look never will. Then turn each cause into a fix, an accepted risk, or a tripwire.",
          then: {
            toolId: "decide",
            note: "Then log what you expect, so reality can grade the call later — not just the outcome.",
          },
        },
      },
    ],
  },

  after: {
    id: "after",
    question: "You've decided. What does it need now?",
    hint: "The week after a decision is where most of them quietly die — never started, or never revisited when something changed.",
    choices: [
      {
        id: "stalled",
        label: "It's still just a call — nothing has actually moved.",
        rec: {
          toolId: "act",
          because:
            "Turn the decision into an if-then plan that fires on a cue: the smallest first move, a backup for the obstacle you'll hit, and a tripwire to reconsider — after a quick check that the plan is even the right fix.",
          then: {
            toolId: "tripwire",
            note: "Arm the reconsider signal too, so a good call can't quietly curdle after it's underway.",
          },
        },
      },
      {
        id: "protect",
        label: "I want to set the signal that would tell me to stop and reconsider.",
        rec: {
          toolId: "tripwire",
          because:
            "Turn the decision into a state and a date — an observable signal you can't argue with, set while you're calm — and have it handed back to you on that day at the return desk.",
          then: {
            toolId: "act",
            note: "Not actually started yet either? Turn the call into its first concrete move.",
          },
        },
      },
      {
        id: "record",
        label: "I want to write down what I expect, so I can grade it later.",
        rec: {
          toolId: "decide",
          because:
            "Record your reasoning and your forecast now, while you still remember what you knew — then schedule the one thing that teaches: coming back to compare it against what actually happened.",
          then: {
            toolId: "review",
            note: "The return desk gathers that look-back and hands it back to you when it's due.",
          },
        },
      },
    ],
  },

  learn: {
    id: "learn",
    question: "Back when you decided, did you write down what you expected?",
    hint: "It changes what there is to learn from — and how to keep hindsight from rewriting the story.",
    choices: [
      {
        id: "no-log",
        label: "No — I never logged it in advance.",
        rec: {
          toolId: "debrief",
          because:
            "Reconstruct the call under a hindsight guard — what you knew then, not what you know now — grade the decision apart from the outcome it happened to get, and land it on the four cells: the win to bank, the win to fix, the loss to keep, the loss to fix.",
          then: {
            toolId: "decide",
            note: "Start logging the next one in advance, so reality can grade it fairly instead of from memory.",
          },
        },
      },
      {
        id: "logged",
        label: "Yes — I logged it and scheduled a look-back.",
        rec: {
          toolId: "review",
          because:
            "Then it's already waiting for you. The return desk gathers every review and tripwire you scheduled across the tools into one queue, and links each straight to where you answer it.",
          then: {
            toolId: "debrief",
            note: "For the calls you never logged, the debrief grades them honestly after the fact.",
          },
        },
      },
    ],
  },
};

export function getTriageNode(id: string): TriageNode {
  const n = nodes[id];
  if (!n) throw new Error(`Unknown triage node: ${id}`);
  return n;
}

/**
 * Validate the whole tree at module load, the same throw-on-unknown discipline
 * `resolveToolGroups` and `resolveSituation` use: every leaf must point at a
 * real tool, every branch at a real node, and every choice must do exactly one
 * of the two. A drift between this tree and the toolkit fails the build, not a
 * user's click.
 */
function validateTriage(): void {
  if (!nodes[TRIAGE_ROOT]) throw new Error(`Missing triage root node: ${TRIAGE_ROOT}`);
  for (const node of Object.values(nodes)) {
    const seen = new Set<string>();
    for (const choice of node.choices) {
      if (seen.has(choice.id)) {
        throw new Error(`Duplicate triage choice id "${choice.id}" in node "${node.id}"`);
      }
      seen.add(choice.id);
      const hasNext = "next" in choice;
      const hasRec = "rec" in choice;
      if (hasNext === hasRec) {
        throw new Error(
          `Triage choice "${node.id}/${choice.id}" must have exactly one of next|rec`
        );
      }
      if (hasNext) {
        if (!nodes[choice.next]) {
          throw new Error(
            `Triage choice "${node.id}/${choice.id}" points to unknown node "${choice.next}"`
          );
        }
      } else {
        // Throws if the tool id (or the next-step tool id) is unknown.
        getTool(choice.rec.toolId);
        if (choice.rec.then) getTool(choice.rec.then.toolId);
      }
    }
  }
}

validateTriage();
