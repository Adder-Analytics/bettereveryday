import { models } from "./models";
import { posts } from "./posts";
import { notes } from "./notes";
import { getTool } from "./tools";

/**
 * A "situation" is a moment in real life — a decision you're in, a number
 * someone just put in front of you — paired with the handful of models worth
 * reaching for in it, and the specific move each one prompts *here*.
 *
 * The models page is browse-by-concept: useful once you already know which
 * idea you need. This is the other direction — browse-by-moment — so the
 * reference can be used at the point of need, when you can't yet name the tool.
 *
 * Each model/essay/note is referenced by id/slug so titles resolve from the
 * source data and can't drift; an unknown reference throws at build time (see
 * resolveSituation), the same throw-on-unknown discipline threads.ts uses.
 */
export type SituationModel = {
  /** Must match an id in models.ts. */
  id: string;
  /** The concrete move this model prompts in *this* situation. */
  move: string;
};

/**
 * The one working instrument built for *this* moment — the bridge from the
 * idea to the thing that does it. The models tell you how to think here; a
 * SituationTool hands you the purpose-built tool one click away, so the
 * playbook stops leaving you at "now go do it yourself." Not every situation
 * has a dedicated instrument (some are best worked through in the general
 * journal, which every situation already links to); this is only set where a
 * tool is genuinely *the* instrument for the moment.
 */
export type SituationTool = {
  /** Must match an id in tools.ts. */
  id: string;
  /** What the instrument does specifically here — plain, second person. */
  move: string;
};

export type Situation = {
  id: string;
  /** The moment, in the second person — "You're about to…". */
  title: string;
  /** One line setting the scene: what it feels like to be here. */
  scene: string;
  /** The single operative question to ask yourself in this situation. */
  question: string;
  models: SituationModel[];
  /** The purpose-built instrument for this moment, if one exists. */
  tool?: SituationTool;
  /** Slugs of essays that go deeper on this situation. */
  essays?: string[];
  /** Slugs of reading notes worth pairing with it. */
  notes?: string[];
};

export const situations: Situation[] = [
  {
    id: "one-way-door",
    title: "You're about to commit to something you can't easily undo",
    scene:
      "A job, a house, a surgery, a co-founder, a move across the country. The kind of choice that doesn't come with a back button.",
    question: "Is this door actually one-way — and if so, what would make me regret walking through it?",
    models: [
      {
        id: "reversibility",
        move: "First decide how reversible this really is. Most choices are two-way doors and deserve speed; spend your slow, careful deliberation only on the ones that genuinely don't swing back.",
      },
      {
        id: "pre-mortem",
        move: "Assume it's a year later and this went badly. Write the story of why. Failures you couldn't feel in advance become visible the moment you imagine them as already real.",
      },
      {
        id: "inversion",
        move: "Stop asking how this succeeds. Ask what would guarantee it fails — then check you're not quietly doing those things.",
      },
      {
        id: "margin-of-safety",
        move: "Your estimate of how this goes is probably optimistic. Leave a buffer — of money, time, or exits — big enough to survive being wrong by the amount you usually are.",
      },
      {
        id: "second-order-effects",
        move: "Play it two steps out, not one. The first-order effect is the obvious win; the second order is how everyone and everything around you adapts to it.",
      },
    ],
    tool: {
      id: "premortem",
      move: "This is the exact moment the pre-mortem is built for. Assume it's a year later and this went badly, write the story of why, then turn each cause into a fix, an accepted risk, or a tripwire on your calendar — before you walk through the door.",
    },
    essays: ["decision-quality"],
  },
  {
    id: "over-thinking-reversible",
    title: "You're agonizing over a call you could probably undo",
    scene:
      "Three weeks on a job title, one morning on the two-year lease. You've been giving this real weight — drafting the email six times, canvassing one more opinion — without once asking whether it's even the kind of decision that earns it.",
    question: "Can I walk back through this door — and if I can, why am I still deliberating as if I can't?",
    models: [
      {
        id: "reversibility",
        move: "Sort the door before you sort the decision. Careful deliberation isn't a virtue you spread evenly over everything that matters — it's a scarce resource with one job, protecting you where a mistake is permanent. On a two-way door it protects you against almost nothing, so a choice you can reverse deserves the speed you've been denying it.",
      },
      {
        id: "loss-aversion",
        move: "Notice why the caution only ever runs one way. A wrong call is legible — a moment you can point to afterward — and slowness is invisible, so you buy insurance against the mistake you can picture and pay for it in weeks nobody tallies. The quiet toll of not deciding is real; it just never gets a scene.",
      },
      {
        id: "opportunity-cost",
        move: "Deliberating isn't a neutral holding pattern. While you decide, you've already decided — you've chosen the status quo, at full running cost, for exactly as long as you sit. Price the delay against what moving would get you, not against zero.",
      },
      {
        id: "reality-testing",
        move: "If it's the downside that's freezing you, ask whether you can build a door you'd be able to come back through — a trial period, a pilot, a staged rollout, a first step sized so a wrong turn is a lesson, not an ending. The move most people miss is that which door this is often isn't fixed; it's a fact about how you choose to walk through it.",
      },
    ],
    tool: {
      id: "doors",
      move: "This is the exact moment the door triage is built for. It sorts the call into a one-way or two-way door by how reversible it really is — so you spend slow, careful thought only where reversal won't save you, and hand a fast, undoable call the permission to move it's usually denied. And where the door looks one-way, it helps you engineer the exit that turns the leap into a step you could walk back.",
    },
    essays: ["the-door-you-can-walk-back-through"],
  },
  {
    id: "a-number-appears",
    title: "Someone just put a number in front of you",
    scene:
      "A salary offer, an asking price, a quote, a valuation, a budget, a statistic in an argument. The figure is now in your head whether you wanted it or not.",
    question: "Where did this number come from — and what would I have guessed before I heard it?",
    models: [
      {
        id: "anchoring",
        move: "The first number reframes every number after it, even when it's arbitrary or chosen to move you. You can't un-hear it, so decide your own figure first and argue, on purpose, why theirs is too high and too low.",
      },
      {
        id: "base-rates",
        move: "Set the number against the prior — what's normal for this whole class of thing — not against your gut reaction to it.",
      },
      {
        id: "opportunity-cost",
        move: "The real price isn't the sticker. It's the next-best thing the same money or time could have bought.",
      },
    ],
    essays: ["anchoring", "how-much-should-this-change-your-mind"],
  },
  {
    id: "vivid-story",
    title: "A vivid story has you convinced",
    scene:
      "A headline, a cautionary tale, a recent disaster, a friend's bad experience. It feels common and dangerous because you can picture it so clearly.",
    question: "Is this actually common, or just memorable — and how would I really know?",
    models: [
      {
        id: "availability-heuristic",
        move: "Ease of recall isn't frequency. Ask what curated this example into your memory — vividness, repetition, a feed optimized for engagement — then go find the rate instead of trusting the highlight reel.",
      },
      {
        id: "base-rates",
        move: "Look up how often this really happens before deciding how much to fear it. The anecdote is a hypothesis, not a measurement.",
      },
      {
        id: "regression-to-mean",
        move: "An extreme event is, almost by definition, likely to be followed by something less extreme. One dramatic data point is not a trend.",
      },
      {
        id: "survivorship-bias",
        move: "The vivid story is almost always a survivor's. Ask who did the same thing and isn't around to tell it — the failures don't post the thread, write the memoir, or commission the painting, so the example reached you already filtered by who lived.",
      },
    ],
    essays: ["availability-heuristic", "how-much-should-this-change-your-mind"],
    notes: ["kahneman-inside-view"],
  },
  {
    id: "need-an-estimate",
    title: "You need a number and don't have one",
    scene:
      "How big is this market? What will this cost? Is this even worth attempting? You're tempted to either guess wildly or refuse to guess at all.",
    question: "Can I build this estimate out of pieces I actually know?",
    models: [
      {
        id: "fermi-estimation",
        move: "Decompose the unknown into knowable factors and multiply them. An answer within a factor of ten beats refusing to estimate, and it shows you which assumption the whole thing hinges on.",
      },
      {
        id: "base-rates",
        move: "Start from what's typical for this kind of thing, then adjust for the specifics of your case — not the other way around.",
      },
      {
        id: "anchoring",
        move: "Be suspicious of the first figure anyone offers — including the one already sitting in your own head before you've done any work.",
      },
    ],
    essays: ["guessing-on-purpose", "orders-of-magnitude"],
  },
  {
    id: "promising-a-date",
    title: "You're about to promise a deadline",
    scene:
      "A launch date, a client quote, a 'done by Friday,' a renovation budget. The plan is in front of you, every step looks doable, and someone is waiting for a number.",
    question:
      "What happened to everyone else who planned something like this — and why would my case be different?",
    models: [
      {
        id: "outside-view",
        move: "Don't forecast from the plan — a plan is a story about the best case. Find the class this belongs to (your own past projects, projects like this generally), start from how that class actually went, and let the particulars argue for a modest adjustment.",
      },
      {
        id: "margin-of-safety",
        move: "Size the buffer to the usual overrun, not to your confidence. People run about 60% over their own predictions on familiar work; padding that feels excessive from the inside is usually about right from the record.",
      },
      {
        id: "pre-mortem",
        move: "It's the deadline and you missed by half. Write what ate the time. The steps that sink schedules are the ones not on the list, and they only become visible when you imagine the miss as already real.",
      },
      {
        id: "implementation-intentions",
        move: "Set the tripwire now: 'if the halfway milestone slips past its date, we re-plan the rest' — so the schedule gets revisited by trigger, not by hope.",
      },
    ],
    tool: {
      id: "outside",
      move: "Before you say the date out loud, run the outside view on it. The tool takes your own estimate first and seals it, then has you list what actually happened to comparable efforts — and shows you the gap, which on a schedule is almost always the plan sitting under the whole class. Start from what the class really took, not from the plan.",
    },
    essays: ["nobody-thinks-theyre-the-base-rate"],
    notes: ["kahneman-inside-view"],
  },
  {
    id: "judging-a-decision",
    title: "You're judging whether a decision was good",
    scene:
      "Your own call after it paid off or blew up. An investment. A hire. Someone's track record you're being asked to trust.",
    question: "Am I grading the decision, or just the result it happened to get?",
    models: [
      {
        id: "expected-value",
        move: "A good bet can lose and a bad bet can win. Grade the reasoning against what was knowable at the time, not against the outcome the dice produced.",
      },
      {
        id: "regression-to-mean",
        move: "A standout result has a luck component that won't repeat. Don't over-learn from one extreme — the next data point will likely be more ordinary regardless of skill.",
      },
      {
        id: "loss-aversion",
        move: "Watch for the urge to hold a loser until it's 'back to even.' That number is a fact about your purchase price, not about the decision. Ask only whether you'd choose it again today.",
      },
      {
        id: "reversibility",
        move: "A cheap-to-undo choice made fast isn't a mistake just because it missed. For a two-way door, speed was the right call and a wrong outcome is the cost of doing business.",
      },
      {
        id: "survivorship-bias",
        move: "A track record you're being asked to trust is a survivor by definition — the funds that closed, the hires who washed out, the bets that ended the game are quietly gone from it. Ask what the record would look like if the failures were still in it before you read a winning streak as skill.",
      },
    ],
    tool: {
      id: "debrief",
      move: "This is the exact moment the debrief is built for. It reconstructs the call under a hindsight guard — what you knew then, not what you know now — grades the decision apart from the result, and lands it on the four cells, including the two everyone gets wrong: the win you should fix and the loss you should keep. (If you did log it in advance, grade it against your written forecast in the decision journal instead — that record can't be edited by hindsight.)",
    },
    essays: ["decision-quality"],
  },
  {
    id: "designing-incentives",
    title: "You're designing how people will be measured or rewarded",
    scene:
      "A metric, a bonus, a KPI, a quota, a grading rubric, a policy — including the ones you set for yourself, like a daily word count or books-per-year.",
    question: "How could someone hit this number while completely missing the point?",
    models: [
      {
        id: "goodharts-law",
        move: "The moment a measure becomes a target, people optimize the measure, not the goal it stood for. Run a pre-mortem on the gaming before you adopt it, and retire it while it's still working.",
      },
      {
        id: "incentive-structures",
        move: "People do what they're rewarded for — in money, status, or safety — not what they're told. Read the reward you're actually creating, not the behavior you're hoping for.",
      },
      {
        id: "second-order-effects",
        move: "The first-order effect is the metric moving. The second order is everything people quietly stop doing in order to move it.",
      },
    ],
    tool: {
      id: "trace",
      move: "The gaming is a second-order effect, and those are exactly what and-then-what surfaces. Trace the metric past 'the number moves' — and then what do people do to move it, and then what stops getting done — until you find where the measure and the mission come apart.",
    },
    essays: ["metric-not-the-mission"],
  },
  {
    id: "stubborn-system",
    title: "You're trying to change a system that won't budge",
    scene:
      "An organization, a market, a household habit, a stuck process. You're pushing hard and the effort isn't translating into change.",
    question: "Am I pushing where the system actually moves — or just where it's easiest to push?",
    models: [
      {
        id: "leverage-points",
        move: "Adjusting flows and quantities is low leverage. Changing the rules, the goals, and the paradigm is high leverage — and usually somewhere less obvious than where everyone is pushing.",
      },
      {
        id: "feedback-loops",
        move: "Find out whether you're fighting a loop that self-corrects (it will undo you) or feeding one that amplifies (it will run away from you). Most stuck systems are held in place by a loop, not a wall.",
      },
      {
        id: "incentive-structures",
        move: "If people keep doing the thing you're trying to stop, look at what they're rewarded for. The behavior is usually rational given an incentive you haven't changed.",
      },
      {
        id: "second-order-effects",
        move: "Before you intervene, ask 'and then what?' The thing you change will provoke a response, and the response is often the part that actually matters.",
      },
    ],
    tool: {
      id: "trace",
      move: "A stuck system pushes back, and the push-back is usually the whole story. Trace your intervention forward — and then what does the system do, and then what does that trigger — so you find the loop that will swallow the effort before you spend it.",
    },
    essays: ["second-order-thinking", "the-bill-comes-later"],
  },
  {
    id: "long-haul",
    title: "You're deciding where time or money goes for the long haul",
    scene:
      "Savings, a skill, a habit, a career bet, what to read. The payoff is years away and today's choice barely registers.",
    question: "What will be worth far more in ten years than it looks like today?",
    models: [
      {
        id: "compound-interest",
        move: "Early investment looks like nothing and is worth the most. The curve stays flat-looking right up until it isn't, so the move is to start now and protect the streak.",
      },
      {
        id: "opportunity-cost",
        move: "Every yes is a no to the next-best use of the same hour or dollar. Choose deliberately what you're willing to be bad at so the thing that compounds gets your time.",
      },
      {
        id: "margin-of-safety",
        move: "Don't optimize so tightly that one bad year ends the game. Survival is the precondition for compounding — you only collect the long-run payoff if you're still in it.",
      },
    ],
    essays: ["money-math", "compounding-improvements"],
    notes: ["housel-tails"],
  },
  {
    id: "deciding-while-hot",
    title: "You're about to decide in the grip of a strong feeling",
    scene:
      "Anger with your thumb over Send. The panic after bad news. Infatuation, or the fear of missing out while a price runs away from you. The sting of a sunk cost you can't stand to write off. The call feels urgent and obvious right now.",
    question:
      "Would the calm version of me — or a friend I trust — make this same call, or am I acting on a feeling that won't be here in a week?",
    models: [
      {
        id: "self-distancing",
        move: "Get outside the hot state before you act. Run 10/10/10: how will this look in ten minutes, ten months, ten years? Then ask what you'd tell a friend in exactly this spot. If nothing forces your hand in the next hour, sleep on it — the feeling that's deciding for you is usually the part that won't survive the night.",
      },
      {
        id: "loss-aversion",
        move: "A hot decision is often a fear of loss wearing a disguise. Name precisely what you're afraid of losing. If it's a sunk cost — money, time, face already gone — that's a fact about the past, not a reason. Ask only whether you'd choose this fresh today.",
      },
      {
        id: "reversibility",
        move: "If this is a two-way door, the cooling-off costs you almost nothing — so take it. If it's one-way, that settles it: an irreversible choice is exactly the one never to make while the feeling is loudest.",
      },
      {
        id: "base-rates",
        move: "The feeling is telling you a vivid story about how this goes. Set it against what usually happens to people who make this move when they're this worked up. Go find the rate, or ask someone who's been here, before you trust the story.",
      },
    ],
    tool: {
      id: "cool",
      move: "Don't work the decision yet — work whether to decide it now at all. Cool the call settles that first question, then hands you two research-backed ways to manufacture the distance to see it straight before you touch anything you can't take back.",
    },
    essays: ["advice-you-dont-take", "decision-quality"],
    notes: ["kahneman-inside-view"],
  },
  {
    id: "cant-advise-myself",
    title: "You could tell a friend what to do — but your own version is a fog",
    scene:
      "If a friend brought you this exact situation, you'd know what to say in a sentence. Your own copy of it stays a blank. You're not hot — no anger, no clock — just unable to see your own call the way you'd see anyone else's.",
    question: "What would I tell a friend in this spot — and would I actually take that advice myself?",
    models: [
      {
        id: "self-distancing",
        move: "This is Solomon's paradox: you reason more wisely about other people's dilemmas than your own, and it needs no heat to bite. Put your decision in a friend's name and say out loud what you'd tell them — the answer usually arrives clearer and faster than anything you can reach from inside your own head.",
      },
      {
        id: "loss-aversion",
        move: "If you know the advice and still won't take it, the decision was never the unclear part — the obstacle is. Often it's a loss you're flinching from: name exactly what you're afraid of losing, and check whether it's a real future cost or just the sting of giving something up.",
      },
      {
        id: "sunk-cost",
        move: "One of the most common reasons you won't take your own good advice is what you've already put in. What's spent is spent whether you go on or not — so ask only whether you'd choose this fresh today, and don't let the years or the money already gone cast a vote they haven't earned.",
      },
    ],
    tool: {
      id: "advise",
      move: "This is the exact moment the advise-a-friend tool is built for. It puts your decision in a friend's name so the answer comes clear, then asks the harder half most reframes skip: would you take it? If not, it names the real obstacle — fear, sunk cost, other people's opinion, the comfort of not choosing — and hands you the tool built for that one.",
    },
    essays: ["advice-you-dont-take"],
  },
  {
    id: "pull-wont-settle",
    title: "You keep leaning one way and can't tell if it's real or just a mood",
    scene:
      "Not hot, exactly — no anger, no ticking clock. Just a steady pull toward one side: the comfort of staying, or the shine of the new thing. From inside today you can't tell whether it's the durable call or a feeling that'll be gone by next month.",
    question: "Which way will I be glad I went — ten minutes from now, ten months, ten years?",
    models: [
      {
        id: "self-distancing",
        move: "Run 10/10/10: how will this look ten minutes from now, ten months, ten years? Read how the pull changes across the horizons — a feeling that's loud now often lies about how long it lasts, and the ones that survive all three are the ones worth deciding on.",
      },
      {
        id: "availability-heuristic",
        move: "The feeling you have right now is vivid and immediate; the version of you who lives with the choice, and the path you don't take, are neither. So the present mood wins the vote by default — unless you deliberately weight the future you can't feel yet as heavily as the one you can.",
      },
      {
        id: "loss-aversion",
        move: "Weigh it against the regret you can't feel today — the road not taken. A pull toward the familiar is often just the fear of giving something up wearing the costume of preference; the option you'd quietly miss for years rarely gets a fair hearing against the one that's comfortable tonight.",
      },
    ],
    tool: {
      id: "regret",
      move: "This is the exact moment the older-self tool is built for. It plays the pull forward to ten minutes, ten months, and ten years, reads how it changes across them, and weighs it against the regret you can't feel now — the road not taken — so a feeling that won't last can't outvote the one that will.",
    },
    essays: ["advice-you-dont-take"],
  },
  {
    id: "time-to-quit",
    title: "You can't tell if it's time to quit",
    scene:
      "The project that's been 'almost there' for a year. The job, the strategy, the manuscript, the relationship with the sunk decade. Everything already spent argues for one more push — and one more after that.",
    question:
      "Knowing what I know now, would I start this today — and what, specifically, would have to happen for me to stop?",
    models: [
      {
        id: "loss-aversion",
        move: "Quitting converts a paper loss into a real one, and that's most of why it hurts — but the pain of admitting the loss is not information about the future. What's spent is spent whether you stay or go; only what comes next is still on the table.",
      },
      {
        id: "opportunity-cost",
        move: "Staying isn't free. Every month in this is a month not in the next thing — price the persistence in what the same time, money, and attention would earn elsewhere, not against zero.",
      },
      {
        id: "outside-view",
        move: "Your sense of 'almost there' comes from inside the story. What actually happened to people who were this deep in this kind of thing — how often did the next push crack it, and how often was 'almost' the permanent condition?",
      },
      {
        id: "self-distancing",
        move: "Describe the situation to yourself as if a friend brought it to you — the years in, the current trajectory, the reasons to stay. Notice how fast the advice comes when the sunk cost isn't yours.",
      },
      {
        id: "tripwires",
        move: "If you can't make the call today, make the smaller one: set the kill criteria — a state and a date. 'If X isn't true by then, I stop.' Put the date in your calendar. Quitting on time will feel like quitting too early; that feeling is the bias, not the verdict.",
      },
    ],
    tool: {
      id: "quit",
      move: "This is the exact moment the quit-or-stay tool is built for. It quarantines what you've already spent so it can't vote, then runs the two tests that survive the strip: would you begin this today from scratch, and does one more push beat the best other use of the same time and money? Where they disagree, that gap is the sunk cost hiding — and whatever you decide to keep doing, you leave with the kill criterion set.",
    },
    essays: ["hold-the-funeral-first", "decision-quality"],
    notes: ["housel-tails"],
  },
  {
    id: "someone-selling-you",
    title: "Someone's pushing you toward a yes",
    scene:
      "A salesperson, a recruiter, an advisor, a pundit, a friend with strong opinions — someone with a stake in your choice is telling you what to do, and their case sounds good.",
    question: "Who profits if I say yes — and would they give me the same advice if they didn't?",
    models: [
      {
        id: "incentive-structures",
        move: "Before you weigh the argument, read the arithmetic behind the person making it. Ask what they get — in money, status, or a quota — if you go their way, and whether the same advice would survive if that payment vanished. Munger's rule: never ask a barber whether you need a haircut.",
      },
      {
        id: "reality-testing",
        move: "Their case is built to persuade, so go find the part they left out. Name the one claim the whole pitch rests on and ask what you'd have to see to know it's false — then look for that, not for more reasons to agree.",
      },
      {
        id: "base-rates",
        move: "Set their story of how this goes against how it goes for everyone in your position who took the deal — not against the vivid best case they're describing. The average customer's outcome, not the testimonial, is your prior.",
      },
      {
        id: "second-order-effects",
        move: "Play the yes forward past the sale. The first-order effect is what they're promising; the second order is what you're locked into afterward, what it costs to leave, and who keeps collecting once you're in.",
      },
    ],
    tool: {
      id: "incentives",
      move: "This is the exact moment the incentives tool is built for. It runs 'show me the incentive' on the advice you were handed — names who gains from your yes, what they'd say if they didn't, and what the disinterested version of the same counsel would sound like — so you keep the useful part of a pitch without swallowing the part that's just someone's interest wearing the costume of advice.",
    },
    essays: ["never-ask-a-barber"],
  },
  {
    id: "not-enough-to-decide",
    title: "You keep needing to know more before you'll decide",
    scene:
      "One more spreadsheet, one more opinion, one more week of data. The call has been researchable for a while and you're still researching — it feels responsible, but it might just be the comfort of not choosing.",
    question: "Is there a fact I'm missing that would actually change my call — or am I gathering information to avoid making one?",
    models: [
      {
        id: "value-of-information",
        move: "A fact is only worth chasing if some possible answer would change what you do. Name your call each way: if the number came back high, would you choose differently than if it came back low? If not, you already have enough — the research is costing time and buying nothing.",
      },
      {
        id: "opportunity-cost",
        move: "Waiting isn't neutral. Price the delay in what it forgoes — the option that closes, the head start you lose, the cost of the thing sitting undecided — and weigh that against how much the missing fact could really improve the call.",
      },
      {
        id: "expected-value",
        move: "You'll never have all of it, and past a point more precision doesn't move the expected value enough to matter. Decide at the resolution the choice actually needs, not the one that would finally make you feel certain.",
      },
      {
        id: "reversibility",
        move: "Check the door. If it's cheap to undo, the fastest way to learn is usually to act and find out, not to research from the outside — the gathering only earns its keep on the choices you can't easily walk back.",
      },
    ],
    tool: {
      id: "enough",
      move: "This is the exact moment the enough-to-decide tool is built for. It runs a value-of-information test without the math: you write what you'd do if the fact you're chasing came back one way, then the other, and if the answer is the same it shows you you're already done — so you stop researching a call you've effectively already made.",
    },
    essays: ["what-would-you-do-either-way"],
  },
  {
    id: "fairly-sure-already",
    title: "You're fairly sure — and that's exactly what stopped you looking",
    scene:
      "You've mostly made up your mind, and now you're gathering support for it. The last three things you read agreed with you. It feels like diligence, but you've been collecting reasons it'll work and none that it won't — and “fairly sure” is the precise state that ends the search too early.",
    question: "What would prove me wrong — and have I actually gone looking for it, or only for reasons I'm right?",
    models: [
      {
        id: "reality-testing",
        move: "Name the one assumption the whole decision rests on, then ask what you'd have to see to know it's false — and go look for that, not for more reasons to agree. Confidence quietly turns research into a case for what you already wanted; the antidote is to hunt the disconfirming evidence on purpose.",
      },
      {
        id: "inversion",
        move: "Stop asking how this succeeds and ask what would guarantee it fails — then check you're not quietly doing those things. The failure modes you'd never surface looking forward tend to jump out the moment you go looking for them directly.",
      },
      {
        id: "value-of-information",
        move: "Where you can, don't defend the prediction — test it. Name the cheapest real experiment that would settle the key assumption before you commit, and run that instead of gathering one more opinion that only agrees. A confident forecast you could have checked cheaply is one you should have.",
      },
    ],
    tool: {
      id: "test",
      move: "This is the exact moment the reality-test is built for. It names the assumption the call rests on, forces out what evidence would falsify it, and checks whether you've sought that or only its opposite — the antidote to confirmation bias. Then, where you can, it turns the confident prediction into the cheapest real experiment that would settle it before you commit.",
    },
    essays: ["the-plan-was-never-tried"],
  },
  {
    id: "cant-stop-looking",
    title: "You can't tell when to stop looking",
    scene:
      "Apartments, job candidates, contractors, a used car. Options come by one at a time, each one you pass is gone, and you can't tell if the next will be better or if you're about to talk yourself right past the best one you'll see.",
    question: "Have I seen enough to recognize a good one when it appears — and am I still looking because more will help, or because committing is scary?",
    models: [
      {
        id: "optimal-stopping",
        move: "When options arrive in sequence and passing is permanent, the shape of the answer is known: spend the first stretch looking without committing, to set your bar, then take the first option that beats everything you've seen. Roughly the first 37% is calibration, the rest is for pulling the trigger — searching forever and grabbing the first thing are both mistakes.",
      },
      {
        id: "value-of-information",
        move: "Before you look at one more, ask what the next viewing could tell you that would change your pick. If every plausible result leaves you choosing the same option, the search is over — you're gathering comfort now, not information.",
      },
      {
        id: "opportunity-cost",
        move: "The search itself has a price: the good option someone else takes while you keep looking, and the hours the looking eats. Weigh 'one more round' against what the standing offer and that time are worth.",
      },
      {
        id: "loss-aversion",
        move: "The dread driving 'just one more' is usually the fear of committing and then seeing something better. Name it: a good-enough choice you act on beats a perfect one you're still chasing, and the regret of the road not taken is a tax on every option, not a flaw in this one.",
      },
    ],
    tool: {
      id: "stop",
      move: "This is the exact moment the when-to-stop tool is built for. It runs the optimal-stopping rule on your actual search — how many you've seen, how many you can still expect — and tells you whether you're still in the look-and-calibrate phase or past it and should take the next option that beats your best so far, so you stop by a rule instead of by exhaustion or nerve.",
    },
    essays: ["look-then-leap"],
  },
  {
    id: "bad-tail",
    title: "There's a bad outcome you keep waving off",
    scene:
      "A bet with real upside and a small chance of something you couldn't walk back — a leveraged position, a health risk, quitting with no cushion, a stunt you'd 'probably' be fine doing. You keep telling yourself it almost certainly won't happen.",
    question: "If the worst realistic version happened, would I recover — or is this a bet I can't afford to lose even once?",
    models: [
      {
        id: "ruin",
        move: "Sort the size of the downside before you argue the odds. A loss you'd recover from is an ordinary risk — go weigh it. A loss you couldn't come back from is different in kind: no probability is small enough and no upside large enough to make a ruin worth it, because you only have to be wrong once and you're out of the game for good.",
      },
      {
        id: "margin-of-safety",
        move: "Your sense of how unlikely the bad tail is is probably optimistic, and rare shocks tend to arrive at the worst moment. Size the buffer — cash, redundancy, an exit — to survive the outcome, not to match your confidence that it won't come.",
      },
      {
        id: "expected-value",
        move: "The average is a lie when one branch ends the game. Expected value quietly assumes you survive to keep playing; against an unrecoverable loss, don't average the branches — cap the one that ruins you, then take the version you'd survive.",
      },
      {
        id: "second-order-effects",
        move: "Trace the worst case past the first hit. The loss you can name is rarely the whole bill; it's what the loss then forces — the sale at the bottom, the thing you can no longer fund, who else goes down with you.",
      },
    ],
    tool: {
      id: "ruin",
      move: "This is the exact moment the survive-the-worst-case tool is built for. It runs the survival check the rest of the kit quietly defers to: it separates a loss you'd recover from — hand that to the flip point — from a ruin you can't, and for a ruin it doesn't just say don't; it hands you the way to cap the downside below ruin and take the version of the bet you'd actually walk away from.",
    },
    essays: ["the-river-is-four-feet-deep"],
    notes: ["housel-tails"],
  },
  {
    id: "deadlocked-with-someone",
    title: "You're deadlocked with someone you have to decide with",
    scene:
      "A partner, a co-founder, a family member. You've argued the same points in circles, it's getting warm, and you can't even tell anymore whether you disagree about the facts, about what you each want, or about how much risk is okay.",
    question: "Once the heat's out, are we fighting about facts, about what we want, or about risk — and what one thing, if it flipped, would change a mind?",
    models: [
      {
        id: "reality-testing",
        move: "Most stuck arguments hide a factual question — one that's settleable with evidence neither side has gone to get. Split the part you could look up or test from the part you can't, and go settle the settleable part instead of re-arguing it.",
      },
      {
        id: "incentive-structures",
        move: "You each see the choice from where you stand. Before you assume bad faith, ask what each of you is protecting — whose time, money, or safety is on the line — because a stubborn disagreement is often two people being rational about different exposures.",
      },
      {
        id: "self-distancing",
        move: "Argue the other side out loud, as if it were yours, until they'd agree you've put it fairly. The heat drops when each person feels understood — and half of what looked like disagreement turns out to be two people talking past each other.",
      },
      {
        id: "expected-value",
        move: "If it comes down to how likely something is, don't trade adjectives — put rough numbers on it. 'I think it's 70/30' against 'I think it's 30/70' turns a values fight back into a factual one you can actually check, or bet on.",
      },
    ],
    tool: {
      id: "crux",
      move: "This is the exact moment the disagreement tool is built for. It sorts a stuck argument into its real root — a fact you can settle with evidence, a values split that needs a fair procedure instead of more arguing, or a gap in risk tolerance you close with a shared survival check — and finds the crux: the one thing that, if it went the other way, would change a mind. Then it hands each kind to the tool that resolves it.",
    },
    essays: ["the-one-thing-that-would-change-your-mind"],
  },
  {
    id: "group-needs-a-number",
    title: "Your group has to agree on a number",
    scene:
      "The team needs a launch date for the client. The family needs a budget for the renovation. The partners need a price to offer. Everyone will talk, someone will say a number first, and you can already feel the meeting bending toward it.",
    question: "What does each of us actually think before we hear each other — and if we're far apart, what is each of us picturing that the others aren't?",
    models: [
      {
        id: "independent-judgments",
        move: "A group's estimate beats an individual's only when the estimates are made apart, so their errors cancel instead of leaning the same way. Collect everyone's number privately before anyone speaks, and the group becomes a crowd instead of an echo of its first speaker.",
      },
      {
        id: "anchoring",
        move: "The first number said aloud sets the range for every number after it, even for people who think they're ignoring it. If it has to be said, have it said last, by the person whose view carries most weight.",
      },
      {
        id: "outside-view",
        move: "A group's middle still shares the group's optimism. For a timeline or a budget, set it against how long or how much projects like this one actually took before you promise it to anyone.",
      },
    ],
    tool: {
      id: "round",
      move: "This is the exact moment the blind round is built for. Everyone answers privately, one phone passed round or by message. The numbers are revealed at once, and the spread is read: agree and take the middle, or hear from the two ends first and answer again. The group's number is the middle of the last round.",
    },
  },
  {
    id: "keep-re-deciding",
    title: "You keep re-deciding the same thing",
    scene:
      "The second drink. Checking work email at dinner. The exception you make 'just this once' and have now made a dozen times. Each instance feels reasonable on its own, and each somehow goes the way you'd rather it didn't.",
    question: "Should I be deciding this case by case at all — or settle it once, as a rule, and stop spending willpower relitigating it?",
    models: [
      {
        id: "bright-line-rules",
        move: "Some calls are cheaper to decide once than every time. A bright line — 'no email after seven', 'never on margin' — takes the recurring choice out of the moment, where you're tired and the exception always sounds reasonable, and settles it in the cool hour when you can see the pattern. The clean rule beats case-by-case judgment precisely because it won't negotiate.",
      },
      {
        id: "implementation-intentions",
        move: "A rule that lives only in your head gets renegotiated the instant it's tested. Tie it to the trigger — 'when the waiter offers the second, I say no by default' — so it fires on the cue instead of waiting on resolve you won't have in the moment.",
      },
      {
        id: "incentive-structures",
        move: "Look at what keeps pulling you across the line — what the exception gives you each time. If the rule has to fight an incentive you leave in place, add a small one on the other side, or make crossing the line cost something you'll actually feel.",
      },
      {
        id: "second-order-effects",
        move: "Judge the pattern, not the instance. Any single exception is minor; the second-order effect is the precedent — once 'just this once' works, it becomes the rule, and the line stops meaning anything.",
      },
    ],
    tool: {
      id: "rule",
      move: "This is the exact moment the make-it-a-rule tool is built for. It takes a call you keep making and turns it into one standing decision — the bright line, the trigger that fires it, and the rare exception you'll allow named in advance so it can't quietly expand — then sets a date to review whether the rule still earns its place, so you decide it once instead of a hundred tired times.",
    },
    essays: ["decide-it-once"],
  },
  {
    id: "whether-or-not",
    title: "You're deciding whether or not to do one thing",
    scene:
      "Should I take the job, or not? Make the move, or not? It feels like a decision — you can list the pros and cons, sleep on it, ask a friend. But the question has already shrunk a wide-open situation to a single yes-or-no about one option, and everything you didn't name has quietly left the room.",
    question: "Is this a real choice between options, or one option dressed up as a decision?",
    models: [
      {
        id: "narrow-framing",
        move: "There's a tell, and it's almost grammatical: any time the decision has the word “whether” in it, or exactly two sides — in or out, this or nothing — you're probably in a narrow frame. The failure to beat isn't a hard choice; it's a frame with one option in it. Refuse to decide between one thing and nothing, and make yourself name just one more real alternative — going from one option to two is where almost all the value lives.",
      },
      {
        id: "opportunity-cost",
        move: "The hidden alternative is almost always there. Run the vanishing test: if this option were suddenly off the table — gone, impossible — what would you do instead? Whatever you'd scramble toward is a real option you had the whole time; the frame just painted it over. And it's the true cost of a yes — the next-best thing the same time or money would have bought.",
      },
      {
        id: "base-rates",
        move: "Most of your decisions aren't original. Someone has taken this job, made this move, had this exact hard conversation — find them and ask how it went. Their experience is a cheaper teacher than your own future regret, and it swaps the single vivid path in your head for what actually tends to happen.",
      },
      {
        id: "reversibility",
        move: "Widening has a trap on its own side: past a handful, more options mostly produce anxiety and stall, and generating endless alternatives is a comfortable way to never decide. So check the door — if the call is cheap to reverse, get to two or three real options and move, rather than manufacturing a tenth to hide behind.",
      },
    ],
    tool: {
      id: "widen",
      move: "This is the exact moment the widener is built for. It catches the whether-or-not frame — the single most common decision mistake — and forces it open: the vanishing-options test and three more lenses to surface the alternatives nobody named, a guard against decoy options that only flatter the first, then it hands the real slate on to be compared or weighed.",
    },
    essays: ["whether-or-not"],
  },
  {
    id: "stuck-between-two",
    title: "You're down to two options and keep re-arguing the odds",
    scene:
      "Take the job or stay. Sell or hold. This treatment or that one. You've made the case both ways more than once, and now you're re-litigating the same number — is it 60/40 or 70/30? — as if one more round will finally pin a probability you can't actually know. The needle won't settle, and the deciding won't end.",
    question: "Which side of the break-even line am I on — the odds at which this call would flip?",
    models: [
      {
        id: "decision-threshold",
        move: "Stop trying to pin the exact odds. Find the probability where the decision flips instead — p* = R/(B+R), how much better it is if it works over how much worse if it doesn't — and then all you have to judge is which side of that one line you're on. That's a call you can actually make; 'exactly 65%' never was.",
      },
      {
        id: "expected-value",
        move: "Weigh each side by magnitude, not just likelihood. A near-even split on probability isn't near-even at all if one side's downside dwarfs the other's upside — size the better-if-right against the worse-if-wrong before you argue the percent again.",
      },
      {
        id: "loss-aversion",
        move: "Notice if the number won't settle because losing looms larger than the same-size gain. The sting of being wrong runs about twice the pleasure of being right, so your gut quietly tilts the odds toward the cautious side — correct for the tilt before you trust the estimate.",
      },
      {
        id: "reversibility",
        move: "Before you spend another hour on the exact odds, ask whether the door swings back. A reversible call doesn't earn this much precision — decide on the rough side you're on and let moving teach you the rest; save the agonizing for the doors that don't reopen.",
      },
    ],
    tool: {
      id: "weigh",
      move: "This is the exact moment the flip point is built for. Instead of pinning the odds you can't know, it finds the probability where the call tips — p* = R/(B+R) — so all you judge is which side of that line you're on. It keeps your gut read separate and last, and tells you plainly when it's genuinely too close to call rather than pretending a coin-flip is a decision.",
    },
    essays: ["the-flip-point", "loss-aversion"],
  },
  {
    id: "neither-wins",
    title: "Two good options, and neither one wins",
    scene:
      "The job you trained for or the town your family is in. The steady partner track or the thing you'd always wonder about. You know the facts, you've made the list four times, and it comes out even every time. You've started to suspect something's wrong with you for not being able to choose.",
    question: "Is this a tie, a missing fact, or a real hard choice — and if it's a hard choice, which one will I stand behind?",
    models: [
      {
        id: "parity",
        move: "Run the small-improvement test. Make one option a little better: a bit more pay, a slightly shorter commute. If that settles it, they were equal, so flip a coin. If it doesn't, they're on a par, and no further weighing will find an answer, because there isn't one to find. You settle a par by committing.",
      },
      {
        id: "value-of-information",
        move: "Before calling it a par, check that it isn't ignorance. Name any fact you could still find out and ask what you'd do under each answer. If one would settle it and you can learn it in time, that's your next step, not soul-searching.",
      },
      {
        id: "self-distancing",
        move: "Ask what you'd tell a friend in exactly this spot. When the honest advice is 'either is fine, pick the one that's you', take that seriously: it's the right answer to a par, not a dodge.",
      },
      {
        id: "loss-aversion",
        move: "Whichever you choose, you'll lose the best thing about the other, and that loss will sting more than the gain feels good. Expect the sting, and don't read it as proof you chose wrong.",
      },
    ],
    tool: {
      id: "par",
      move: "This is the exact moment Neither One Wins is built for. It separates a real hard choice from the three things it's mistaken for (one option is better, a fact is missing, a plain tie), using Ruth Chang's small-improvement test. If the two are on a par, it stops the weighing, asks what each choice would make you, warns you if one of them wins by default, and writes your commitment as a sentence you can keep.",
    },
    essays: ["neither-is-better"],
  },
  {
    id: "weigh-it-through",
    title: "Any other decision — weigh it through",
    scene:
      "It doesn't fit a neat category. Two jobs, a hard conversation, whether to move, whether to commit — just a real choice you keep turning over. Start here and work it like any good decision.",
    question: "What am I actually choosing between — and what would have to be true for this to be the right call?",
    models: [
      {
        id: "narrow-framing",
        move: "Notice if you've framed this as 'whether or not.' That framing hides every option you didn't name. Before anything else, write down at least one more real choice — and ask who has already solved this exact problem.",
      },
      {
        id: "base-rates",
        move: "Set the story you're telling yourself against what usually happens. What's the base rate for people who've made this move? Go find it, or ask someone who has, before you trust your gut on how it'll go.",
      },
      {
        id: "expected-value",
        move: "Weigh each option by how likely each outcome is, not how vivid it is. A small chance of a big loss and a vivid worst case are not the same thing — name the real probabilities, even roughly.",
      },
      {
        id: "self-distancing",
        move: "Get some distance before you commit. How will this look in ten months, ten years? What would you tell a friend who described this exact choice to you? The advice you'd give them is usually clearer than the one you're giving yourself.",
      },
      {
        id: "pre-mortem",
        move: "Assume it's a year out and this went badly. Write the story of why — then set the tripwire: the specific thing that, if you saw it, would tell you to stop and reconsider rather than ride it down.",
      },
      {
        id: "reversibility",
        move: "Ask whether this is a one-way or two-way door. If you can undo it cheaply, decide fast and learn by moving; agonizing over a reversible choice is its own kind of mistake. Save the slow, careful deliberation for the doors that don't swing back.",
      },
    ],
    tool: {
      id: "compare",
      move: "Once you've named the real options — not just 'the thing' vs 'nothing' — this is the instrument for choosing among them. It scores each option one factor at a time so a single strong impression can't halo the whole choice, keeps your gut call separate and last, and hands you the gap between the two to examine.",
    },
    essays: ["whether-or-not", "decision-quality"],
  },
  {
    id: "make-it-happen",
    title: "You've made the call — now make sure it happens",
    scene:
      "The decision is made, and it was the right one. But 'decided' and 'done' are different things, and the week after a decision is where most of them quietly die — never started, or never revisited when something changed.",
    question:
      "What is the first concrete move, exactly when and where will I make it — and what would tell me to stop and reconsider?",
    models: [
      {
        id: "implementation-intentions",
        move: "Don't leave it at 'I'll get to it.' Write the if-then: when X happens — a specific time, place, or event you'll actually notice — I will do Y. Make Y the smallest first step you could finish this week, and hand it to the cue instead of to your future, busier self.",
      },
      {
        id: "pre-mortem",
        move: "Set the tripwire before you start. Decide now the one signal that would tell you to stop and reconsider rather than ride it down — 'if I see X, I revisit this.' It's an if-then aimed at the reconsidering, and it keeps a decision that's slowly going wrong from coasting past the moment you should have changed course.",
      },
      {
        id: "reversibility",
        move: "If the first step is cheap and easy to undo, take it now rather than planning it perfectly. Action creates information that no amount of deliberation can — and for a two-way door, starting is how you find out whether you were right.",
      },
    ],
    tool: {
      id: "act",
      move: "This is the exact moment the make-it-happen tool is built for. It first checks the honest thing most planning skips — whether the trouble is the doing or the wanting, because no cue rescues a goal you don't actually want — then turns the call into an if-then plan that fires on a concrete cue: the smallest first move, a backup for the obstacle that would stop it, and a tripwire to reconsider. It refuses a vague cue and a first step too big to finish this week, and hands you a plan you can put where you'll see it.",
    },
    essays: ["deciding-and-doing", "decision-quality"],
  },
];

const kindLabels = { essay: "Essay", model: "Model", note: "Reading note" } as const;

export type ResolvedSituationModel = {
  id: string;
  name: string;
  tagline: string;
  href: string;
  move: string;
};

export type ResolvedReference = {
  kind: "essay" | "note";
  label: string;
  title: string;
  href: string;
};

export type ResolvedSituationTool = {
  id: string;
  /** The tool's full name, e.g. "The Pre-mortem". */
  name: string;
  /** Short label, e.g. "Pre-mortem". */
  short: string;
  href: string;
  move: string;
};

export type ResolvedSituation = {
  id: string;
  title: string;
  scene: string;
  question: string;
  models: ResolvedSituationModel[];
  tool?: ResolvedSituationTool;
  references: ResolvedReference[];
};

export function resolveSituation(situation: Situation): ResolvedSituation {
  const resolvedModels = situation.models.map((sm): ResolvedSituationModel => {
    const model = models.find((m) => m.id === sm.id);
    if (!model) {
      throw new Error(`Situation "${situation.id}" references unknown model "${sm.id}"`);
    }
    return {
      id: model.id,
      name: model.name,
      tagline: model.tagline,
      href: `/models#${model.id}`,
      move: sm.move,
    };
  });

  const references: ResolvedReference[] = [];
  for (const slug of situation.essays ?? []) {
    const post = posts.find((p) => p.slug === slug);
    if (!post) {
      throw new Error(`Situation "${situation.id}" references unknown essay "${slug}"`);
    }
    references.push({
      kind: "essay",
      label: kindLabels.essay,
      title: post.title,
      href: `/writing/${post.slug}`,
    });
  }
  for (const slug of situation.notes ?? []) {
    const note = notes.find((n) => n.slug === slug);
    if (!note) {
      throw new Error(`Situation "${situation.id}" references unknown note "${slug}"`);
    }
    references.push({
      kind: "note",
      label: kindLabels.note,
      title: note.title,
      href: `/notes#${note.slug}`,
    });
  }

  let resolvedTool: ResolvedSituationTool | undefined;
  if (situation.tool) {
    // getTool throws at build if the id is unknown — same discipline as models.
    const t = getTool(situation.tool.id);
    resolvedTool = {
      id: t.id,
      name: t.name,
      short: t.short,
      href: t.href,
      move: situation.tool.move,
    };
  }

  return {
    id: situation.id,
    title: situation.title,
    scene: situation.scene,
    question: situation.question,
    models: resolvedModels,
    tool: resolvedTool,
    references,
  };
}

/**
 * Flat, fully-resolved view of every situation — the shape the decision
 * worksheet (`/decide`) renders. Reuses resolveSituation so the worksheet, the
 * playbook, and search all draw from the same curated source and can't drift.
 */
export function getWorksheetSituations() {
  return situations.map((s) => {
    const r = resolveSituation(s);
    return {
      id: r.id,
      title: r.title,
      scene: r.scene,
      question: r.question,
      models: r.models.map((m) => ({
        id: m.id,
        name: m.name,
        move: m.move,
        href: m.href,
      })),
      references: r.references.map((ref) => ({
        label: ref.label,
        title: ref.title,
        href: ref.href,
      })),
    };
  });
}

/**
 * Reverse lookup: which situations call for this model. Lets the models page
 * show "Reach for this when…" without the model having to declare anything in
 * the situation's direction — declared once in `situations`, surfaced in both
 * directions, can't drift.
 */
export function getSituationsForModel(id: string): { id: string; title: string }[] {
  return situations
    .filter((s) => s.models.some((m) => m.id === id))
    .map((s) => ({ id: s.id, title: s.title }));
}

/**
 * Reverse lookup: which situations does this tool serve as the purpose-built
 * instrument for. Declared once on the situation (`tool`), surfaced in both
 * directions — the playbook hands you the instrument, and the toolkit names the
 * moments it was built for — and the two can't drift.
 */
export function getSituationsForTool(id: string): { id: string; title: string }[] {
  return situations
    .filter((s) => s.tool?.id === id)
    .map((s) => ({ id: s.id, title: s.title }));
}

/**
 * A labelled cluster of situations for the playbook's contents. Twenty-five
 * moments in authoring order are the same wall the guided router's "what's
 * making it hard?" node used to be, so the playbook sorts them under the same
 * kinds of hard the router uses (options, stakes, your own read, going in
 * circles, other people) — the two front doors should read alike — plus the two
 * kinds the router reaches by a different question: a number in front of you,
 * and the call that's already made. Display order only: the `situations` array
 * keeps its order for the worksheet and search, and every `#id` anchor is
 * unchanged.
 */
export type SituationGroup = {
  /** Stable — used for the in-page anchor. */
  id: string;
  /** The cluster's heading, in the playbook's second person. */
  label: string;
  /** The situation ids in this cluster, in display order. */
  situationIds: string[];
};

export const situationGroups: SituationGroup[] = [
  {
    id: "options",
    label: "It's the options themselves",
    situationIds: ["whether-or-not", "stuck-between-two", "neither-wins", "cant-stop-looking", "weigh-it-through"],
  },
  {
    id: "stakes",
    label: "It's what could go wrong — or whether it's as big as it feels",
    situationIds: [
      "one-way-door",
      "bad-tail",
      "over-thinking-reversible",
      "promising-a-date",
      "long-haul",
    ],
  },
  {
    id: "head",
    label: "It's your own read you can't trust",
    situationIds: [
      "deciding-while-hot",
      "cant-advise-myself",
      "pull-wont-settle",
      "fairly-sure-already",
      "vivid-story",
    ],
  },
  {
    id: "loop",
    label: "You keep going round in circles",
    situationIds: ["not-enough-to-decide", "time-to-quit", "keep-re-deciding"],
  },
  {
    id: "people",
    label: "It's other people — or the system they're in",
    situationIds: [
      "someone-selling-you",
      "deadlocked-with-someone",
      "group-needs-a-number",
      "designing-incentives",
      "stubborn-system",
    ],
  },
  {
    id: "numbers",
    label: "There's a number in it",
    situationIds: ["a-number-appears", "need-an-estimate"],
  },
  {
    id: "after",
    label: "The call's already made",
    situationIds: ["make-it-happen", "judging-a-decision"],
  },
];

/**
 * The playbook's situations, resolved and clustered. Every situation must sit
 * in exactly one group — one left out would silently vanish from the playbook
 * (and break every `/playbook#id` link to it), which is worse than the wall.
 * Throws at build time, the same discipline `validateTriage` uses.
 */
export function getGroupedSituations(): {
  group: SituationGroup;
  situations: ResolvedSituation[];
}[] {
  const byId = new Map(situations.map((s) => [s.id, s]));
  const placed = new Set<string>();
  const groupIds = new Set<string>();
  const grouped = situationGroups.map((group) => {
    if (groupIds.has(group.id)) {
      throw new Error(`Duplicate situation group id "${group.id}"`);
    }
    groupIds.add(group.id);
    return {
      group,
      situations: group.situationIds.map((id) => {
        const s = byId.get(id);
        if (!s) throw new Error(`Situation group "${group.id}" names unknown situation "${id}"`);
        if (placed.has(id)) throw new Error(`Situation "${id}" is in more than one group`);
        placed.add(id);
        return resolveSituation(s);
      }),
    };
  });
  for (const s of situations) {
    if (!placed.has(s.id)) throw new Error(`Situation "${s.id}" is in no playbook group`);
  }
  return grouped;
}
