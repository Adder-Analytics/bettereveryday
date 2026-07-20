"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { posts, formatDate } from "../data/posts";
import { models } from "../data/models";
import { books } from "../data/books";
import { notes } from "../data/notes";
import { situations } from "../data/situations";

type SearchDoc = {
  type: "Essay" | "Note" | "Model" | "Book" | "Playbook" | "Tool";
  title: string;
  href: string;
  snippet: string;
  meta: string;
  /** Weighted fields, lowercased: [title-level text, body text] */
  titleText: string;
  bodyText: string;
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

const docs: SearchDoc[] = [
  ...posts.map((p): SearchDoc => ({
    type: "Essay",
    title: p.title,
    href: `/writing/${p.slug}`,
    snippet: p.excerpt,
    meta: `${formatDate(p.date)} · ${p.readTime} min read`,
    titleText: `${p.title} ${p.tags.join(" ")}`.toLowerCase(),
    bodyText: `${p.excerpt} ${stripHtml(p.content)}`.toLowerCase(),
  })),
  ...notes.map((n): SearchDoc => ({
    type: "Note",
    title: n.title,
    href: `/notes#${n.slug}`,
    snippet: stripHtml(n.content).trim().slice(0, 200),
    meta: `${formatDate(n.date)} · ${n.bookTitle}`,
    titleText: `${n.title} ${n.bookTitle}`.toLowerCase(),
    bodyText: stripHtml(n.content).toLowerCase(),
  })),
  ...models.map((m): SearchDoc => ({
    type: "Model",
    title: m.name,
    href: `/models#${m.id}`,
    snippet: m.tagline,
    meta: m.domain,
    titleText: `${m.name} ${m.domain}`.toLowerCase(),
    bodyText: `${m.tagline} ${m.explanation}`.toLowerCase(),
  })),
  ...books.map((b): SearchDoc => ({
    type: "Book",
    title: `${b.title} — ${b.author}`,
    href: "/bookshelf",
    snippet: b.annotation,
    meta: `${b.category} · ${b.year}`,
    titleText: `${b.title} ${b.author} ${b.category}`.toLowerCase(),
    bodyText: b.annotation.toLowerCase(),
  })),
  ...situations.map((s): SearchDoc => ({
    type: "Playbook",
    title: s.title,
    href: `/playbook#${s.id}`,
    snippet: s.scene,
    meta: `${s.models.length} models for this situation`,
    titleText: `${s.title} ${s.question}`.toLowerCase(),
    bodyText: `${s.scene} ${s.question} ${s.models
      .map((m) => m.move)
      .join(" ")} ${s.tool ? s.tool.move : ""}`.toLowerCase(),
  })),
  {
    type: "Tool",
    title: "Practice your judgement",
    href: "/practice",
    snippet:
      "Three short trainers for the three numbers under every decision — how sure you are, how to get to a number, and how much a new fact should move you — plus your real record from the decision journal beside them, and, once your record spans enough time, the trend: your first rounds beside your latest, so the site can answer its own name.",
    meta: "Practice hub — trainers, your real record, your trend",
    titleText:
      "practice hub trainers judgement judgment dashboard profile calibration estimation base rates forecasting uncertainty three numbers decisions what to practice next thinking gym real record scoreboard keeping score track record trend progress improvement getting better over time learning curve".toLowerCase(),
    bodyText:
      "the practice hub. calibration, estimation, and base-rate updating are three faces of one skill: putting honest numbers on an uncertain world. how wide should your uncertainty be, how do you get to a number at all, and how much should a new fact move the number you've got. this page reads all three trainer records from your browser and shows them together — your ninety-percent hit rate beside your typical estimation miss beside your base-rate lean — so you can see in one glance which of the three your judgement is weakest on, and it suggests where to spend the next ten minutes. below the trainers sits the real game: your record from the decision journal — your real-world overconfidence gap, whether things go the way you say they will, how many reviews are due — because the trainers are a kind learning environment on purpose and your actual decisions are the wicked one they warm you up for. when reviews are due, that outranks any practice suggestion. and once your dated record is big enough — enough answers in each half, spanning at least a couple of weeks — each card shows the trend: your first rounds beside your latest, are you actually getting better, improving, plateauing, the learning curve made visible. the split is by volume, eras against eras, never today against yesterday, because a day's score is mostly noise and your best day is mostly luck (regression to the mean). nothing leaves the browser. paired with the essays three numbers for an uncertain world, experience doesn't teach, and the compound needs evidence.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Calibration trainer",
    href: "/calibrate",
    snippet:
      "Does your 90% actually mean 90%? Put confidence intervals on facts with knowable answers and find out, immediately, how overconfident you are — then recalibrate the feeling of being sure. One of the few thinking skills that's quickly, measurably trainable.",
    meta: "Calibration trainer",
    titleText:
      "calibration trainer calibrate confidence overconfidence forecasting probability 90 percent interval equivalent bet hubbard tetlock superforecaster uncertainty estimate odds".toLowerCase(),
    bodyText:
      "a calibration trainer. the decision journal asks how sure you are; this is where you find out whether your sure is worth anything. two modes: give ninety percent confidence intervals on numeric trivia with knowable answers — calibrated people's ranges contain the truth about nine times in ten, most people get half that — or say whether a statement is true and how confident, then see your calibration curve, of the times you said seventy percent how often were you right. uses douglas hubbard's equivalent bet to catch overconfidence: would you rather win on your range or on a nine-in-ten wheel. calibration is one of the few biases that's trainable in an afternoon with feedback, and being well-calibrated is what most distinguishes philip tetlock's superforecasters. your record accumulates across rounds in your browser. the skill underneath every forecast in the decision journal.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Estimation trainer",
    href: "/estimate",
    snippet:
      "How many piano tuners work in Chicago? You can get within a factor of two without looking it up — by breaking the question into pieces you can estimate and multiplying. Practise Fermi estimation: decompose a hard quantity, or take one-shot order-of-magnitude guesses and see how far off you were.",
    meta: "Estimation trainer",
    titleText:
      "estimation trainer estimate fermi decomposition order of magnitude back of the envelope guess number sense market sizing approximation napkin math piano tuners chicago".toLowerCase(),
    bodyText:
      "an estimation trainer for fermi estimation. most useful questions don't come with the number attached: how big is this market, how long will this take, how many people would use this. the skill is to break the question into smaller pieces you can guess and multiply them — the rough parts beat the confident whole because independent errors tend to cancel. two modes: decompose, which walks one hard problem (how many piano tuners in chicago, how many golf balls fit in a school bus) by asking for a gut guess first and then building the answer from its factors so you watch the decomposition beat the gut; and one-shot, eight quantities that span orders of magnitude — trees on earth, neurons in a brain, people who have ever lived — scored by how many factors of ten you were off, aiming to land within an order of magnitude. named for enrico fermi. your record accumulates across rounds in your browser, tracking your typical miss and how often decomposition beats your gut. the companion skill is calibration: a number is only worth as much as the honest error bars around it.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Base-rate trainer",
    href: "/update",
    snippet:
      "A 99%-accurate test for a 1-in-1,000 disease comes back positive — your chance of having it is about 9%, not 99%. Practise updating on evidence the way the numbers demand: weigh a result against how rare the thing was, and watch the base rate do the work. Catches the near-universal habit of trusting the test and forgetting the prior.",
    meta: "Base-rate trainer",
    titleText:
      "base rate trainer update bayes bayesian posterior prior probability conditional false positive base-rate neglect natural frequencies gigerenzer test screening prevalence sensitivity specificity evidence belief reference class outside view inside view planning fallacy pick the prior kahneman flyvbjerg".toLowerCase(),
    bodyText:
      "a base-rate trainer for bayesian updating. a test is 99 percent accurate and you test positive for a disease one person in a thousand has, so what's the chance you have it. almost everyone says ninety-nine percent; it's about nine percent, because the rare true cases are swamped by false positives from the huge healthy majority. that error — fixating on the test's accuracy and forgetting how rare the thing is — is base-rate neglect, and it's behind needless cancer scares, highly accurate screens that are wrong most of the time, fraud alerts you learn to ignore, and mass-surveillance false alarms. the cure is gerd gigerenzer's natural frequencies: stop thinking in percentages and count a concrete crowd, where the answer becomes something you can simply tally. three modes: walk through one scenario slowly (a positive mammogram, a rare-disease test) by guessing first and then watching the numbers redrawn as a crowd; a round of six quick ones (a fraud alert, a drug test, a flu test in season, an airport face-recognition match) scored on how many percentage points off you were and whether you keep landing high — the signature of neglecting the base rate; and pick the prior, which drills the harder upstream judgement of choosing the reference class itself — messy real questions with no answer key (a deadline you're about to promise, a friend's restaurant, a wedding, a startup) where you give a gut answer, then choose the class you'd start from, dodging the traps: classes of one and folklore rates with no study behind them. it tracks your inside-view premium — how far your gut runs above the outside view before any evidence arrives. it isn't always distrust the test: when the base rate is high a positive is strong evidence, and the same test means different things at different base rates. your record accumulates across rounds in your browser. the companions are calibration and estimation: how wide your uncertainty should be, how to get to a number, and how much a new fact should move it.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Pre-mortem",
    href: "/premortem",
    snippet:
      "Declare the plan dead before it starts and write the history of the failure — people are about 30% better at explaining an outcome than predicting one. Then turn every cause into a plan change, a tripwire with a date, or a risk you accept on purpose. Gary Klein's exercise, runnable solo in twenty minutes.",
    meta: "Pre-mortem & tripwires",
    titleText:
      "premortem pre-mortem tool plan failure tripwire tripwires kill criteria quit quitting stop reconsider klein prospective hindsight risk stress test funeral autopsy check fired all clear due confidence forecast log logging decision journal de-bias debias overconfidence honest number veinott".toLowerCase(),
    bodyText:
      "a guided pre-mortem room. gary klein's technique: instead of asking what could go wrong, declare that the plan has already failed and write the history of that failure — prospective hindsight, imagining the event as already having happened, raises the ability to identify reasons for future outcomes by about thirty percent (mitchell, russo and pennington). kahneman calls it his favorite counter to overconfidence because it legitimizes doubt. three steps: name the plan and the day you'd know it failed; write the reasons it died, past tense, fast, with lenses for when you're stuck (people, money, time, the outside world, you); then triage every cause — change the plan now while it's cheap, set a tripwire, or accept the risk with open eyes. tripwires are annie duke's kill criteria: a state and a date — an observable signal ('below 100 paying users') and a real calendar day to check it, decided while you're calm, like van halen's brown m&ms clause or the everest turnaround time. each tripwire check can be added to your calendar as an ics reminder for google, apple, or outlook, carrying the signal and the failure it guards. when a check date arrives the room asks for the answer and records it — the signal fired, or all clear, with a re-arm for a new date if the risk is still live — like aviation's challenge and response checklists, where the answer must be the actual status, never a bare 'checked'. if a tripwire fires, the plan doesn't get the benefit of the doubt: the room holds you to the response you pre-committed and hands you to the quitting worksheet. due checks surface on the homepage and in the decision journal. when the plan survives its funeral, the room logs it to the decision journal as a tracked forecast at the honest, de-biased confidence the exercise produces — imagining a plan already dead lowers confidence in it about twice as much as a pro-and-con list (veinott, klein and colleagues, 2010) — so reality grades the forecast on the judge date, not just the outcome. saved pre-mortems stay in your browser; nothing is sent anywhere. pairs with the decision journal for logging the decision itself, and the essays hold the funeral first, the honest number comes after, and the plan was never tried.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "The flip point",
    href: "/weigh",
    snippet:
      "Stop arguing whether the odds are 60% or 70% when the decision flips at 40%. Find the threshold where acting and not acting break even — p* = R/(B+R) — and just ask which side you're on. The honest form of expected value, for any either/or call.",
    meta: "Flip point — the decision threshold tool",
    titleText:
      "weigh flip point decision threshold tool expected value ev breakeven break-even indifference probability p-star treatment threshold pauker kassirer either or should i cost benefit payoff upside downside odds act stakes margin of safety ruin value of information hubbard sensitivity".toLowerCase(),
    bodyText:
      "the flip point, a decision-threshold tool for either/or calls. two people argue whether the odds are sixty or seventy percent and never notice the decision flips at forty, where they both clearly sit — the argument is about the wrong number. this tool finds the right one: the threshold probability at which acting and not acting break even, so instead of pinning down an exact probability you can't know, you only have to judge which side of a line you're on. it comes from medicine — pauker and kassirer's threshold approach to clinical decision making (new england journal of medicine, 1980): rather than the exact probability a patient is sick, find the treatment threshold and ask whether they're above or below it. frame any decision against the alternative and there are three numbers: the upside if acting works (b), the downside if it doesn't (r), and your honest probability. the flip point is p* = r/(b+r) — equal stakes put the line at fifty percent, a big upside drops it so you should act even on a long shot, a lopsided downside pushes it toward near-certainty. how sure you need to be depends entirely on what's at stake. three dividends: it tells you when to stop gathering information (hubbard's value of information — only a fact that could move you across the line is worth knowing); it makes overconfidence concrete by shaving your measured calibration gap off your probability to see whether you're still on the same side of the line, the point where the calibration trainer finally pays off; and it flags when a decision is too close to call, handing it back to what you couldn't quantify — reversibility, opportunity cost, regret. the one override: a downside you can't recover from (ruin), where expected value's assumption that you keep playing fails and margin of safety takes over. nothing leaves your browser; a call you commit to can be logged straight to the decision journal as a tracked forecast. paired with the essay the flip point and the models expected value and the decision threshold.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "The halo comes off",
    href: "/compare",
    snippet:
      "Choosing among several options — two jobs, three apartments, a shortlist of offers? One strong first impression colours how you rate everything else. Score each option one factor at a time, keep your gut call separate and last, and examine the gap between them. Kahneman's Mediating Assessments Protocol, as a tool.",
    meta: "Compare options — the anti-halo tool",
    titleText:
      "compare options choose choice which of these multi-option decision matrix job offers apartments shortlist halo effect nisbett wilson mediating assessments protocol kahneman sibony sunstein noise decision hygiene factors weight score gut instinct disciplined intuition delay judgment independent tool".toLowerCase(),
    bodyText:
      "the halo comes off, a tool for choosing among several options — the which-of-these decision the other instruments don't cover (they work act-or-don't). the trap in that shape is the halo effect (nisbett and wilson, 1977): one strong impression of an option — the salary, the founder's energy, the kitchen — bleeds into how you rate everything else about it, so the choice is quietly made in the first ten seconds and the comparison is a rationalisation, and knowing about it doesn't switch it off. the fix is structural: kahneman, sibony and sunstein's mediating assessments protocol (noise, 2021). break the choice into the few factors that matter, and score every option one factor at a time — across a row, not down a column — so you judge a single dimension before any overall impression can form. then the discipline that does the real work: keep the holistic gut call separate and last, disciplined intuition made to wait until it can't contaminate the inputs. the tally stays hidden until you've named which option your gut wants, so a running score can't anchor you. the output that matters isn't the winning number — it's the gap between what the factors say and what your gut wanted: when they disagree, either you're weighting a factor you didn't admit to, or there's one you never wrote down, and that gap is the most useful thing on the page. it also flags the hinge — the single factor the winner is riding on, where dropping it flips the ranking — so you know which score to be surest of, and warns when the top options are too close to separate. coarse weights on purpose (minor/normal/major); false precision is the enemy. nothing is sent anywhere; inputs persist in your browser, and a choice you commit to can be logged to the decision journal as a tracked forecast. pairs with the halo effect and mediating assessments protocol models, the essay whether-or-not is a trap, and — once it's down to a two-way call — the flip point.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Cool the call",
    href: "/cool",
    snippet:
      "For the decision made hot — the email fired in anger, the panic-sell, the leap made while infatuated. When you're hot, the real choice isn't act-or-don't, it's decide-now-or-once-you're-cool. Reversibility and a real deadline settle that; then it helps you get distance — answer it in a friend's name, run 10/10/10.",
    meta: "Cooling-off — deciding while hot",
    titleText:
      "cool cooling off tool decide hot emotion anger fear panic infatuation fomo sunk cost impulse angry email panic sell wait sleep on it self-distancing solomon's paradox hot cold empathy gap loewenstein grossmann kross 10/10/10 ten ten ten suzy welch reversible irreversible one-way door cooling-off period regret".toLowerCase(),
    bodyText:
      "the cooling-off tool, for deciding while hot. every other instrument on the site assumes a calm person reasoning; this one meets the person the others can't reach — the one with their pulse up, when reasoning is the faculty that's compromised. the decisions people most regret are made hot: the email fired off in anger, the panic-sell after bad news, the leap made while infatuated, the sunk cost you can't stand to write off. it isn't a feelings worksheet — its output is a decision, and a narrow one the research hands us: when you're hot, the real choice isn't act or don't, it's decide now or once you're cool. two facts you can still judge settle it — is the door reversible, and is something outside you genuinely forcing the clock (fomo and sunk cost manufacture a now-or-never that isn't real). reversible and nothing forcing it: sleep on it, waiting is nearly free. irreversible and nothing forcing it: the one combination you never act on hot. forced to make a one-way call while hot: the hardest case — look for a reversible version, buy time, make the smallest undoable piece. then the two research-backed moves for manufacturing distance: across person, answer the decision in someone else's name (solomon's paradox — grossmann and kross found people reason more wisely about a friend's identical dilemma, and the gap closes with a distanced view); across time, suzy welch's 10/10/10, how will this look in ten minutes, ten months, ten years, because a hot state (loewenstein's hot–cold empathy gap) collapses the horizons into one loud now. the honest caveat is kept in view: distance is for stripping the overweighting, not for numbing a feeling that's real information — some feelings are data. nothing is sent anywhere; inputs persist in your browser so a decision you slept on is still here, unchanged, when you come back cold. pairs with the essay you give better advice than you take, the self-distancing model, and — once you've cooled off — the flip point and the decision journal.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "And then what?",
    href: "/trace",
    snippet:
      "Most bad decisions come from stopping the analysis one step too early, at the first-order effect. Trace a move past it — and then what, and then what — tag each effect better or worse for what you want, and read the sign pattern. The trap is always first-order positive; the treasure's cost is always up front.",
    meta: "Second-order thinking — trace the consequences",
    titleText:
      "trace and then what second order effects second-level thinking consequences downstream ripple unintended cane toad cobra effect bastiat seen unseen howard marks first-order later reversal sign flip present bias hyperbolic discounting bill comes later trap tool".toLowerCase(),
    bodyText:
      "and then what, a consequence-tracing tool for second-order thinking. almost every avoidable mistake is the same mistake: the analysis stopped one step too early, at the first-order effect — the immediate, visible, intended result that's the reason the move is tempting. the cane toads were imported to eat the beetles; the reasoning about the first link was fine (toads eat insects) and nobody asked and then what. first-order effects are immediate and visible; the second and third orders are delayed, diffuse, and often pointed the other way. this tool makes you keep asking. name the move, then trace it: the effect you want, and then what follows, and then what follows that — especially how the people affected adapt, because second-order effects live wherever people respond. tag each effect better or worse for what you actually want, and it reads the pattern, because the single most useful thing a trace reveals is the sign flip: where the effect you're doing it for turns into the one you live with. the trap is always first-order positive and later negative — the dessert, the debt, the shortcut, the rat bounty — and it fools us through present bias (hyperbolic discounting, ainslie, laibson, frederick loewenstein o'donoghue): we discount the future steeply so the near reward looms and the later cost fades. the mirror is the treasure: first-order negative and later positive, the shape of nearly everything worth doing (exercise, the hard conversation, saving), which stays available because most people quit at the up-front cost. two lenses: systems with people who adapt (a rule that assumes everyone keeps behaving as before has already failed — the cobra effect, goodhart's law) and competitive arenas where the first-order conclusion is already priced in (howard marks's second-level thinking, the opportunity lives only in the gap between what's true and what everyone believes). nothing is sent anywhere; inputs persist in your browser. no journal write — a consequence trace isn't a forecast — only links onward: guard the later effect as a tripwire in the pre-mortem, take the either/or to the flip point, or log the call in the decision journal. paired with the essays the bill comes later and and then what, and the second-order effects model.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Decision journal",
    href: "/decide",
    snippet:
      "Work a real decision through the models that apply, log what you expect to happen, then come back when the outcome is in and compare. A decision log you can actually learn from.",
    meta: "Decision journal & worksheet",
    titleText:
      "decision journal worksheet decide tool log review outcome calibration confidence hindsight resulting decision quality luck memo export import backup example calendar reminder ics google apple outlook follow-through follow through first move execution intention action gap".toLowerCase(),
    bodyText:
      `an interactive decision journal. pick the situation you're in, reason through the models that apply, write the call, record what you expect to happen and how confident you are, and set a review date. add that review to your calendar as a reminder (an ics file for google, apple, or outlook) so it comes back to you on the day — or add every pending review at once. come back later to log what actually happened and compare it against what you predicted — defeating hindsight bias and outcome bias. keeps a decision log in your browser that you can export as a file to back up or move between devices, and import again. shows your calibration once you've reviewed a few decisions — of the calls you were seventy percent sure of, how many actually went your way — and separates decision quality from outcome quality (annie duke's resulting) so a good call that got unlucky doesn't get filed as a mistake. the review also asks a third question: did you take the first move you wrote down — took it, partly, or never — because roughly half of sincere intentions never become action (the intention-behavior gap, sheeran's inclined abstainers), and an untried plan's outcome can't grade the call behind it; your follow-through rate accumulates in the log beside your calibration. due tripwire checks from your pre-mortems surface here too, and a plan that survives a pre-mortem can be logged straight here as a tracked forecast at the honest, de-biased confidence the funeral produces. your reviewed record also appears on the practice page, beside the calibration, estimation, and base-rate trainers — the real game next to the warm-up. includes a worked example. ${situations
        .map((s) => s.title)
        .join(" ")}`.toLowerCase(),
  },
  {
    type: "Tool",
    title: "Due for review",
    href: "/review",
    snippet:
      "The whole site runs on one loop: decide now, come back later to see what happened. This is the coming-back. One page gathers every review and tripwire check you've scheduled across the tools, shows what's due and what's coming, and links each straight to where you answer it — so the return, the half that actually teaches you, stops depending on memory.",
    meta: "The return desk — everything due, in one place",
    titleText:
      "review return desk due reviews tripwire checks coming up inbox what's due follow up follow-up loop close the loop second half come back revisit open loop zeigarnik tickler file 43 folders getting things done gtd david allen weekly review reminder scheduled dashboard queue overdue deep link straight to the entry one click friction channel factor last inch".toLowerCase(),
    bodyText:
      "the return desk (/review): one place to answer everything the site scheduled. the whole site runs on one loop — decide now, come back later to see what actually happened — and every tool has built the first half (the calm worksheet, the honest forecast, the armed tripwire) while the second half, the return, never had a home. the most common way a decision journal fails isn't a bad forecast; it's a good forecast nobody ever goes back to grade. in the moment you can't tell a good decision from a lucky one — they look identical from the inside — so the learning lives entirely in the back half, when reality hands back its answer and you make yourself look. this page is that surface. it reads, never writes, everything the tools are holding for you and folds it into one queue: the decision journal's forecasts due for review and the pre-mortem room's armed tripwire checks due, split into what's due now (most overdue first) and what's coming up (soonest first, so the wait is visible — the gap between deciding and knowing is where luck and skill separate). each due item deep-links straight to the exact thing that answers it — a decision opens on its own review screen, a tripwire drops you inside its pre-mortem with the due one lit up and centered — so the return is one click from where you are, landing on the answer rather than at the tool's front door. the link stops at the form on purpose: it removes the navigation friction (the hunting) but never the thinking friction (setting what you predicted beside what happened), which is the review itself. it's the tickler file idea (david allen's open loops and the 43-folder follow-up file, resting on bluma zeigarnik's finding that the mind keeps unfinished commitments half-loaded until they're parked somewhere trusted): a scheduled check only discharges the loop if it lands in a system you actually revisit, and a due review with nowhere to land is a reminder you swipe away. why we skip the return isn't only forgetting — it's that the return is the one moment that can tell you something you don't want to hear (the confident call that was luck, the ninety-percent that hits six times in ten), and the easiest way to avoid the sting of being wrong on the record is to never open the record. the desk removes the friction and the forgetting; the willingness to look is still yours to bring. it also carries the durability nudge — how much you've logged since your last backup — because everything lives only in your browser and the record is only as safe as its last copy. nothing is sent anywhere. paired with the essay the return, and it's where the homepage due badge, the calendar reminders, and the practice hub all point when something comes due.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Your data",
    href: "/data",
    snippet:
      "Everything the tools here keep lives only in your browser — nothing is uploaded. Good for privacy, bad for durability: clear your cache or switch devices and it's gone. Back up all of it to one file you own, and restore it anywhere.",
    meta: "Back up and restore everything",
    titleText:
      "your data backup back up export import restore download file portability durability local-first local first localstorage browser storage privacy own your data longevity move devices new laptop phone clear cache lose data escape hatch".toLowerCase(),
    bodyText:
      "the your-data page: back up everything this site keeps for you, and restore it anywhere. every tool here — the decision journal, the pre-mortem room and its armed tripwires, the flip point, the cooling-off tool, the consequence trace, and the calibration, estimation, and base-rate trainers — keeps what you write in your browser and sends nothing to any server. that is the privacy story and a real one: no account, nothing to breach. but browser storage (localstorage) is not durable. clearing your browsing data erases it, it doesn't survive a private window, some browsers evict it under storage pressure from sites you visit rarely — which a quarterly decision journal is by design — and it never leaves the one device. and this whole site runs on the review loop: log a forecast now, come back in months to see what happened. a record you'll lose is a review you'll never do, so durability is load-bearing, not a nice-to-have. this page is the fix: export writes one json file that is a faithful snapshot of all your stored data; restore reads such a file back, and because restore replaces what's in the browser it first auto-downloads a safety copy of your current state and shows you exactly what the incoming file contains before it writes. nothing is ever uploaded — the file only leaves your machine if you move it yourself, which is the point: a backup you own and can carry. this is the local-first ideal (ink and switch, 2019: you own your data, longevity) done the only honest way a zero-backend site can — a file you hold. the decision journal keeps its own per-tool export too; this page backs up everything at once, and can also read the journal's older log export. paired with the essay a record you can hold.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "The Toolkit",
    href: "/tools",
    snippet:
      "Which tool for the moment you're in? A front door to the working instruments, organized by what your decision feels like rather than what the tool is called — a close call to settle now, a big commitment to weigh, a past decision to come back and grade.",
    meta: "Find the right instrument by the moment",
    titleText:
      "tools toolkit which tool front door index hub router find the right tool what should i use decide help facing a decision now instruments".toLowerCase(),
    bodyText:
      "the toolkit (/tools): the front door to the working instruments, organized by the moment you're in rather than by what each tool is called. the site grew an instrument at a time — the flip point, the consequence trace, the cooling-off tool, the pre-mortem, the decision journal, the return desk, the trainers — each built for a different shape of moment, but a person facing a real decision doesn't arrive knowing which of six tools fits; they arrive knowing what their moment feels like. every other index is browse-by-thing (models is browse-by-concept, writing is browse-by-essay, the playbook routes by moment but to ideas); this is the missing one, browse-by-moment routing to the instrument. three groups. facing a decision right now, where the value lands in this one sitting: the flip point for a close either/or where you keep arguing the exact odds, and then what for a move that looks good now but may reverse later, cool the call for a decision being made hot. about to commit to something that matters, where the tool sets up a return you make later: the pre-mortem for a big hard-to-undo commitment, the decision journal for a call worth recording how you thought. coming back or sharpening the blade: the return desk that gathers every scheduled review and tripwire check, and practice, the trainers for the numbers under a forecast. each row leads with the moment, hands you the instrument and the one thing it does there, and the question it answers. everything you enter stays in your browser and is sent nowhere. companion to the playbook, which routes the same way but to the mental models — the ideas to think with, where these are the instruments to think through. the two now cross-link at the moment: where a playbook situation has a purpose-built instrument, the playbook hands it to you right there (a one-way door hands you the pre-mortem, a hot-state call hands you cool the call, a stuck system or a metric you're designing hands you and-then-what, judging a past call hands you the decision journal), and each tool here names the moment it was built for, linking back into the playbook — the idea and the tool that does it, one click apart.".toLowerCase(),
  },
];

function search(query: string): SearchDoc[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  return docs
    .map((doc) => {
      let score = 0;
      for (const term of terms) {
        if (doc.titleText.includes(term)) score += 3;
        else if (doc.bodyText.includes(term)) score += 1;
        else return null;
      }
      return { doc, score };
    })
    .filter((r): r is { doc: SearchDoc; score: number } => r !== null)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.doc);
}

const typeStyles: Record<SearchDoc["type"], string> = {
  Essay: "text-[var(--accent)] border-[var(--accent)]",
  Note: "text-[var(--accent)] border-[var(--border)]",
  Model: "text-[var(--muted)] border-[var(--muted)]",
  Book: "text-[var(--muted)] border-[var(--border)]",
  Playbook: "text-[var(--accent)] border-[var(--accent)]",
  Tool: "text-[var(--accent)] border-[var(--accent)]",
};

export default function SearchClient() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => search(query), [query]);
  const showResults = query.trim().length > 0;

  return (
    <>
      <input
        type="search"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Try “compounding”, “feedback loops”, “Kahneman”…"
        aria-label="Search the site"
        className="w-full px-4 py-3 text-base rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
      />

      {showResults && (
        <p className="mt-6 text-xs text-[var(--muted)]">
          {results.length === 0
            ? "No results. Try a broader term."
            : `${results.length} result${results.length === 1 ? "" : "s"}`}
        </p>
      )}

      <div className="mt-6 space-y-8">
        {results.map((doc) => (
          <Link key={`${doc.type}-${doc.href}-${doc.title}`} href={doc.href} className="group block">
            <div className="flex items-center gap-3 mb-1.5">
              <span
                className={`text-[10px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded border ${typeStyles[doc.type]}`}
              >
                {doc.type}
              </span>
              <span className="text-xs text-[var(--muted)]">{doc.meta}</span>
            </div>
            <h2 className="text-base font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug">
              {doc.title}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)] leading-relaxed line-clamp-2">
              {doc.snippet}
            </p>
          </Link>
        ))}
      </div>

      {!showResults && (
        <p className="mt-6 text-sm text-[var(--muted)] leading-relaxed">
          The index covers {posts.length} essays, {notes.length} reading notes,{" "}
          {models.length} mental models, {situations.length} playbook situations,
          the decision journal, the practice hub and its calibration, estimation,
          and base-rate trainers, and {books.length} books.
          Results link straight to the essay, the note, the model&rsquo;s entry on
          the reference page, the playbook, the journal, a trainer, or the
          bookshelf. Tip: press{" "}
          <kbd className="px-1.5 py-0.5 text-xs rounded border border-[var(--border)] bg-[var(--card)]">
            /
          </kbd>{" "}
          anywhere on the site to jump here.
        </p>
      )}
    </>
  );
}
