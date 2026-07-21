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
      "Something's in front of you today. These give you an answer in this one sitting.",
    toolIds: ["weigh", "compare", "outside", "trace", "cool"],
  },
  {
    id: "big-commitment",
    title: "You're about to commit to something that matters",
    blurb:
      "A choice worth slowing down for — and worth a record you can grade later, when you find out whether you were right.",
    toolIds: ["premortem", "decide"],
  },
  {
    id: "coming-back",
    title: "You're coming back, or sharpening the blade",
    blurb:
      "The half of the loop that does the teaching — and the practice that keeps the judgment underneath it honest.",
    toolIds: ["review", "practice"],
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
