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
    essays: ["the-door-you-can-walk-back-through"],
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
    essays: ["the-river-is-four-feet-deep"],
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
    id: "par",
    href: "/par",
    name: "Neither One Wins",
    short: "On a par",
    when: "You're down to two good options, each with something the other can't give you — the work or the people, the city or the quiet — and every time you weigh them it comes out even. You keep thinking one more pass will find the answer.",
    ask: "Is one actually better, am I missing a fact, are they simply equal — or is this a hard choice that's mine to make by committing?",
    does: "Runs Ruth Chang's small-improvement test to tell a real hard choice (two options on a par) from the three things it gets mistaken for: a painful choice where one is better, a fact you could find out, and a plain tie you should flip. If it's a par, it stops the weighing and helps you commit to the one you'll stand behind, written as a sentence you can keep.",
    payoff: "now",
    models: ["parity"],
    essays: ["neither-is-better"],
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
    essays: ["never-ask-a-barber"],
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
    essays: ["what-would-you-do-either-way"],
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
    essays: ["look-then-leap"],
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
    models: ["sunk-cost", "opportunity-cost"],
    essays: ["the-money-is-already-gone"],
  },
  {
    id: "crux",
    href: "/crux",
    name: "Where Do You Actually Disagree?",
    short: "Find the crux",
    when: "You and someone you have to decide with — a partner, a cofounder, family — are stuck. You've argued it in circles and you're no closer, and you can't tell if you're disagreeing about the facts, about what matters, or about how much risk is okay.",
    ask: "Once the heat's stripped out, are we fighting about facts, about what we want, or about risk — and what would actually change a mind?",
    does: "Sorts a stuck disagreement into its real root — a fact you can settle with evidence, a values split that needs a fair procedure not more arguing, or a gap in risk tolerance you close with a survival check — and finds the crux: the one thing that, if it went the other way, would change a mind. Then hands each kind to the tool that resolves it.",
    payoff: "now",
    essays: ["the-one-thing-that-would-change-your-mind"],
  },
  {
    id: "round",
    href: "/round",
    name: "Before Anyone Speaks",
    short: "Blind round",
    when: "Your group has to settle on one number — when it'll be done, what to budget, what to offer, how likely it is to work — and you can feel how it'll go: someone will say a number first, and everyone else will adjust from theirs.",
    ask: "What does each of us actually think, before we hear each other — and is the spread telling us we're picturing different things?",
    does: "Runs estimate–talk–estimate: everyone commits a number privately (one phone passed round, or by message), all are revealed at once, and the spread is read — agree and take the middle, or hear the two ends first and answer again. The group's number is the middle of the last round, with a check for a second round that just collapsed onto one person's first answer.",
    payoff: "now",
    models: ["independent-judgments", "anchoring"],
  },
  {
    id: "split",
    href: "/split",
    name: "Who Gets Which Room?",
    short: "Room and rent",
    when: "You're moving in with others and the rooms aren't equal — one has its own bathroom, one is the box room — and you have to agree who takes which and what each pays, without it turning into a haggle that whoever minds least wins.",
    ask: "Who should take which room, and at what rents would none of us rather have someone else's room at its price?",
    does: "Each of you privately prices every room so you wouldn't mind which one you got, with your prices adding up to the rent, one phone passed round. Rooms go to whoever values them most as a set; rents are set so nobody would swap, by the widest margin your numbers allow. Says how close the nearest swap is, whether an equal split would have worked, and gives you the split to send the house.",
    payoff: "now",
    models: ["envy-free-division", "independent-judgments"],
    essays: ["price-the-rooms-not-the-people"],
  },
  {
    id: "chores",
    href: "/chores",
    name: "Who Does Which Chore?",
    short: "Chores",
    when: "The housework was never divided — it settled. Whoever noticed first, or minded the mess most, ended up doing it, and now each of you is quietly sure you do more than your share. Housemates, a couple, a family with teenagers: someone has to say it, and nobody wants it to become a row.",
    ask: "Who should own which chore, so that each of us does no more than our share — as we each count it?",
    does: "Lists the chores with a rough time a week, including the remembering (meal planning, bills, noticing what's run out), and has each person rate how much they mind each one. Gives every chore one owner so the largest share — each chore's time weighted by how much its owner minds it — is as small as it can be; when you mind different things, each of you ends up under an even share. Shows who does what now against after, checks nobody would rather swap lists, and names the chore to take turns on when whole chores won't split evenly.",
    payoff: "now",
    models: ["envy-free-division", "egocentric-bias"],
    essays: ["trade-the-chores-you-mind"],
  },
  {
    id: "bills",
    href: "/bills",
    name: "Who Pays for What?",
    short: "Bills",
    when: "Two of you share a home and one earns more. The bills were split in half the week you moved in and never looked at again, and now one of you is a little short every month and neither wants to be the one who brings it up.",
    ask: "Should we split the bills in half, in proportion to pay, or pool it all — and what does each actually leave us?",
    does: "Lays the three common rules side by side in money, each with the principle it rests on: half each (equal in), in proportion to pay (the same share of what you earn), pool it (the same left over). Says how much the choice is worth — between half each and pooling it's always half the gap in your pay — tests each against one pay stopping, shows which rule you're on now, and ends in a line with the amounts in it for the rule you choose together.",
    payoff: "now",
    models: ["equity-equality-need"],
    essays: ["three-fair-ways-to-split-the-bills"],
  },
  {
    id: "walkaway",
    href: "/walkaway",
    name: "Where's Your Line?",
    short: "Walk-away",
    when: "You're about to negotiate a number — a job offer, a raise, a car, a house, a rate for your work — and you know roughly what you hope for and roughly what's too low. Roughly is how the line ends up being drawn in the room, by their first number.",
    ask: "What's the worst deal I'll take, given what I'll actually do if this falls through — and what am I aiming for?",
    does: "Turns your best alternative (BATNA) into a walk-away point, adjusted for what this deal offers beyond the number; sets a target you can justify out loud; says whether there's room for a deal at all; and tells you whether to name the first number, and what it should be. Then checks any offer on the table against the line you set before you walked in.",
    payoff: "now",
    models: ["batna", "anchoring"],
    essays: ["decide-your-line-first"],
  },
  {
    id: "later",
    href: "/later",
    name: "If It Were Next Week",
    short: "Far-off yes",
    when: "Someone's asked you to do something weeks or months away — a talk, a committee seat, a favour, a trip — and yes is easy, because that week looks empty from here.",
    ask: "Would I say yes if it were next week, out of the week I actually have — and if not, what's my reply?",
    does: "Counts the real hours (prep, travel and the day after, not just the headline), then moves the ask into next week to see whether it's a yes, a no the distance was hiding, a smaller yes, or a no that's just hard to say. Ends in a short reply you can send today.",
    payoff: "now",
    models: ["future-time-slack"],
    essays: ["future-you-is-not-less-busy"],
  },
  {
    id: "worth",
    href: "/worth",
    name: "Is It Worth the Time?",
    short: "Time for money",
    when: "You're trading time against money — pay for the delivery or do the shop, drive across town for a better price, take the cheaper flat with the longer commute — and you're deciding on feel.",
    ask: "What does this trade work out at per hour, and is that more or less than an hour like this is worth to me?",
    does: "Turns the trade into its price per hour (one-off or recurring, over a year), sets it against your own price for that kind of hour, and catches the percentage doing the persuading. Ends in a line you can reuse, so you stop doing the sum.",
    payoff: "now",
    models: ["relative-thinking", "opportunity-cost"],
    essays: ["an-hour-has-a-price"],
  },
  {
    id: "cover",
    href: "/cover",
    name: "Insure It or Carry It?",
    short: "Cover or carry",
    when: "You're offered cover — the extended warranty at the till, phone or gadget insurance, the damage waiver at the rental desk, a lower excess for a higher premium — and it's framed as a worry, with the odds left out.",
    ask: "Could I pay this loss myself, and if I could, is a claim likelier than the odds the cover needs to beat?",
    does: "Sorts the loss by whether you could pay it from savings — insure it if not — and for the ones you could carry, works out the chance of a claim at which the cover breaks even, then checks your read of the odds against the known overestimate. Ends in a line to keep for the next till.",
    payoff: "now",
    models: ["probability-weighting", "ruin"],
    essays: ["insure-the-catastrophe"],
  },
  {
    id: "fix",
    href: "/fix",
    name: "Fix It or Replace It?",
    short: "Fix or replace",
    when: "Something you rely on has broken — the washing machine, the laptop, the car, the boiler — and you're holding a repair quote in one hand and the price of a new one in the other, pulled one way by what you've already spent and the other by the shiny new model.",
    ask: "How long would the repair have to keep it going to beat buying new, and do I believe it will?",
    does: "Divides the quote by what a new one costs per year of use (less what the old one would fetch and anything the new one saves to run) to get the time the repair has to buy, then reads your answer, puts each pull — sunk cost, the upgrade, waste, the next fault — in its place, and shows where the half-the-price rule of thumb agrees.",
    payoff: "now",
    models: ["mental-accounting", "sunk-cost"],
    essays: ["what-the-repair-has-to-buy"],
  },
  {
    id: "monthly",
    href: "/monthly",
    name: "Pay Now or Pay Monthly?",
    short: "Pay monthly",
    when: "There's a price, and under it, in bigger type, a smaller one: 'or £59.99 a month', interest-free over a year, four payments at the checkout. The small number is easier to say yes to, and you can't tell from it what the plan really costs.",
    ask: "What does the plan add up to, what yearly rate is that, and would I buy this at this price without it?",
    does: "Adds up every payment, deposit and fee against the price today and turns the difference into the yearly rate the plan charges. Then asks whether you could pay today and whether you'd buy it without the plan: interest-free and already decided means spread it and automate every payment; a rate means pay now or wait; can't pay today means it's a loan to afford it, so check it fits. Counts it with the plans you already pay.",
    payoff: "now",
    models: ["pain-of-paying"],
    essays: ["the-smallest-number-on-the-page"],
  },
  {
    id: "debts",
    href: "/debts",
    name: "Which Debt First?",
    short: "Which debt first?",
    when: "You owe on a few things, cards, a store card, an overdraft, a loan, and there's an amount you can put towards them each month. After the minimums, you're not sure where the rest should go, so it goes a bit on each.",
    ask: "After the minimums, which debt gets the rest, and what does the quick win of clearing the smallest one really cost?",
    does: "Runs costliest-first, smallest-first and spread-around on your own debts, month by month. Says what the quick win costs and takes it when it's cheap, goes by rate when it isn't, and offers one quick win then the rate if you've stalled before. Gives this month's payments and the month each debt goes, and shows what paying only the minimums would cost and what a little more each month would save. Can't cover the minimums? Free debt advice first.",
    payoff: "now",
    models: ["goal-gradient", "anchoring", "compound-interest"],
    essays: ["one-debt-at-a-time"],
  },
  {
    id: "lend",
    href: "/lend",
    name: "Lend It, Give It, or Say No?",
    short: "Lend money",
    when: "A friend or relative has asked to borrow money, or to co-sign a loan, and someone you care about is waiting for an answer. Yes feels kind and no feels mean, and neither feels like the right size.",
    ask: "How much could I give and never think about again, and is anything beyond that a loan I could wait for?",
    does: "Starts from what losing the money would do to you and the most you could hand over as a gift. Up to that: give it, and say it's a gift. Beyond it: a smaller gift, a loan written down with dates (with the repayments in your calendar), or a no that offers help instead. Co-signing is read as promising to pay all of it. Ends in the words to send.",
    payoff: "now",
    models: ["communal-exchange", "ruin"],
    essays: ["lend-only-what-you-could-give"],
  },
  {
    id: "scam",
    href: "/scam",
    name: "Is It Real? Before You Pay, Click or Reply",
    short: "Is it a scam?",
    when: "A text, call or message wants something now: a parcel fee, your bank's fraud team, a new number saying it's your son. It looks real enough, and it says there isn't time to check.",
    ask: "Does anything in this ask the way only scammers ask, and how do I check it on details they didn't give me?",
    does: "Ignores how it looks, which costs a scammer nothing, and reads what they can't hide: who started it, what it asks for, how it wants paying and what's pushing you. A code, gift cards, crypto, cash at the door, a \"safe account\" or a secret: stop. Anything else that came to you and wants something: check it by contacting them yourself, with the way to do that for a bank, a relative, a company or an office, and the words to end the call. Already paid? The steps for the first hour.",
    payoff: "now",
    models: ["costly-signals", "base-rates"],
    essays: ["judge-the-ask-not-the-look"],
  },
  {
    id: "refund",
    href: "/refund",
    name: "Get Your Money Back",
    short: "Get money back",
    when: "Something you paid for broke, never arrived, or was done badly. You rang, and they said it's the manufacturer's problem, or the courier's, or that it's out of warranty. You're about to let it go.",
    ask: "What does the law give me for this problem at this age, what do I send, and what do I do if they say no?",
    does: "Finds your remedy for the problem and its age (reject within 30 days, one repair or replacement, then a refund; a lost parcel is the seller's problem; bad work redone or the price cut; 14 days to cancel online), writes the message with a date to reply by, and chooses the next rung before you send it: section 75 or a chargeback from your card company, the platform's protection, an ombudsman, or a final letter and small claims.",
    payoff: "now",
    models: ["sludge", "implementation-intentions"],
    essays: ["ask-once-in-writing-with-a-date"],
  },
  {
    id: "flight",
    href: "/flight",
    name: "Flight Delayed or Cancelled",
    short: "Flight compensation",
    when: "Your flight landed hours late, was cancelled at short notice, or left without you. The airline says it was extraordinary circumstances, or hasn't said anything, and a claims company wants a share.",
    ask: "Am I owed compensation, how much, and what do I send?",
    does: "Works out what UK261 or EU261 owes each passenger (£220 to £520, fixed by distance, from three hours late at the door; cancellations inside two weeks; being bumped), answers the reason they gave (a technical fault or their own crew isn't extraordinary), writes the claim, and dates the day the free ADR scheme or the CAA can take it.",
    payoff: "now",
    models: ["sludge", "implementation-intentions"],
    essays: ["ask-once-in-writing-with-a-date"],
  },
  {
    id: "deposit",
    href: "/deposit",
    name: "Get Your Deposit Back",
    short: "Deposit back",
    when: "You've moved out, and the landlord or agent wants a new carpet, a full repaint and a professional clean out of your deposit. It feels like your word against theirs, and you're about to offer half and hope.",
    ask: "Which of these deductions would an adjudicator actually allow, how much should I ask back, and what do I send?",
    does: "Prices each deduction the way the deposit schemes' adjudicators do: fair wear and tear and unevidenced claims are refused, a replacement is charged only for the life the old one had left (a carpet five years into a six-year life is a sixth of a new one), cleaning is owed back to the check-in standard. Turns that into one number to ask for, writes the reply, and dates the last day to take it to the free dispute service. Never protected? The claim for up to three times the deposit.",
    payoff: "now",
    models: ["anchoring", "sludge"],
    essays: ["charge-for-the-life-that-was-left"],
  },
  {
    id: "parking",
    href: "/parking",
    name: "Parking Ticket: Pay or Appeal?",
    short: "Parking ticket",
    when: "A ticket on the windscreen, or a letter a fortnight later with a photo of your number plate. Your hand is on the card to pay the discount and make it go away, or the letter is heading for a drawer.",
    ask: "Should I pay this, or appeal, and what does appealing cost me if I lose?",
    does: "Tells a council ticket from a private one, works out what each choice costs (pay now, appeal and win, appeal and lose), and from that whether trying is free or worth it only above a break-even chance. Checks whether a camera letter came too late for the keeper to be liable, writes the challenge, appeal or reply for the stage you're at, and dates the next step before it goes up.",
    payoff: "now",
    models: ["expected-value", "sludge"],
    essays: ["what-does-losing-cost"],
  },
  {
    id: "catchup",
    href: "/catchup",
    name: "A Catch-up Energy Bill: What Do You Owe?",
    short: "Catch-up energy bill",
    when: "The smart meter stopped sending readings, or the estimates ran low, and now one bill asks for a year or two of the difference at once. You're about to put it on a card, or argue with it in general terms.",
    ask: "How much of this catch-up bill do I actually owe, and how do I pay the rest?",
    does: "Splits the bill at the back-billing cut-off (12 months before the bill in Great Britain, 13 in Northern Ireland), weighting each month by how much gas or electricity a home typically uses then, so you know roughly what's too old to charge. Says whether the limit applies given why the bill was late, writes the complaint with the rule in it, sizes the repayment plan to ask for, and dates the day the free ombudsman opens.",
    payoff: "now",
    models: ["sludge", "status-quo-bias"],
    essays: ["whose-delay-was-it"],
  },
  {
    id: "sell",
    href: "/sell",
    name: "Sell It, Keep It, or Let It Go?",
    short: "Sell or keep",
    when: "Something you own sits unused: the bike in the hall, the camera in a drawer, last year's phone. You keep meaning to sell it once you've worked out what it's worth, and what you paid keeps getting in the way.",
    ask: "If I didn't have it, would I buy it today for what it would sell for, and if not, what should I ask and what's the lowest I'll take?",
    does: "Asks the buyer's question against what similar ones actually sold for. Yes: keep it. Not sure: box it with a date (and a calendar reminder), and it goes if you haven't fetched it. No: sell it, unless selling pays less than your time, in which case give it away. Prices it from sold listings, never from what you paid, at a precise number if you want the most or a round one if you want it gone, and ends in the listing, the lowest offer to take and the reply to a lowball.",
    payoff: "now",
    models: ["status-quo-bias", "sunk-cost", "anchoring"],
    essays: ["what-you-paid-isnt-on-the-listing"],
  },
  {
    id: "keep",
    href: "/keep",
    name: "Still Worth Paying For?",
    short: "Keep or cancel",
    when: "The subscriptions have piled up — the gym, the streaming services, the app that renewed in March, the yearly one you'd forgotten — and each renews itself without anyone asking whether it's still worth it.",
    ask: "If I didn't have this, would I sign up today, at this price, for the use I actually get?",
    does: "Goes through your subscriptions one by one: what each costs a year and a use (counting last month's uses, not planned ones), whether paying per use would be cheaper, and the fresh-start question. A 'not sure' on something easy to rejoin reads as cancel and see if you miss it; the whole list ends in what cancelling would free a year.",
    payoff: "now",
    models: ["status-quo-bias", "reversibility"],
    essays: ["the-subscription-you-wouldnt-buy-today"],
  },
  {
    id: "trial",
    href: "/trial",
    name: "Before the Trial Ends",
    short: "Free trial",
    when: "You're about to start a free trial — the streaming service for one series, the app with a week free, the box with the first one on the house — and you fully intend to cancel if it isn't worth it. So did everyone it ever charged.",
    ask: "When do I have to cancel by, and can I flip the default so it ends unless I choose it?",
    does: "Asks whether cancelling today keeps the free time: if it does, cancel now and the trial ends on its own. If not, works out the cancel-by date (two days before the first charge), says what forgetting would cost, puts the date on your return desk and in your calendar, and on the day asks the fresh-start question with the price in it. Keeps your record: how many trials you cancelled, kept or got charged for, against what you expected at sign-up.",
    payoff: "later",
    models: ["defaults"],
    essays: ["make-the-trial-end-on-its-own"],
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
    essays: ["tie-me-tighter"],
  },
  {
    id: "rule",
    href: "/rule",
    name: "Make It a Rule",
    short: "Make a rule",
    when: "It's not one decision — it's the same small call you keep facing: the after-hours message, the impulse buy, the \"quick\" favour that eats the evening. You re-decide it from scratch every time, usually while tired or tempted, and usually the way you later wish you hadn't.",
    ask: "Should I keep making this call case by case — or make it once, as a rule, and stop spending the willpower?",
    does: "Turns a recurring decision into a standing rule: checks it actually recurs, forces the call into a bright line you can tell you've broken, makes you name the rare exceptions that should genuinely override it, and schedules a review on the return desk — so you decide it once, cold, instead of a hundred times under pressure.",
    payoff: "now",
    models: ["bright-line-rules"],
    essays: ["decide-it-once"],
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
    toolIds: ["doors", "ruin", "widen", "weigh", "compare", "par", "outside", "test", "incentives", "enough", "stop", "trace", "cool", "regret", "advise", "crux", "round", "split", "chores", "bills", "lend", "scam", "refund", "flight", "deposit", "parking", "catchup", "walkaway", "later", "worth", "cover", "fix", "monthly", "debts", "sell", "keep", "quit", "rule"],
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
      "The week after a decision is where most of them quietly die: never started, or never revisited when something changed. These close the gaps — one turns the call into a first move, one sets the signal that says stop and rethink, and one catches the free trial before its default decides for you.",
    toolIds: ["act", "tripwire", "trial"],
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
