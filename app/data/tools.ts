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
  /**
   * Slugs of essays whose *idea* this instrument is the *practice* of — the
   * whether-or-not essay for the widener, the second-order essay for the trace.
   * The essay page reads this to bridge from reading the idea to working it on
   * your own decision, the same way `Model.essays` bridges an essay to a concept.
   * Only strong 1:1 matches belong here, so the bridge stays high-signal.
   */
  essays?: string[];
  /**
   * Ids of the mental models (`models.ts`) this instrument is the *practice* of —
   * `reversibility` for the door triage, `decision-threshold` for the flip point,
   * `pre-mortem` and `inversion` for the pre-mortem room. The exact twin of
   * `essays` above, one surface over: an essay explains an idea in prose, a model
   * defines it as a concept, and both should point at the instrument that runs it
   * on a decision of your own. The models page reads this (via `getToolsForModel`)
   * to bridge from understanding an idea to working it — the same move the essay
   * page makes, on the site's other idea surface. Declaring both `essays` and
   * `models` on the tool keeps every "this instrument practices these ideas"
   * relationship in one file, and lets each idea surface reverse-look-it-up so the
   * two directions can't drift. Only strong 1:1 matches belong here.
   */
  models?: string[];
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
    models: ["reversibility"],
  },
  {
    id: "ruin",
    href: "/ruin",
    name: "Can You Survive the Worst Case?",
    short: "Survive it",
    when: "A call with real upside — but a bad tail you keep waving off with \"it probably won't happen.\" You're weighing the odds and the reward, and haven't stopped to ask whether the worst case is one you'd actually walk away from.",
    ask: "If the worst realistic outcome happened, would I recover — or is this a bet I can't afford to lose?",
    does: "Runs the survival check the rest of the kit quietly defers to. Separates a loss you'd recover from (an ordinary risk call — go weigh it) from a ruin you can't come back from, where no odds and no upside justify it. For a ruin, it doesn't say \"don't\" — it hands you the way to cap the downside below ruin and take the version you'd survive.",
    payoff: "now",
    models: ["ruin", "margin-of-safety"],
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
    models: ["narrow-framing"],
    essays: ["whether-or-not"],
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
    models: ["decision-threshold", "expected-value", "loss-aversion"],
    essays: ["the-flip-point", "loss-aversion"],
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
    models: ["halo-effect", "anchoring", "mediating-assessments"],
    essays: ["anchoring"],
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
    models: ["outside-view", "base-rates", "availability-heuristic"],
    essays: ["nobody-thinks-theyre-the-base-rate", "availability-heuristic"],
  },
  {
    id: "test",
    href: "/test",
    name: "Could You Be Wrong?",
    short: "Reality-test",
    when: "You're fairly sure this is the right call — but 'fairly sure' is exactly the state that stops you looking. You've been gathering reasons it'll work, not reasons it won't.",
    ask: "What would prove me wrong — and have I actually gone looking for it, or can I just test it?",
    does: "Names the one assumption the decision rests on, forces out what evidence would falsify it, and checks whether you've sought that or only its opposite — the antidote to confirmation bias. Then, where you can, turns a confident prediction into the cheapest real experiment that would settle it before you commit.",
    payoff: "now",
    models: ["reality-testing"],
    essays: ["the-plan-was-never-tried"],
  },
  {
    id: "incentives",
    href: "/incentives",
    name: "Who Gains If You Say Yes?",
    short: "Who gains",
    when: "Someone's recommending, selling, or urging you toward a choice — an adviser, an agent, a salesperson, a boss, a friend with a stake — and they've got something to gain from your yes. The advice might be right, but you can't tell how much is the advice and how much is the incentive.",
    ask: "Once I subtract what the messenger gets out of my yes, does this recommendation still hold?",
    does: "Runs Munger's 'show me the incentive' on the advice you were handed. Separates a source whose interests track yours (weigh it on the merits) from one who wins whether or not you do (worth what it'd be worth from someone unpaid) — and where they diverge, hands you the ways to get the incentive-free version rather than just distrust everyone.",
    payoff: "now",
    models: ["incentive-structures"],
  },
  {
    id: "enough",
    href: "/enough",
    name: "Enough to Decide?",
    short: "Enough",
    when: "You keep telling yourself you need to know more before you can decide — one more data point, one more opinion, one more week of research. You can't tell if that's diligence or a way to not decide.",
    ask: "Would what I'm about to go find out actually change my call — or do I already have enough?",
    does: "Runs Hubbard's value-of-information test without the math: name the one thing you're waiting to learn, say what you'd do under each way it could land, and if the answer's the same either way, you already have enough — more research is delay. If it would flip the call, it's worth getting only when it's cheap and in time, and hands you the tool for that.",
    payoff: "now",
    models: ["value-of-information"],
  },
  {
    id: "stop",
    href: "/stop",
    name: "When Do You Stop Looking?",
    short: "Stop looking",
    when: "You're searching — apartments, jobs, candidates, a used car — and they come one at a time. Every decent one asks the same question: take it, or hold out for something better? You can't tell if you're being careful or just never satisfied.",
    ask: "Have I looked at enough to commit to this one — or am I settling early, or holding out too long?",
    does: "Runs the secretary-problem answer without the math: look at (and pass) the first ~37% of the field to learn what good looks like, then take the first that beats them all. Names the two failure modes — grabbing the first shiny thing, and passing the best one hoping — and tells you which side of the line you're on right now.",
    payoff: "now",
    models: ["optimal-stopping"],
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
    models: ["opportunity-cost"],
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
    models: ["implementation-intentions"],
    essays: ["deciding-and-doing"],
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
    models: ["second-order-effects", "goodharts-law"],
    essays: ["second-order-thinking", "the-bill-comes-later", "metric-not-the-mission"],
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
    models: ["self-distancing"],
    essays: ["advice-you-dont-take", "the-option-to-wait"],
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
    models: ["self-distancing"],
    essays: ["advice-you-dont-take"],
  },
  {
    id: "advise",
    href: "/advise",
    name: "Advise a Friend",
    short: "Advise a friend",
    when: "You could tell a friend exactly what to do in your situation — but your own identical version stays a fog. You're not hot, just unable to see your own call the way you'd see anyone else's.",
    ask: "What would I tell a friend in this spot — and would I actually take that advice myself?",
    does: "Puts your decision in a friend's name so the answer comes clear (Solomon's paradox), then asks the harder half: would you take it? If not, it names the real obstacle — fear, sunk cost, other people's opinion, the comfort of not choosing — and hands you the tool built for it.",
    payoff: "now",
    models: ["self-distancing"],
    essays: ["advice-you-dont-take"],
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
    models: ["tripwires"],
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
    models: ["pre-mortem", "inversion"],
    essays: ["hold-the-funeral-first"],
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
    essays: ["experience-doesnt-teach"],
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
    essays: ["decision-quality", "the-honest-number-comes-after"],
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
    essays: ["the-return", "the-last-inch"],
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
    models: ["calibration", "fermi-estimation", "base-rates"],
    essays: ["three-numbers-for-an-uncertain-world", "the-compound-needs-evidence", "your-ninety-percent", "how-much-should-this-change-your-mind", "guessing-on-purpose", "orders-of-magnitude"],
  },
];

const byId = new Map(tools.map((t) => [t.id, t]));

export function getTool(id: string): Tool {
  const t = byId.get(id);
  if (!t) throw new Error(`Unknown tool id: ${id}`);
  return t;
}

/**
 * The instruments whose idea a given essay explores — the bridge from reading
 * about a way of thinking to working it on a decision of your own. Preserves the
 * registry order, so the more foundational instruments lead. Mirrors
 * `getThreadsForEssay` in threads.ts.
 */
export function getToolsForEssay(slug: string): Tool[] {
  return tools.filter((t) => t.essays?.includes(slug));
}

/**
 * The instruments that practice a given mental model — the bridge from
 * understanding an idea as a concept to running it on a decision of your own.
 * The twin of `getToolsForEssay`, keyed by a model id instead of an essay slug,
 * so the models page can offer the instrument the way the essay page does.
 * Preserves registry order, so the more foundational instruments lead.
 */
export function getToolsForModel(modelId: string): Tool[] {
  return tools.filter((t) => t.models?.includes(modelId));
}

/**
 * The size of the toolkit, derived from the registry.
 *
 * For fifteen sessions the count lived in the prose as an English word, copied
 * into five places — the guided front door's header and its browse link, the
 * walkthrough, the router's own comment, the search index — and every one of
 * them silently went stale the moment a tool was added. By the seventeenth
 * instrument the whole site was still telling people it held fifteen. The names
 * and one-liners already flow from this module alone so they can't drift; the
 * count never did, and drift is exactly what a hardcoded number invites. This is
 * the missing single source: every surface that names a number now reads it from
 * here, so the toolkit can't misreport its own size again.
 */
export const toolCount = tools.length;

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty"];

/**
 * Spell a small non-negative integer for prose ("seventeen"). Covers the range
 * the toolkit could plausibly grow into; anything larger falls back to digits,
 * so the helper degrades to something true rather than throwing.
 */
export function spellCount(n: number): string {
  if (!Number.isInteger(n) || n < 0) return String(n);
  if (n < 20) return ONES[n];
  if (n < 60) {
    const tens = TENS[Math.floor(n / 10)];
    const ones = n % 10;
    return ones === 0 ? tens : `${tens}-${ONES[ones]}`;
  }
  return String(n);
}

/** The toolkit's size, spelled for prose ("seventeen"). */
export const toolCountWord = spellCount(toolCount);

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
    toolIds: ["doors", "ruin", "widen", "weigh", "compare", "outside", "test", "incentives", "enough", "stop", "trace", "cool", "regret", "advise", "quit"],
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
