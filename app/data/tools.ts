/**
 * The working instruments, described by the *moment* you'd reach for each one.
 *
 * The site grew an instrument at a time — the journal, the pre-mortem, the flip
 * point, the cooling-off tool, the consequence trace, the return desk, the
 * trainers — each built for a different shape of moment. But a person who lands
 * here facing a real decision doesn't arrive knowing which of six tools fits;
 * they arrive knowing what their moment *feels* like. Every other index on the
 * site is browse-by-thing: /models is browse-by-concept, /writing is
 * browse-by-essay, /playbook is browse-by-moment but routes to *ideas*. This is
 * the missing one — browse-by-moment that routes to the *instrument* — so the
 * toolkit has a front door you can use at the point of need, not a paragraph
 * you have to parse first.
 *
 * This module is the single source for the toolkit: the /tools page, the
 * homepage, and the search index all draw the tool's name and one-liner from
 * here, so they can't drift apart. `resolveToolGroups` throws at build time if a
 * group references an unknown tool id — the same throw-on-unknown discipline
 * threads.ts and situations.ts use.
 */

export type Payoff = "now" | "later" | "ongoing";

export type Tool = {
  id: string;
  href: string;
  /** Full name, as it reads in the tool's own header. */
  name: string;
  /** Short label for compact contexts (nav, chips). */
  short: string;
  /** The moment, in the second person — what it feels like to be here. */
  when: string;
  /** The single question the tool helps you answer. */
  ask: string;
  /** What the tool does, one line, plain. */
  does: string;
  /**
   * When the value lands. "now" — you get an answer in this one visit. "later" —
   * it sets up a return you make weeks or months from now. "ongoing" — a
   * practice you repeat.
   */
  payoff: Payoff;
};

export const tools: Tool[] = [
  {
    id: "doors",
    href: "/doors",
    name: "Which Door Is This?",
    short: "Which door",
    when: "You're giving a decision real weight — but you haven't asked whether it's even the kind of decision that deserves it. You might be agonizing for weeks over something you could undo in an afternoon.",
    ask: "Can I walk back through this door — and am I spending the right amount of deliberation for it?",
    does: "Sorts the call into a one-way or two-way door by how reversible it really is — so you spend slow, careful thought only where reversal won't save you, and give a fast, undoable call the permission to move it's usually denied.",
    payoff: "now",
  },
  {
    id: "widen",
    href: "/widen",
    name: "What Else Could You Do?",
    short: "Widen",
    when: "You're weighing whether or not to do one thing — take the job, make the move, buy the house — yes or no. It feels like a decision, but there's really only one option on the table and its shadow.",
    ask: "Is this a real choice between options, or one option dressed up as a decision?",
    does: "Catches a 'whether-or-not' frame — the single most common decision mistake — and forces it open: the vanishing-options test and three more lenses to surface the alternatives nobody named, a guard against decoy options that only flatter the first, then hands the real slate on to be compared or weighed.",
    payoff: "now",
  },
  {
    id: "weigh",
    href: "/weigh",
    name: "The Flip Point",
    short: "Flip point",
    when: "You're stuck between two options and keep re-arguing whether the odds are 60% or 70%.",
    ask: "Which side of the line am I on?",
    does: "Finds the probability where the decision flips — p* = R/(B+R) — so you only have to judge which side you're on, not pin down a number you can't know.",
    payoff: "now",
  },
  {
    id: "compare",
    href: "/compare",
    name: "The Halo Comes Off",
    short: "Compare",
    when: "You've got several real options — a few jobs, apartments, offers — and one keeps pulling ahead before you've fairly looked at the rest.",
    ask: "Which one wins on the things that matter — not just the one that made the best first impression?",
    does: "Scores every option one factor at a time, so a single strong impression can't halo the whole choice — then sets the tally against your gut and makes the disagreement the thing you examine.",
    payoff: "now",
  },
  {
    id: "outside",
    href: "/outside",
    name: "You Are Not the Exception",
    short: "Outside view",
    when: "You're about to promise how long something will take or how much it'll cost — and every step of the plan looks doable.",
    ask: "What actually happened to everyone who tried something like this?",
    does: "Seals your own estimate first, then sets it against the real distribution of comparable cases — reference-class forecasting — so the plan's best-case story meets the surprises the class already counted.",
    payoff: "now",
  },
  {
    id: "quit",
    href: "/quit",
    name: "Would You Start It Today?",
    short: "Quit-or-stay",
    when: "You can't tell if it's time to quit — the project, the job, the strategy, the thing with years and money already in it. Everything you've spent argues for one more push.",
    ask: "Am I still here because it's the right call — or because I can't stand to walk away from what I've already put in?",
    does: "Takes the sunk cost out of the vote: asks whether you'd start the thing fresh today, sets one more push against the best other use of the same time and money, and — if you carry on — makes you set the kill criterion in advance.",
    payoff: "now",
  },
  {
    id: "act",
    href: "/act",
    name: "Decided Isn't Done",
    short: "Make it happen",
    when: "You've made the call — and it was the right one — but a week later it's still just a call. Nothing has actually moved.",
    ask: "What's the first concrete move, exactly when will I make it, and what would tell me to stop and reconsider?",
    does: "Turns a decision into an if-then plan that fires on a cue — the smallest first move, a backup for the obstacle, and a tripwire to reconsider — after checking the plan is even the right tool and the problem isn't that you don't want it.",
    payoff: "later",
  },
  {
    id: "trace",
    href: "/trace",
    name: "And Then What?",
    short: "Trace",
    when: "A move looks good right now, but you suspect the bill comes later.",
    ask: "Where does the effect I want turn into the one I have to live with?",
    does: "Traces a decision past its first-order effect — and then what, and then what — and reads the sign pattern to find where it flips on you.",
    payoff: "now",
  },
  {
    id: "cool",
    href: "/cool",
    name: "Cool the Call",
    short: "Cool",
    when: "You're about to decide while hot — angry, panicked, infatuated, or rushed by a clock.",
    ask: "Should I decide this now at all, or once I'm cool?",
    does: "Settles the real choice when you're hot — decide-now-or-later — then hands you two research-backed ways to manufacture the distance to see it straight.",
    payoff: "now",
  },
  {
    id: "regret",
    href: "/regret",
    name: "Ask Your Older Self",
    short: "Older self",
    when: "You keep leaning one way, and you can't tell if that's the real call or just how you feel sitting here right now — not hot, exactly, just a pull you can't tell is durable.",
    ask: "Which way will I be glad I went — ten minutes from now, ten months, ten years?",
    does: "Plays the pull forward to three horizons — ten minutes, ten months, ten years — reads how it changes across them, and weighs it against the regret you can't feel now: the road not taken. So a feeling that won't last can't outvote the one that will.",
    payoff: "now",
  },
  {
    id: "tripwire",
    href: "/tripwire",
    name: "Set a Tripwire",
    short: "Tripwire",
    when: "You've made a call, or seen where one could quietly go wrong later — and you don't want to be the one deciding whether to reconsider once you're in the thick of it.",
    ask: "What signal, on what date, would tell me to stop and re-decide?",
    does: "Turns a decision into a state and a date — an observable signal you can't argue with, set while you're calm — and hands it back to you on that day at the return desk, so a call going wrong can't coast past the point it stopped being right.",
    payoff: "later",
  },
  {
    id: "premortem",
    href: "/premortem",
    name: "The Pre-mortem",
    short: "Pre-mortem",
    when: "You're about to commit to something big and hard to undo.",
    ask: "If this has failed a year from now, what went wrong?",
    does: "Declares the plan dead before it starts, writes the history of the failure, then turns each cause into a fix, an accepted risk, or a tripwire on your calendar.",
    payoff: "later",
  },
  {
    id: "decide",
    href: "/decide",
    name: "The Decision Journal",
    short: "Decide",
    when: "A decision is worth thinking through carefully — and worth remembering how you thought.",
    ask: "What do I expect to happen, and how sure am I?",
    does: "A worksheet that walks the models, records your reasoning and your forecast, and schedules the one thing that teaches: coming back to compare it against what actually happened.",
    payoff: "later",
  },
  {
    id: "debrief",
    href: "/debrief",
    name: "The Outcome Isn't the Verdict",
    short: "Debrief",
    when: "Something already happened — a call that paid off or blew up — and you never logged it in advance. Now you're trying to work out what to actually learn from it.",
    ask: "Am I grading the decision, or just the result it happened to get?",
    does: "Reconstructs the call under a hindsight guard — what you knew then, not what you know now — grades it apart from the outcome, and lands it on the four cells: the win to bank, the win to fix, the loss to keep, the loss to fix.",
    payoff: "now",
  },
  {
    id: "review",
    href: "/review",
    name: "The Return Desk",
    short: "Review",
    when: "A while ago you logged a decision or armed a tripwire — and you want to know if anything's due.",
    ask: "What did I schedule myself to come back and check?",
    does: "Gathers every review and tripwire check you've scheduled across the tools into one queue, and links each straight to where you answer it — so the return stops depending on memory.",
    payoff: "ongoing",
  },
  {
    id: "practice",
    href: "/practice",
    name: "Practice",
    short: "Practice",
    when: "No decision in front of you — you just want to get better at the judgment underneath them.",
    ask: "Which of the three numbers under a forecast is my weakest?",
    does: "Three short trainers — how sure to be, how to reach a number at all, and how much a new fact should move you — shown beside your real record from the journal.",
    payoff: "ongoing",
  },
];

const byId = new Map(tools.map((t) => [t.id, t]));

export function getTool(id: string): Tool {
  const t = byId.get(id);
  if (!t) throw new Error(`Unknown tool id: ${id}`);
  return t;
}

export type ToolGroup = {
  id: string;
  /** The heading — the class of moment these tools serve. */
  title: string;
  /** One line under the heading. */
  blurb: string;
  toolIds: string[];
};

export const toolGroups: ToolGroup[] = [
  {
    id: "deciding-now",
    title: "You're facing a decision right now",
    blurb:
      "Something's in front of you today. Start by asking how much thought it even deserves — then these give you an answer in this one sitting.",
    toolIds: ["doors", "widen", "weigh", "compare", "outside", "trace", "cool", "regret", "quit"],
  },
  {
    id: "big-commitment",
    title: "You're about to commit to something that matters",
    blurb:
      "A choice worth slowing down for — and worth a record you can grade later, when you find out whether you were right.",
    toolIds: ["premortem", "decide"],
  },
  {
    id: "making-it-happen",
    title: "You've made the call — now make it happen",
    blurb:
      "The week after a decision is where most of them quietly die: never started, or never revisited when something changed. These close both gaps — one turns the call into a first move, the other sets the signal that says stop and rethink.",
    toolIds: ["act", "tripwire"],
  },
  {
    id: "coming-back",
    title: "You're coming back to something already decided",
    blurb:
      "The half of the loop that does the teaching — grading a call you scheduled a return on, or one that already resolved and you never logged — plus the practice that keeps the judgment underneath it honest.",
    toolIds: ["review", "debrief", "practice"],
  },
];

export type ResolvedToolGroup = ToolGroup & { tools: Tool[] };

export function resolveToolGroups(): ResolvedToolGroup[] {
  return toolGroups.map((g) => ({ ...g, tools: g.toolIds.map(getTool) }));
}

export const payoffLabel: Record<Payoff, string> = {
  now: "Answers now",
  later: "Sets up a return",
  ongoing: "A practice",
};
