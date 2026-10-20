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

/**
 * A labelled cluster of a node's choices. A node with a long list of answers
 * (the "what's making it hard?" node has eighteen) would otherwise hand the
 * visitor the exact wall this module exists to remove. Grouping keeps it one
 * click — no extra question is asked — but lets the eye skip whole clusters by
 * their heading and read only the three or four lines that could be you.
 */
export type TriageGroup = {
  /** Stable, unique within its node — used for in-page anchors. */
  id: string;
  /** The cluster's heading — what kind of hard this is. */
  label: string;
  /** Short name for the jump row above the list. */
  short: string;
  /** The choice ids in this cluster, in display order. */
  choiceIds: string[];
};

/** A question and its answers. */
export type TriageNode = {
  id: string;
  /** The question asked here. */
  question: string;
  /** An optional one-line framing under the question. */
  hint?: string;
  choices: TriageChoice[];
  /**
   * Optional clusters for a long list. When present, every choice must sit in
   * exactly one group (checked at module load), and the groups set the order.
   */
  groups?: TriageGroup[];
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
    hint: "Most hard calls are hard for one of these reasons. Skim the headings, then pick the one line that fits best — you can back up and try another.",
    groups: [
      {
        id: "options",
        label: "It's the options themselves",
        short: "The options",
        choiceIds: ["whether-or-not", "two-odds", "even", "several", "keep-looking", "time-money", "repair", "monthly", "subscriptions", "trial"],
      },
      {
        id: "stakes",
        label: "It's what could go wrong — or whether it's as big as it feels",
        short: "The stakes",
        choiceIds: ["downside-scary", "insure-it", "big-undo", "later-bill", "promise", "reversible"],
      },
      {
        id: "head",
        label: "It's my own read I can't trust",
        short: "My own read",
        choiceIds: ["hot", "advise-self", "leaning-unsure", "already-sure"],
      },
      {
        id: "loop",
        label: "I keep going round in circles",
        short: "Going in circles",
        choiceIds: ["need-more", "sunk", "recurring"],
      },
      {
        id: "people",
        label: "It's other people",
        short: "Other people",
        choiceIds: ["being-sold", "negotiate", "far-off-ask", "disagree", "group-number", "split-rooms", "chores", "bills", "lend"],
      },
    ],
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
        id: "recurring",
        label: "It's not one decision — it's the same call I keep facing.",
        detail: "The after-hours message, the impulse buy, the \"quick\" favour. I re-decide it every time, usually while tired or tempted, and usually the way I later regret.",
        rec: {
          toolId: "rule",
          because:
            "A decision you face over and over isn't solved by deciding it better each time — it's solved by deciding it once, as a standing rule, so the fight simply doesn't get held under pressure. Check it actually recurs, force the call into a bright line you can tell you've broken, and name the rare exceptions that should genuinely override it — binding against your predictable weakness, not against the news that you were wrong.",
          then: {
            toolId: "tripwire",
            note: "A rule is a standing decision, not a life sentence — arm its review as a tripwire so it comes back on its date to be re-endorsed, not obeyed on autopilot.",
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
        id: "even",
        label: "Two good options, and however I weigh them it comes out even.",
        detail: "Each gives me something the other can't. I've made the list more than once, and I keep thinking one more pass will settle it.",
        rec: {
          toolId: "par",
          because:
            "First find out what kind of even this is. If a small gain to either option would settle it, they're simply equal: flip a coin and stop. If a fact you could find out would settle it, go and find it out. But if nothing small tips it, the two are on a par: good in different ways that no scale ranks. Then there's no hidden answer for more weighing to find, and you settle it by committing to the one you'll stand behind.",
          then: {
            toolId: "act",
            note: "Once you've committed, make the first move this week — a commitment that lives only in your head drifts back to whatever happens by default.",
          },
        },
      },
      {
        id: "time-money",
        label: "One option costs more money, the other more time, and I can't tell if it's worth it.",
        detail: "Delivery or the shop, the direct flight or the cheap one, the closer flat or the cheaper one.",
        rec: {
          toolId: "worth",
          because:
            "Time and money only compare once they're in the same unit. Work out what the trade costs or pays per hour, and set it against what an hour like that is worth to you. Then check the percentage isn't doing the deciding: the same saving looks big on a cheap thing and small on a dear one.",
          then: {
            toolId: "rule",
            note: "If it's a trade you face every week, make your answer a standing rule, so the next one doesn't need the sum.",
          },
        },
      },
      {
        id: "repair",
        label: "Something's broken: pay for the repair, or buy a new one?",
        detail: "The washing machine, the laptop, the car with a big garage quote, the boiler.",
        rec: {
          toolId: "fix",
          because:
            "Divide the quote by what a new one costs per year of use. That's how long the repair has to keep it going to win, and it's a question you can actually answer, or ask the repairer. What you've already spent on it doesn't count either way.",
          then: {
            toolId: "rule",
            note: "Something else will break. Make the division your standing rule, so the next quote is a lookup.",
          },
        },
      },
      {
        id: "monthly",
        label: "There's a price, or a monthly plan for it, and the monthly one looks easier.",
        detail: "'Or £59.99 a month', interest-free over a year, four payments at the checkout, phone or car finance.",
        rec: {
          toolId: "monthly",
          because:
            "The monthly figure is the smallest number on the page and hides the rate. Add up every payment, compare it with the price today, and turn the difference into a yearly rate. Then ask whether you'd buy it at this price without the plan.",
          then: {
            toolId: "cover",
            note: "The same checkout usually offers cover on it next. Decide whether that loss is one to insure or one to carry.",
          },
        },
      },
      {
        id: "subscriptions",
        label: "A subscription keeps renewing, and I'm not sure it's still worth it.",
        detail: "The gym, a streaming service, an app, a yearly membership, a box that arrives every fortnight.",
        rec: {
          toolId: "keep",
          because:
            "A renewal is a decision made by default. Count last month's uses, not the ones you plan, and ask the fresh-start question: would you sign up today at this price? If you're not sure and you could rejoin in a minute, cancelling is the cheap experiment.",
          then: {
            toolId: "rule",
            note: "The next free trial is already on its way. Make a once-a-year review your standing rule.",
          },
        },
      },
      {
        id: "trial",
        label: "I'm signing up for a free trial, and I'll cancel if it's not worth it.",
        detail: "A week free, a month free, the first box on the house. It asks for a card number.",
        rec: {
          toolId: "trial",
          because:
            "A free trial is a subscription whose default is already chosen: do nothing and it becomes a payment. The cheap moment to change that is now, at sign-up. If cancelling keeps the free time, cancel today. If not, put the cancel-by date where it'll fire, with the question waiting.",
          then: {
            toolId: "keep",
            note: "The trials you didn't catch are subscriptions now. Go through them with the fresh-start question.",
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
        id: "insure-it",
        label: "I'm being offered cover against it going wrong, and I can't tell if it's worth it.",
        detail: "An extended warranty, phone cover, a rental car's waiver, a lower excess for a higher premium.",
        rec: {
          toolId: "cover",
          because:
            "Insure the losses you couldn't pay yourself, and carry the ones you could. For a loss you could carry, the cover's price over what it would pay is the chance of a claim it needs to beat — and sellers price above it, while buyers tend to guess the odds high.",
          then: {
            toolId: "rule",
            note: "The offer comes back at every till. Make your answer a standing rule so the next one is a lookup.",
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
        id: "being-sold",
        label: "Someone's pushing this — and they stand to gain from my yes.",
        detail: "An adviser, an agent, a salesperson, a boss, a friend with a stake. The advice might be right, but I can't tell how much is the advice and how much is their interest.",
        rec: {
          toolId: "incentives",
          because:
            "Before you weigh advice you were handed, find out whose side the incentive is on. Name what the messenger gains from your yes, then ask the question that sorts it: if the best thing for you were the worst thing for them, would they still be telling you this? If yes, weigh it on the merits. If no, the incentive is doing the talking — so don't just distrust them, get the same recommendation from someone paid differently, or change the structure so their pay tracks your outcome.",
          then: {
            toolId: "widen",
            note: "Then widen the frame to the options an incentivized messenger never mentions — the ones they don't get paid for.",
          },
        },
      },
      {
        id: "negotiate",
        label: "I'm about to negotiate a number — and I don't know where my line is.",
        detail: "A job offer, a raise, a car, a house, a rate for my work. I know roughly what I hope for and roughly what's too low.",
        rec: {
          toolId: "walkaway",
          because:
            "Set the line before you're in the room, because in the room it gets set by their first number and by how much you want the conversation over. Your walk-away comes from what you'll actually do if this falls through, adjusted for what this deal offers beyond the number. Then set a target you can justify out loud, and decide who names the first number.",
          then: {
            toolId: "decide",
            note: "Log the line and the deal you expect, so afterwards you can grade the preparation, not just the price.",
          },
        },
      },
      {
        id: "far-off-ask",
        label: "Someone's asked me to do something weeks or months away, and yes is easy to say now.",
        detail: "A talk, a committee, a favour, a trip. That week looks empty from here.",
        rec: {
          toolId: "later",
          because:
            "Future weeks always look emptier than they turn out to be, so a far-off yes is paid for with time you won't have. Count the real hours, prep and travel included, then picture it landing next week, out of the week you actually have. Whatever you'd say then is your answer now.",
          then: {
            toolId: "rule",
            note: "If you get this kind of ask often, decide it once as a rule, so the next one doesn't need a sitting.",
          },
        },
      },
      {
        id: "disagree",
        label: "It's not mine alone — someone I have to decide this with sees it differently.",
        detail: "A partner, a cofounder, family. We've argued it in circles and we're no closer.",
        rec: {
          toolId: "crux",
          because:
            "You're probably not having one argument — you're having up to three at once: a disagreement about what's true, a disagreement about what you each want, and a disagreement about how much risk is okay. Each has a different resolution — evidence for a fact, a fair procedure for a values split, a survival check for a risk gap — so arguing them as one is why it goes in circles. Separate the strands, then find the crux: the one thing that, if it went the other way, would change a mind.",
          then: {
            toolId: "compare",
            note: "If it comes down to a values split, make the weights explicit — you'll usually find you agree on every factor but one.",
          },
        },
      },
      {
        id: "group-number",
        label: "We have to agree on a number together — and whoever speaks first will set it.",
        detail: "A deadline, a budget, a price to offer, the odds it works. In the meeting, the first number said becomes everyone's.",
        rec: {
          toolId: "round",
          because:
            "Don't talk first. Have everyone commit a number privately, reveal them all at once, and read the spread. Close together means you already agree, so take the middle and stop. Far apart means you're picturing different things. The two ends explain what they were counting, then everyone answers again privately, and the group's number is the middle of that second round.",
          then: {
            toolId: "outside",
            note: "If the number is a timeline or a budget, check the group's middle against what happened to projects like it — a room shares its optimism.",
          },
        },
      },
      {
        id: "split-rooms",
        label: "We're sharing a place and have to split the rent — but the rooms aren't equal.",
        detail: "One has its own bathroom, one is the box room. Who takes which, and who pays what?",
        rec: {
          toolId: "split",
          because:
            "An equal split is only fair if you all want different rooms. Have each person privately price every room so they wouldn't mind which they got, with their prices adding up to the rent. Then give the rooms to whoever values them most as a set, and set the rents so nobody would rather have someone else's room at its price.",
          then: {
            toolId: "crux",
            note: "If someone won't accept the split, it's usually one room and one disagreement — a fact about it or what matters more. Find which, settle it, and price again.",
          },
        },
      },
      {
        id: "chores",
        label: "We share a home, and the chores have quietly landed on one of us.",
        detail: "Nobody divided them; they settled. Each of us thinks we do more than our share.",
        rec: {
          toolId: "chores",
          because:
            "Everyone overcounts their own share of joint work, because your own effort comes to mind more easily than anyone else's. So start with one list instead of two memories, and put the remembering on it too: the meal planning, the bills, noticing what's run out. Then have each person say how much they mind each chore. You won't mind the same ones, and that's the opening: give each chore to whoever minds it least, and each of you can do less than half as you count it.",
          then: {
            toolId: "crux",
            note: "If one chore stays stuck, it's usually one disagreement: about how long it takes, or how well it has to be done. Find which.",
          },
        },
      },
      {
        id: "bills",
        label: "We share the bills, but one of us earns a lot more.",
        detail: "We split everything in half when we moved in. Now it doesn't feel right, and neither of us has said so.",
        rec: {
          toolId: "bills",
          because:
            "Half each, in proportion to pay, and pooling it all are each fair, by a different principle: equal in, the same share of what you earn, or the same left over. So the row is rarely about the numbers. Put the three side by side in money first, so you can see what the choice is actually worth, then choose the principle that fits the two of you, together.",
          then: {
            toolId: "chores",
            note: "If one of you earns less partly because they do more at home, the bills are only half the picture. Split the housework on purpose too.",
          },
        },
      },
      {
        id: "lend",
        label: "Someone close has asked to borrow money, or to co-sign a loan.",
        detail: "A brother short for the car repair, a friend short on rent until payday, a cousin who needs a guarantor.",
        rec: {
          toolId: "lend",
          because:
            "A loan between friends puts a score inside a relationship that usually doesn't keep one, and a large share of these loans never come back. So start from the most you could give and never think about again. Up to that, give it and say it's a gift. Beyond it, lend only what you could wait for, written down with dates, or say no and help another way. Co-signing is promising to pay all of it.",
          then: {
            toolId: "rule",
            note: "Asks like this come again. Decide your line once, cold, so the next one isn't decided on the doorstep.",
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

/** A node's choices, clustered by its groups (or one unlabelled cluster). */
export function groupChoices(
  node: TriageNode
): { group: TriageGroup | null; choices: TriageChoice[] }[] {
  if (!node.groups) return [{ group: null, choices: node.choices }];
  const byId = new Map(node.choices.map((c) => [c.id, c]));
  return node.groups.map((group) => ({
    group,
    choices: group.choiceIds.map((id) => byId.get(id)!),
  }));
}

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
    if (node.groups) {
      // Every choice in exactly one group — a choice left out of the groups
      // would silently vanish from the page, which is worse than a wall.
      const placed = new Set<string>();
      const groupIds = new Set<string>();
      for (const group of node.groups) {
        if (groupIds.has(group.id)) {
          throw new Error(`Duplicate triage group id "${group.id}" in node "${node.id}"`);
        }
        groupIds.add(group.id);
        for (const id of group.choiceIds) {
          if (!seen.has(id)) {
            throw new Error(`Triage group "${node.id}/${group.id}" names unknown choice "${id}"`);
          }
          if (placed.has(id)) {
            throw new Error(`Triage choice "${node.id}/${id}" is in more than one group`);
          }
          placed.add(id);
        }
      }
      for (const id of seen) {
        if (!placed.has(id)) {
          throw new Error(`Triage choice "${node.id}/${id}" is in no group`);
        }
      }
    }
  }
}

validateTriage();
