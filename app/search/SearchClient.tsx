"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { posts, formatDate } from "../data/posts";
import { models } from "../data/models";
import { books } from "../data/books";
import { notes } from "../data/notes";
import { situations } from "../data/situations";
import { toolCountWord } from "../data/tools";

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
    title: "Where do I start? — the guided front door",
    href: "/find",
    snippet:
      `Facing a decision and not sure which tool it needs? Answer a question or two about the shape of it — where you are with it, what's making it hard — and the toolkit hands you the one instrument for the moment you're in, with your decision carried in and the honest next step named. Not ${toolCountWord} doors to choose between; the one you need.`,
    meta: "Guided front door — answer a question or two",
    titleText:
      "where do i start find guide guided front door which tool triage router help me decide not sure how to choose pick the right tool i don't know where to begin quiz wizard decision intake stuck can't decide what should i use".toLowerCase(),
    bodyText:
      "the guided front door to the toolkit. the tools page organizes the toolkit's instruments by the moment you're in, but organizing is not choosing, and when you're actually in front of a hard, loaded decision, reading a dozen-plus when-you're-here paragraphs to self-diagnose is exactly the friction that leaves a good tool unused. this asks instead. where are you with the decision — do you have to make the call, have you made it and need to act on it or protect it, did it already happen, or is there nothing in front of you and you just want to get sharper. then, if you're making the call, what's making it hard: you might be over-thinking something you could undo (which door is this), you're deciding while hot (cool the call), two options and you keep re-arguing the odds (the flip point), several options and one keeps pulling ahead (the halo comes off), it looks good now but the bill comes later (and then what), you're about to promise a timeline or budget (you are not the exception), you've sunk years or money in and can't tell if to walk away (would you start it today), or it's big and hard to undo and you want to stress-test it (the pre-mortem). one or two questions and it hands you the single instrument, names the question it answers, and — because real calls are rarely one tool — names the natural next step after it, the itinerary the example walkthroughs show for one decision but you could never get for your own. the decision you type rides the handoff so the tool opens pre-filled, the same through-line the tools use between each other. nothing is saved and nothing is sent anywhere.".toLowerCase(),
  },
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
    title: "Set a tripwire",
    href: "/tripwire",
    snippet:
      "A tripwire is a state and a date, decided while you're calm, that mean stop and reconsider — an observable signal you can't argue with, and a real day you're obligated to look. Arm one here, or hand one over from any tool, and it comes back to you on its day at the return desk. Add it to your real calendar too.",
    meta: "Tripwire — arm one from anywhere",
    titleText:
      "tripwire tripwires set arm kill criteria reconsider re-decide stop signal state and a date van halen brown m&ms everest turnaround heath decisive annie duke fuel light threshold calendar reminder ics return desk review reconsider line standalone".toLowerCase(),
    bodyText:
      "the standalone tripwire tool. a tripwire is chip and dan heath's device and annie duke's kill criteria: a cheap, observable signal chosen in advance that means stop and reconsider — the fuel light that interrupts you at a threshold you set while calm, so you don't have to monitor the gauge or trust the moment's judgement. the recipe is a state and a date: not 'if it isn't working we'll rethink' — 'working' renegotiates itself in the moment and that clause has never fired — but 'if we're under 100 paying users on march 1, we stop.' the state must be observable enough that you can't argue with it; the date must be a real day you're obligated to look, which means it belongs in a calendar, not a memory. the pre-mortem room grows tripwires out of a full failure analysis, but nearly every tool on the site ends by finding one and had nowhere to put it: the make-it-happen tool computes a perfect reconsider line (a state and a date) and could only tell you to re-type it; the consequence trace turns up the later cost that will sour the win; the quit-or-stay tool makes you set a kill criterion for anything you keep going on. this is where all of those land. arm one here or arrive pre-filled from another tool, and it's held for you and handed back on its day at the return desk beside your journal reviews and pre-mortem checks — the one place you look — and every check ends in a recorded answer: fired (stop and reconsider) or all clear, the way aviation checklists demand the actual status spoken back, never a bare 'checked', because a reminder you swipe away is an acknowledgement, not a check. drop the check into your real calendar as an ics reminder if you want a second net. the cautionary tale is the 1996 everest disaster: the turnaround time was a textbook tripwire, and the man who set it crossed his own line under summit fever and died, while the clients who turned around on schedule survived — the person crossing a tripwire is never the person who set it, so build it to outrank your future self. structurally it's an implementation intention pointed at reconsidering rather than doing. nothing is sent anywhere; it lives in your browser. paired with the tripwires and implementation intentions models and the essays hold the funeral first and the plan was never tried.".toLowerCase(),
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
    title: "Which door is this?",
    href: "/doors",
    snippet:
      "Before you agonize over a decision, ask the question that comes first: can you undo it? Jeff Bezos's one-way / two-way door test, as a tool — spend slow, careful deliberation only where reversal won't save you, and give a fast, reversible call the permission to move it's usually denied.",
    meta: "Reversibility triage — one-way or two-way door",
    titleText:
      "doors which door reversibility reversible irreversible one-way two-way door bezos type 1 type 2 amazon decision speed how much thought deliberation triage undo undoable can i undo it over-thinking agonizing decide fast decide slow permission to move meta-decision tool".toLowerCase(),
    bodyText:
      "which door is this? (/doors): the reversibility triage that belongs before every other tool on the site. every instrument here — the flip point, the pre-mortem, the decision journal — assumes you've already decided a decision is worth thinking hard about; this one answers the question that comes first and almost nobody asks: does this choice even deserve it? the frame is jeff bezos's type 1 / type 2 (the amazon shareholder letter, 2015), which the decision literature calls reversibility. a one-way door — you can't come back through — earns slow, careful deliberation, because reversal won't bail out a wrong call. a two-way door — you can walk right back — should be decided fast, because there the expensive thing isn't a wrong call, it's a slow one: every day of deliberation is a real cost you're paying for certainty you don't need, and the mistake, if you make it, is cheap and undoable. the error runs almost entirely one direction — we treat two-way doors like one-way doors, agonizing for weeks over things we could simply undo, slowing ourselves down exactly where speed is free — so the tool is built to give a fast, reversible call the one thing it's usually denied: permission to move. three questions do the triage: if you're wrong, can you undo it (easily, at a cost, or not at all — the axis that does the most work); how bad is the worst realistic outcome (a shrug, real-but-recoverable, or ruin you can't come back from); and will doing it teach you something thinking can't — the quiet reason two-way doors should be fast, because sometimes the cheapest way to get the information is to act and watch (bezos: you learn more by moving). it plots the call on a deliberation spectrum and names the door. two-way: decide fast, put a short deadline on it, and if you're genuinely torn between two you'd both survive, a coin flip is honest — the flash of relief when it lands tells you which you wanted. one-and-a-half-way (undoable but costly): buy down the cheap uncertainty first — the one fact that would most change your mind, a smaller reversible first slice — then move. one-way: this earns the slowness, so it hands you the pre-mortem to write the failure before you commit, the decision journal to log and grade the call, and the outside view if it turns on how long or how much. one override: an unrecoverable downside (ruin) forces a one-way verdict regardless of nominal reversibility — you can't undo ruin — and surfaces the margin-of-safety warning (don't bet what you can't afford to lose), the same guard the flip point uses; if you call something both easily undoable and unrecoverable, it catches the contradiction and trusts the stakes. reversibility is also the gate for the hot state, so a call being decided while hot is handed to the cooling-off tool — on a two-way door waiting is nearly free, and a one-way door is the one you never walk through while your pulse is up. nothing is sent anywhere and there's nothing to log — a triage isn't a forecast — only a handoff to the right next tool for the door you turn out to be facing. includes a read-only worked example: the everyday two-way door a team treats like a one-way one. pairs with the reversibility model, the cooling-off tool, and the essays on decision quality and the option to wait.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "What else could you do?",
    href: "/widen",
    snippet:
      "Weighing whether or not to do one thing — take the job, make the move, yes or no? That's the most common decision mistake: a narrow frame that throws away every option nobody named. Force it open with the vanishing-options test and three more lenses, guard against decoy options, then hand the real slate to be compared or weighed.",
    meta: "Widen the frame — the narrow-framing fix",
    titleText:
      "widen widen the frame narrow framing whether or not yes no should i one option only option vanishing options test decisive chip dan heath paul nutt more options multitracking opportunity cost and not or find someone who solved it decoy option sham strawman option generation front of the funnel first mistake is the question generate options alternatives tool".toLowerCase(),
    bodyText:
      "what else could you do? (/widen): the instrument at the front of the funnel, the one that acts before every other tool. every other instrument on the site evaluates options you already have — sorts them by reversibility, finds the flip point between two, scores several past the halo — but not one of them helps you generate the options in the first place, and that is where most decisions actually go wrong. chip and dan heath, in decisive, name it the first villain of decision-making: narrow framing, treating a choice as whether or not to do x when the real choice is x, or y, or z, or some combination nobody wrote down. paul nutt's research is the receipt — decisions that considered only one option failed far more often than ones that weighed even two; teenagers frame about two-thirds of their calls as whether or not, and organizations weigh a second alternative only about a third of the time. the danger is that narrow framing doesn't feel like a mistake, it feels like focus: the diligence is real, it's just spent inside a box you didn't notice you were standing in, and diligence inside a bad boundary only makes you surer of a choice you never opened up. there's a tell, almost grammatical: whether, or not, a bare should i — anything with exactly two sides, this-or-nothing. the tool catches the tell, then does the one move that's most of the value — refuse to decide between one thing and nothing — with four generators: the vanishing-options test (suppose your option were off the table, gone; what would you do instead — people who swear they have one choice can answer instantly, which proves the others were there all along), opportunity cost (or not is never nothing; it's whatever you'd do with the same time and money), and-not-or (a smaller both-at-once, pilot, or try-it-first version that beats the all-or-nothing leap), and someone-already-solved-it (another person's path is a cheaper teacher than your own future regret). it guards against the decoy option — the strawman people plant to make the choice they already wanted look obvious by standing next to something no one would pick — and sets those aside so they don't count. the read counts the real options: still one and you're in a whether-or-not, the frame most likely to fail (or, rarely, a genuine single path, which gets a different test — reversibility, a pre-mortem, a consequence trace); two and it's a real two-way call handed to the flip point with both options carried over; three or more and the whole slate rides to the halo-off comparison, pre-filled, to be scored a factor at a time. it keeps the honest other half too: past a handful, more options mostly produce stall, not better calls, and endless widening is its own way of never deciding — the failure to beat is the frame with one option in it, and going from one to two or three is where almost all the value lives. nothing is sent anywhere; inputs persist in your browser, and there's no forecast to log — widening isn't a prediction — only the handoff to the next tool. pairs with the essay the first mistake is the question, and feeds the halo comes off and the flip point.".toLowerCase(),
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
    title: "You are not the exception",
    href: "/outside",
    snippet:
      "About to promise how long something will take or how much it'll cost? Your plan is a best-case story; the reference class already counted the surprises. Seal your own estimate, then set it against what actually happened to comparable cases, and read the gap. Reference-class forecasting, as a tool.",
    meta: "The outside view — reference-class forecasting",
    titleText:
      "outside view outside-view reference class reference-class forecasting planning fallacy tool estimate deadline schedule budget how long how much cost time overrun over budget inside view kahneman lovallo flyvbjerg megaproject base case base rate optimism bias inside-view premium seal anchor distribution median class of one".toLowerCase(),
    bodyText:
      "you are not the exception, a reference-class forecasting tool for the planning fallacy. the site had an instrument for every shape of decision except the one its own reference calls the most dangerous to get wrong from the inside. how long will it take, how much will it cost — the questions we answer from the plan in front of us, and a plan is a story about the best case, so the surprises that actually sink it are precisely the things not in the story. the measured gap is the planning fallacy: students who said 34 days took 55, nine in ten megaprojects run over budget, newlyweds who recite the divorce rate put their own odds at zero. kahneman and lovallo's fix is the outside view — ask what happened, on average, to everyone who attempted this class of thing, and start the forecast there, because that distribution has already counted every surprise the plan can't see. the mechanical form is reference-class forecasting (flyvbjerg's practice on real megaprojects): pick the class your case belongs to, take its actual outcome distribution as your starting point, then let the particulars argue for a modest, evidence-backed adjustment. the tool runs it as a procedure. one structural move it insists on: it takes your own estimate first and seals it, before you look at a single comparison — otherwise the cases you pick anchor your number and the gap disappears. then you build the class from cases that actually happened (not more guesses), and it reads the distribution — lowest, middle, highest — and names where your sealed plan lands: below the whole class, below the middle, near it, or above. the genuinely hard part is choosing the class, so it holds the discipline in front of you: start broad and narrow only as far as a measured difference takes you (never with adjectives), reject folklore rates you can't source, and remember a class of one is not a class (it refuses to compute under three cases). two guards: a spread guard, because a class that runs more than 3x can't honestly promise a point — the honest output is a range; and a re-import guard, because if you adjust back to your first optimistic instinct without a measured reason you've quietly slid back inside the plan, and knowing about the inside view doesn't protect you from it. the output that matters isn't the winning number, it's the gap between what your plan says and what the class actually did. nothing is sent anywhere; inputs persist in your browser, and a forecast you commit to logs to the decision journal so reality grades it on the day. pairs with the outside view and base rates models, the essay nobody thinks they're the base rate, the base-rate trainer's pick-the-prior mode, and — once you have a number — the pre-mortem and the decision journal.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Could you be wrong?",
    href: "/test",
    snippet:
      "Fairly sure it's the right call? That's the exact state that stops you looking — you've been gathering reasons it'll work, not reasons it won't. Name the one assumption it rests on, force out what would prove it false, and check whether you've sought that or only its opposite. Then, where you can, run the cheapest real test instead of trusting the prediction.",
    meta: "Reality-testing — the confirmation-bias fix",
    titleText:
      "test reality-test reality testing could you be wrong confirmation bias disconfirming evidence disconfirm consider the opposite falsifiable what would change your mind assumption pressure-test stress-test pre-commit ooch run a small experiment small bet pilot minimum viable test prove myself wrong seeking disconfirmation devil's advocate wrap decisive heath brothers tool".toLowerCase(),
    bodyText:
      "could you be wrong? (/test): a reality-testing tool, the antidote to the most pervasive decision bias there is — confirmation bias. it's the r in the heath brothers' wrap process (widen, reality-test, attain distance, prepare to be wrong), and the one move the rest of the toolkit didn't have. once you're leaning toward a call you stop gathering evidence and start gathering ammunition: you notice what supports the choice and wave off what doesn't, so doing your research quietly becomes building the case for what you already wanted. the bias is invisible from the inside because it feels exactly like diligence. the tool runs two moves against it. first, consider the opposite: name the single load-bearing assumption the whole decision rests on — the thing that, if false, sinks it — then state what observable evidence would prove it false, and check honestly whether you've gone looking for that evidence or only for its opposite. a belief nothing could falsify isn't a conviction, it's a closed loop; being able to say what would change your mind is the difference, and it flags the case where you can't name anything that would. considering the opposite is one of the most robust debiasing techniques in the literature precisely because it forces the disconfirming search your instincts skip. second, ooch — don't predict, test: where the stakes and reversibility allow, run the smallest real experiment that generates actual evidence before you commit fully. four lenses help design it: the small bet (the smallest reversible slice you could try first), the disconfirming search (where you'd go to find evidence you're wrong, and whether you'd accept it), ask someone who tried it (what surprised them), and pre-commit (write down in advance what result would change course, so you can't rationalise it away after). a retailer unsure of a new line puts it in five stores, not a forecast; a founder unsure people will pay puts up a pre-order page before building. the read grades the state: a belief with nothing that could falsify it is the confirmation trap in its purest form; a named test you haven't run means go run it; a test survived means the belief is grounded now, not just assumed, and hands you on to make it happen or to stress the rest with a pre-mortem; a designed ooch hands to the decision journal to log what you expect and the day to check the result. the caveat runs both ways: a small test is only honest if you decide in advance what result changes course and then accept it, and ooching fits reversible probes better than one-way doors. its near neighbour is the pre-mortem, which imagines the failure from the inside; reality-testing goes and gathers the evidence from the outside. nothing is sent anywhere; inputs persist in your browser. pairs with the reality-testing and narrow-framing models and the wrap process, feeds the decision journal and the make-it-happen plan.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Who gains if you say yes?",
    href: "/incentives",
    snippet:
      "Someone's recommending, selling, or urging you toward a choice — and they gain from your yes. Run Munger's 'show me the incentive' on the advice: name what the messenger gets, find out whose side the incentive is on, and where it pulls against you, get the same recommendation from someone paid differently instead of just distrusting everyone.",
    meta: "Incentive structures — follow the incentive on advice you're handed",
    titleText:
      "incentives incentive structures who gains who benefits follow the money conflict of interest whose interest cui bono show me the incentive munger charlie munger biased advice sales pitch salesperson commission kickback fee-only fiduciary financial adviser advisor estate agent realtor recruiter contractor upsell should i trust this recommendation is this advice biased whose side are they on skin in the game aligned incentives motivated reasoning trust but verify second opinion tool".toLowerCase(),
    bodyText:
      "who gains if you say yes? (/incentives): the instrument that runs charlie munger's 'show me the incentive and i'll show you the outcome' on a recommendation you've been handed. it's the sibling of could-you-be-wrong (/test) one surface over: /test interrogates your own reasoning for what would prove it wrong; this one interrogates the reasoning you were given — by an adviser, an agent, a salesperson, a boss, a friend with a stake — for how much of it is the advice and how much is the incentive. neither is about the odds or the options; both are about the reliability of an input before you weigh it. the core distinction is alignment versus divergence. when the messenger wins only when you win (paid on your outcome, skin in the same game, a real fiduciary), their incentive is on your side and the recommendation can be weighed on its merits — the reflex to discount it just throws away good counsel. when they win whether or not you do (a commission, a quota, a fee on the transaction, keeping you as a customer), the advice is worth exactly what it would be worth from someone who didn't get paid for your yes — so you discount it to its incentive-free core; not because they're lying, but because when the reward is for the recommendation rather than your result, the recommendation bends toward the reward, usually with no one deciding to be dishonest. the point is never to distrust everyone — that's as lazy as trusting everyone and throws away good advice with the bad — it's to find out whose side the incentive is on and act on it. the tool runs it with no cynicism. name what you're being urged toward. name the messenger and, concretely, what they gain from your yes — not just money but a quota met, a client kept, status, an awkward conversation avoided — because an incentive you can't see is one you can't subtract. the alignment gate: when your interests and theirs pull apart, whose side is the recommendation on — aligned, diverged, partly, or can't-tell. then the tell: picture the exact moment your best move would cost them; do you expect them to steer you right at their own expense, push their own way, or you've never seen them at that fork — which modulates each read (a diverged structure with a person who'd still steer you right is a trustworthy person inside a bad structure; a claimed alignment whose person would push their way is alignment that isn't structural). four reads. aligned: the incentive's on your side, so weigh it on the merits — confirm the alignment is structural not just a slogan ('we put clients first' is a slogan; 'we're paid only when you profit' is a structure), then go to the flip point (/weigh) and still stress your own case (/test). diverged: discount to the incentive-free core, but don't distrust — disarm the incentive: get a second opinion from someone paid differently (a fee-only version, a friend with no stake), change the structure so their pay tracks your outcome (flat fee, paid-on-results, fiduciary in writing), ask for the option they don't get paid for (the index fund, the repair over the replacement) and watch the reaction, and subtract the messenger — would you want this if a stranger with nothing to gain had described it plainly; routes to widen (the options an incentivized messenger never names) and test. partly: aligned on the whole, diverged on a seam — the agent wants the sale but also fast and cheap, the doctor wants you well but the procedure pays — so name the one axis where you split (price, timing, size, product) and put all your scrutiny there, trusting the shared direction; routes to trace and widen. can't tell: find out how they're paid first, because that one fact reorders everything — ask plainly 'how do you get paid on this, do you make more if i choose one way?' and listen to how they answer, since vagueness or offence where a plain number should be is itself the answer. includes a read-only worked example: the adviser recommending a commission-paying actively-managed fund, where the move isn't to fire them but to ask for the fee-only version and compare against the low-cost index fund they earn nothing on — subtract the incentive, then decide. nothing is sent anywhere; inputs persist in your browser; there's no forecast to log — a check on a source isn't a prediction — only the handoff. pairs with the incentive-structures model.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Where do you actually disagree?",
    href: "/crux",
    snippet:
      "You and someone you have to decide with — a partner, a cofounder, family — are stuck, and you can't tell if you're fighting about the facts, about what you each want, or about how much risk is okay. Sort the disagreement into its real root: evidence settles a fact, a fair procedure settles a values split, a survival check settles a risk gap. Then find the crux — the one thing that, if it went the other way, would change a mind.",
    meta: "The crux — untangle a stuck joint disagreement",
    titleText:
      "crux disagree disagreement conflict argument stuck deadlock impasse can't agree we disagree we can't agree settle an argument settle a disagreement resolve a disagreement how to resolve a disagreement joint decision shared decision deciding together decide together making a decision with someone partner spouse husband wife marriage cofounder co-founder business partner family sibling colleague team we want different things whose call is it double crux find the crux fact vs value values clash values difference risk tolerance steelman perspective taking going in circles same fight tool".toLowerCase(),
    bodyText:
      "where do you actually disagree? (/crux): the instrument for a shared decision two people can't agree on. almost the entire kit is for a decision you make alone — it checks your options, your odds, your confidence, your framing, the incentives of whoever is advising you. but some of the hardest calls are joint: a partner, a cofounder, family, a colleague, and you're deadlocked, you've argued it in circles, and you're no closer. nothing else in the toolkit met that shape, and it's one of the most common hard-decision shapes there is. the core idea is a taxonomy, not a mood-fix: a genuine disagreement between two reasonable people almost always traces to one of three roots, and each has a different resolution. facts — you'd agree on what to do if you agreed on what's true or what will happen; evidence settles it, not more arguing, so find the crux (the fact that, if it went the other way, would change a mind) and go get it — the cheapest real test, a source you both trust — or bet on it, since a concrete wager forces each of you to put a real probability on your claim and someone who won't bet didn't believe it as hard as the argument sounded; and before spending days resolving it, check whether it even changes the call (value of information). values — you want different things, or weight them differently; no fact will ever settle it, so arguing facts is the trap that wastes the most time because it wears the costume of a factual argument. name it as a values split and you can stop trying to win and start trying to decide; it needs a legitimate procedure you both accept in advance because it's fair: whose call is it (let the person who bears the cost or lives with it most decide this one, and trade — they take this, you take the next), make the weights explicit (score the options and you'll usually find you agree on every factor but one weight), or find the third option (a two-way deadlock is a narrowed frame; widen it to the choice that gives each of you what you actually care about). risk — you agree on the facts and the goals; you just draw the line on acceptable downside in different places, so one sees an opportunity and the other a risk looking at the same thing, and it curdles into character (reckless vs coward) because it isn't about any checkable fact. the move isn't to split the odds you already agree on — it's to look at the worst case together and ask if you'd both survive it: if survivable, the cautious one can let it run (cap the downside and go); if not, the cautious one is right that no upside justifies ruin (find the version of the same move whose worst case you'd both survive); and settle reversibility first, because a risk fight is often a hidden disagreement about whether it's a one-way door. when it's tangled — the usual case — the single most useful act is to separate the strands before arguing another round, because a stuck disagreement is usually three knotted together and every move lands on a different one, which is why it goes in circles: write down which part is a fact (gets tested), which is a value (gets a procedure), which is about risk (gets a survival check). the tool runs it as a private worksheet: you fill in your side and your honest account of theirs — perspective-taking as an instrument, stating the other side in a form they'd accept, which is itself the move most stuck arguments skip. the diagnostic gate sorts the disagreement (facts / values / risk / can't-tell), then the double-crux tell asks whether each of you can name what would change your mind (both / only me / neither) — if both can it's a real crux, if only you can then their fact claim is standing in for a value or a fear, if neither can it was never a facts fight whatever it felt like. four reads, each routing out to the tool that finishes that branch: facts to enough (is the fact worth resolving) and test (design the cheapest test); values to compare (make the weights explicit) and widen (find the option that serves both); risk to ruin (survival check together) and doors (settle reversibility); can't-tell back through the sorter, and to cool (if it's too hot to sort) and advise (if you can't see your own side straight). includes a read-only worked example: the couple weighing a move for one partner's job, where one circular argument turns out to be three — is the job market really better there (a fact, so check it), career growth vs being near family (a value, so it needs a procedure), and can we always move back (a reversibility read) — three tractable questions instead of one circular fight. it draws on the double-crux technique and the fact/value/risk distinction. nothing is sent anywhere; inputs persist in your browser; there's no forecast to log — sorting a disagreement isn't a prediction — only the handoff.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Who gets which room?",
    href: "/split",
    snippet:
      "Housemates, rooms that aren't equal, one rent. Each of you prices every room privately; the rooms go to the right people and the rents are set so nobody would rather swap.",
    meta: "Room and rent — split the rent fairly between housemates",
    titleText:
      "who gets which room room and rent split the rent splitting rent rent split rent calculator fair rent fair share divide rent dividing rent housemates roommates flatmates flatshare house share shared house moving in together bigger room en suite ensuite master bedroom box room smallest room who pays more room prices fair division envy-free envy free rental harmony spliddit su sperner's lemma".toLowerCase(),
    bodyText:
      "who gets which room? (/split): the instrument for housemates splitting the rent on rooms that aren't equal — one has its own bathroom, one is the box room over the stairs. an equal split is only fair if everyone wants a different room; a split by floor area prices size and nothing else; haggling hands the answer to whoever speaks first or minds least. the tool runs the fair-division method instead. you give the rent, how many of you (two to six), names and rooms. then one phone goes round: each person, privately, prices every room so they wouldn't mind which one they got, with their prices adding up to the whole rent, and locks it in; locked prices stay hidden until everyone is done. only the gaps between one person's prices matter, so a row that doesn't add up is evened out. the rooms go to the assignment that makes the most of everyone's numbers taken together, and the rents are set so nobody would rather have anyone else's room at its price (envy-free), by the widest margin the numbers allow, with what's left shared equally. it says how close the nearest swap came, flags a tie where two of you could trade and be just as happy, says whether an equal split would have worked, and gives you the split to send the house. draws on francis su's rental harmony (american mathematical monthly, 1999), spliddit (goldman and procaccia, 2014), gal, mash, procaccia and zick on the fairest envy-free split (2016), and peters, procaccia and zhu's robust rent division (2022). if someone won't accept it, hands off to the disagreement tool. includes a read-only worked example: three friends and a £2,400 flat with an en suite, a front room and a box room. nothing is sent anywhere; inputs persist in your browser. pairs with the envy-free division model and the essay price the rooms, not the people.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Who pays for what?",
    href: "/bills",
    snippet:
      "Two of you share a home and one earns more: half each, in proportion to pay, or pool it all. See what each leaves you, how much the choice is worth, and choose together.",
    meta: "Bills — split shared costs on unequal pay",
    titleText:
      "who pays for what bills split the bills splitting bills household bills shared bills shared costs shared expenses joint account joint finances combine finances pool money pooling separate accounts yours mine ours 50/50 fifty fifty half each split evenly proportional split in proportion to income proportional to pay fair share earns more earns less pay gap income gap couple partner spouse moving in together rent mortgage council tax groceries who pays the rent money in a relationship".toLowerCase(),
    bodyText:
      "who pays for what? (/bills): the instrument for two people sharing a home on unequal pay. the bills were split in half the week you moved in and never looked at again. there are three common rules and each is fair by a different principle: half each (equality of what goes in), in proportion to pay (the same share of what you earn, the ability-to-pay principle), and pool it (the same left over each). deutsch (1975) named equality, equity and need; clark and mills (1979) distinguished exchange from communal relationships. you give both take-home pays a month and the shared costs, with tap-to-add chips (rent or mortgage, energy, council tax, groceries, childcare), and optionally what each pays now. it shows what each of you pays, what share of your pay that is and what you each have left under each rule, says how much the choice is worth (between half each and pooling it is always half the difference in pay), tests each rule against one pay stopping (parental leave, a lost job), says which rule you are on now, and when the pay gap is bigger than the bills shows the top-up that leaves you level. yougov (2024): 48% think bills should follow pay, 37% 50-50, but working couples more often split 50-50. gladstone, garbinsky and mogilner (2022) found couples who pool are more satisfied. vogler and pahl (1994): keep money of your own, run the pool jointly. choose a rule together and it gives you a line with the amounts in it; copy all three to send each other. includes a worked example: jordan and robin, where robin went part-time to retrain and half each took 55% of robin's pay. nothing is sent anywhere. pairs with the equality, equity and need model and the essay three fair ways to split the bills.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Who does which chore?",
    href: "/chores",
    snippet:
      "Housemates, a couple, a family: list the chores, including the remembering, rate how much each of you minds each one, and get a split where nobody does more than their share as they count it.",
    meta: "Chores — divide the housework fairly",
    titleText:
      "who does which chore chores chore chart chore rota rota cleaning rota housework household chores divide chores dividing housework split chores sharing chores fair share of housework division of labour division of labor household labour mental load invisible work cognitive labour emotional labour housemates flatmates roommates couple partner spouse marriage family teenagers kids cleaning cooking washing up dishes laundry hoovering vacuuming bathroom bins food shop meal planning who does more i do everything nag nagging take turns".toLowerCase(),
    bodyText:
      "who does which chore? (/chores): the instrument for dividing housework on purpose instead of by drift — housemates, a couple, a family with teenagers. in most homes the chores were never divided; they settled on whoever noticed first or minded the mess most, and everyone is quietly sure they do more than their share. ross and sicoly (1979) found people in joint work, married couples included, take more credit than their partners give them, because their own contributions come to mind more easily (egocentric bias, overclaiming). daminger (2019) found the cognitive side of housework — anticipating, identifying options, deciding, monitoring — goes unseen. so the tool starts with one list instead of two memories, with tap-to-add chips for the usual chores and the remembering (meal planning, noticing what's run out, bills and admin, birthdays and presents, booking repairs). each chore gets a rough time a week, agreed out loud, and each person rates how much they mind it: happy to, fine, rather not, hate it. a person's share is each chore's time weighted by how much they mind it, over the same for all chores, so marking everything hate it changes nothing — only how you rank the chores counts. the split gives every chore one owner so the largest share is as small as it can be (the whole-chore version of spliddit's equitable chores method), with take-turns for the chore everyone hates. when you mind different things, each of you ends up under an even share. shows who does what now against after by the clock, checks whether anyone would rather swap lists (envy-free), and when whole chores can't split evenly names the one chore to take turns on. ends in a line to keep: every chore has one owner who notices when it's due; helping isn't owning; look again in a month. copy the split to send the house. includes a worked example: alex and sam, where alex did 82% of the time and each ends up under a third as they count it. nothing is sent anywhere. pairs with the envy-free division and egocentric bias models.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Lend it, give it, or say no?",
    href: "/lend",
    snippet:
      "A friend or relative has asked to borrow money, or to co-sign. Find the most you could give and never think about again, and get the words to say.",
    meta: "Lend money — should I lend money to a friend or family?",
    titleText:
      "lend it give it or say no lend money lending money borrow money borrowing loan to a friend loan to family lend to a friend lend to family should i lend money friend asking for money family asking for money brother sister parents cousin asked to borrow pay me back paid back never paid back owe me money iou loan agreement repayment plan co-sign cosign co-signer cosigner guarantor guarantee a loan how to say no to lending money gift or loan".toLowerCase(),
    bodyText:
      "lend it, give it, or say no? (/lend): the instrument for a friend or relative asking to borrow money, or to co-sign a loan. a loan between friends puts an exchange rule inside a communal relationship (clark and mills, jpsp 1979): close relationships give on need and don't keep score, and a debt brings the score in. in bankrate's 2019 us survey, 37% of people who lent cash to friends or family lost money and 21% said the relationship suffered. co-signing isn't lending: the ftc's cosigner notice warns you may have to pay up to the full amount if the borrower does not. you give how much they've asked for, whether it's a loan or a co-sign, and what losing it would do to you (fine, it would hurt, i'd need it back), with the most you could give and never think about again. optionally what it's for (a one-off emergency, a gap until money comes in, money short every month, to start something), their record (first time, repaid on time, late or in part, never), and whether you'd still be close if it never came back. within what you could lose: give it, and say it's a gift. more than that but some to spare: offer the smaller amount as a gift. you'd need it back, or it never came back last time: say no to the loan and help another way. short every month: a loan won't close the gap. otherwise a loan in writing with dates: what they'll pay a month gives every repayment date, a message with the terms, and a calendar file (.ics) of the repayments. ends in the words to send, a line to keep, and hands off to survive the worst case, advise a friend and make a rule. includes a read-only worked example: a brother asking for £800 for the car, and a £300 gift instead. nothing is sent anywhere; inputs persist in your browser. pairs with the communal and exchange relationships model and the essay lend only what you could give.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Get your money back",
    href: "/refund",
    snippet:
      "It broke, it never came, or the job was done badly. What the law gives you, the message to send with a date, and the next step if they say no.",
    meta: "Get money back — refund, repair, replacement or chargeback?",
    titleText:
      "get your money back refund get a refund faulty broken stopped working not as described wrong item never arrived parcel not delivered missing parcel lost parcel courier delivered but not received bad workmanship builder plumber cowboy repair service complaint complain complaint letter letter of complaint how to complain consumer rights consumer rights act 30 days right to reject repair or replace six months warranty out of warranty manufacturer's problem section 75 chargeback credit card protection debit card dispute paypal buyer protection klarna dispute ombudsman small claims court letter before action money claim return change my mind cooling off 14 days cancel online order".toLowerCase(),
    bodyText:
      "get your money back (/refund): the instrument for something you paid for that broke, never arrived, wasn't as described, or a job done badly, when the seller is fobbing you off. most unhappy customers never complain (the tarp studies: often 60 to 80 per cent), mostly because it looks like effort that won't work (huppertz); sunstein calls the friction sludge (sludge audits, behavioural public policy 2020). you give what it is, who sold it, what's wrong, where you bought it (a business online, in person, or a private seller), when it arrived or was done, the price, how you paid (credit card, debit card, paypal klarna or a marketplace, bank transfer or cash), whether they've already tried one repair, and how far you've got (not asked, waiting, refused, gone quiet). uk law: the consumer rights act 2015 gives 30 days to reject faulty goods for a full refund, then one repair or replacement, then a refund; a fault in the first six months is presumed to have been there; claims run six years (five in scotland); goods are the seller's risk until delivered (s29) so a lost parcel is the shop's problem, not the courier's; services must use reasonable care and skill, or be redone free or the price cut. the consumer contracts regulations 2013 give 14 days after delivery to cancel online orders. section 75 of the consumer credit act 1974 makes a credit card company equally liable for items from £100 to £30,000, even if only the deposit was on the card; chargeback for debit and credit cards, any amount, usually within 120 days; paypal buyer protection 180 days. the tool writes the message to the seller with a reply-by date 14 days away, the section 75, chargeback or platform claim message when they refuse or go quiet, a calendar file (.ics) for the reply date, and the ladder: seller, card or platform, ombudsman (energy, phone, broadband, banks after eight weeks), final letter and small claims (up to £10,000 in england and wales, £5,000 in scotland and northern ireland). us notes: fair credit billing act 60 days. ends in a line to keep and hands off to fix or replace, is it real, cover or carry and make a rule. includes a read-only worked example: a £449 washing machine that failed twice, refunded through section 75. nothing is sent anywhere. pairs with the sludge and implementation intentions models and the essay ask once, in writing, with a date.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Flight delayed or cancelled",
    href: "/flight",
    snippet:
      "Three hours late, cancelled at short notice, or bumped. What UK261 or EU261 owes each passenger, the claim to send, and the date the free referee opens.",
    meta: "Flight delayed or cancelled — what am I owed?",
    titleText:
      "flight delayed or cancelled flight delay compensation delayed flight cancelled flight flight cancellation compensation flight refund airline refund airline compensation uk261 eu261 ec261 261/2004 denied boarding bumped overbooked overbooking missed connection extraordinary circumstances technical fault technical issue crew shortage strike airport delay holiday flight delay how much compensation £220 £350 £520 €250 €400 €600 claim flight compensation myself claims company airhelp no win no fee aviationadr cedr caa pact deadlock letter meals hotel vouchers".toLowerCase(),
    bodyText:
      "flight delayed or cancelled (/flight): the instrument for a flight that arrived three or more hours late, was cancelled with less than two weeks' notice, or left without you because it was overbooked. uk261 (regulation 261/2004 as kept in uk law) and eu261 pay a fixed amount per passenger by distance: £220, £350 or £520 (eu €250, €400, €600) for up to 1,500 km, 1,500 to 3,500 km, and over 3,500 km; over 3,500 km and three to four hours late is half. delay is measured at the final destination when the doors open (sturgeon v condor, 2009). cancellations: no compensation with 14 days' notice, or if the new flight stayed close to the old times. covered: any flight leaving the uk or eu; flights into the uk on a uk or eu airline; into the eu on an eu airline. extraordinary circumstances excuse the cash (weather, air traffic control, strikes by others, bird strikes, security) but a technical fault is not extraordinary (jet2 v huzar 2014, van der lans v klm 2015), nor is the airline's own staff striking (krüsemann 2018, sas 2021). you give the flight, airline, what happened, the date, passengers, where it left from and went, the distance, how late, the notice and replacement times for a cancellation, the reason given, what you spent waiting, and how far you've got. the tool writes the claim with the answer to their reason in it, a pay-by date 14 days away, the date eight weeks on when the adr scheme (aviationadr, cedr) or the caa's passenger advice and complaints team can take it free, a calendar file (.ics), and the text for the adr form. lists what you were owed at the airport: meals after two, three or four hours, a hotel overnight, a refund after five hours, the choice of refund or new flight. us notes: no cash for delays; automatic refunds for cancellations since 2024. claims run six years (five in scotland). ends in a line to keep and hands off to get your money back, is it real and make a rule. includes a worked example: four passengers gatwick to faro, four hours forty late, technical issue, £1,400. nothing is sent anywhere.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "A catch-up energy bill: what do you owe?",
    href: "/catchup",
    snippet:
      "A catch-up gas or electricity bill after months of estimates or a smart meter that stopped sending. The part too old to charge under the back-billing rule, the complaint to send, the repayment plan to ask for, and the ombudsman date.",
    meta: "Catch-up energy bill — what do you actually owe?",
    titleText:
      "catch-up bill catch up bill energy bill back bill backbill back-billing back billing rule backdated energy bill shock energy bill huge gas bill huge electricity bill high energy bill estimated bill estimated readings smart meter not sending readings smart meter stopped working smart meter fault meter reading underestimated energy bill ofgem 12 months energy ombudsman energy complaint deadlock letter repayment plan energy debt payment plan gas bill dispute electricity bill dispute utility regulator 13 months consumer council".toLowerCase(),
    bodyText:
      "a catch-up energy bill: what do you owe? (/catchup): the instrument for a catch-up gas or electricity bill after a smart meter stopped sending readings or estimates ran low. in great britain ofgem's back-billing rule (standard licence condition 21ba, since 2018) stops a supplier billing a household for energy used more than 12 months before the date of the bill, unless the customer behaved obstructively or manifestly unreasonably (refused access, tampered with the meter, ignored repeated requests). in northern ireland the utility regulator's rule is 13 months where the supplier was at fault. the rule cuts by when the energy was used, so the tool splits the period at the cut-off, weighting each month by a typical seasonal pattern for gas, electricity or both. it says whether the limit applies given why the bill was late, writes the complaint naming the rule (with a request to rebill on actual readings if the bill is estimated), sizes the repayment plan to ask for (spread over as long as the shortfall built up), and gives the date the energy ombudsman opens: eight weeks after the complaint, or at once with a deadlock letter, and within 12 months after. in northern ireland the consumer council takes complaints. includes a worked example: twenty months unbilled, £1,840. nothing is sent anywhere.",
  },
  {
    type: "Tool",
    title: "An old debt, a new letter: do you still owe it?",
    href: "/collector",
    snippet:
      "A debt collector or debt buyer chasing a card, loan or bill from years ago. Whether it's past the six-year limit (five in Scotland), the letter to send, and any court deadline.",
    meta: "Old debt, new letter — is it statute-barred?",
    titleText:
      "debt collector debt collection agency debt collection letter old debt statute barred statute-barred debt limitation act six years 6 years debt five years scotland prescription prescribed debt debt purchaser debt buyer sold my debt token payment £1 a month goodwill payment acknowledge debt restart clock letter of claim letter before action pre-action protocol county court claim form money claim online ccj defence prove it letter prove the debt cca request section 78 credit agreement request don't recognise debt not my debt breathing space".toLowerCase(),
    bodyText:
      "an old debt, a new letter: do you still owe it? (/collector): the instrument for a letter from a debt collector or a company that bought the debt, about a credit card, loan, overdraft, catalogue, phone, energy or other bill from years ago. in england, wales and northern ireland (limitation act 1980 section 5; limitation (northern ireland) order 1989) a creditor has six years to take an ordinary debt to court, counted from the last payment or written acknowledgement; after that it's statute-barred and still exists but can't be enforced in court. in scotland (prescription and limitation (scotland) act 1973 section 6) it's five years, and then the debt is extinguished. a payment or signed written admission before the limit restarts the clock; a payment after doesn't revive it (section 29(7)). the fca's rules (conc 7.15) say a firm must stop demanding payment once you've said it's statute-barred. exceptions: court judgments (ccj, council tax liability order or summary warrant), most hmrc tax, student loans company loans, benefit overpayments taken from benefits, mortgage shortfalls (six years interest, twelve capital). within three months of the line is read as too close to rely on. writes the statute-barred letter, the prove-it letter (statement of account, date of default, notice of assignment, consumer credit act section 77/78 copy of the agreement with a £1 fee) or an affordable offer. dates the 30 days to reply to a letter of claim under the pre-action protocol for debt claims, and for a county court claim form the deemed service (second business day after posting), the 14 days to respond and 28 for a defence, with a calendar file (.ics) and the wording for a limitation defence. free advice: national debtline, stepchange, citizens advice, advice ni; breathing space in england and wales. includes a worked example: a store card last paid seven years ago, £1,260 or £1 a month. nothing is sent anywhere.",
  },
  {
    type: "Tool",
    title: "Parking ticket: pay or appeal?",
    href: "/parking",
    snippet:
      "A council or private parking ticket, on the windscreen or by post. What appealing costs if you lose (often nothing), the letter to send, and the date for the next step.",
    meta: "Parking ticket — pay it or appeal it?",
    titleText:
      "parking ticket parking fine parking charge notice penalty charge notice pcn appeal parking ticket appeal parking fine challenge parking ticket should i pay parking fine private parking fine car park fine anpr camera parking letter number plate photo supermarket car park retail park hospital parking parkingeye euro car parks popla ias independent appeals service bpa ipc notice to keeper notice to owner charge certificate order for recovery traffic penalty tribunal london tribunals formal representations informal challenge keeper liability protection of freedoms act schedule 4 wrong registration keying error grace period debt collector parking letter before claim county court claim ccj parking".toLowerCase(),
    bodyText:
      "parking ticket: pay or appeal? (/parking): the instrument for a parking ticket on the windscreen or a camera letter in the post. the call turns on one sum: what does appealing cost if you lose? council penalty charge notices are halved if paid within 14 days (21 for a camera ticket by post); most councils hold the discount while they consider a challenge sent inside that window and re-offer it if they reject it, so the first challenge costs nothing. after a notice to owner the discount has gone, and formal representations and the traffic penalty tribunal (london tribunals in london) are free: losing costs the same full amount. ignored, a charge certificate adds 50%, then it is registered as a debt at the traffic enforcement centre and bailiffs follow. private parking charge notices are capped at £100 and cut by 40% if paid within 14 days; appeal to the operator within 28 days (most re-offer the discount if they reject); the independent appeal (popla for bpa members, ias for ipc members) is free but usually costs the discount, so it is worth it when your chance beats extra ÷ full, 40% for £60 against £100; popla cancels about 40% of completed appeals. in england and wales a camera notice to keeper must be given within 14 days of the parking (schedule 4, protection of freedoms act 2012), or the keeper isn't liable unless the driver is named. ignored, a private charge gains a debt collector's fee of up to £70, a letter before claim (30 days to reply) and a county court claim (14 days to acknowledge). the tool writes the challenge, formal representations, tribunal statement, operator appeal, popla statement and the reply to a letter before claim, and dates the next step.",
  },
  {
    type: "Tool",
    title: "Get your deposit back",
    href: "/deposit",
    snippet:
      "You've moved out and the landlord wants a new carpet, a repaint and a clean from your deposit. Price each deduction the way an adjudicator would, the reply to send, and the last day for the free dispute.",
    meta: "Get your deposit back — which deductions are fair?",
    titleText:
      "get your deposit back tenancy deposit deposit return deposit refund rental deposit security deposit bond landlord keeping deposit landlord won't return deposit letting agent deductions deposit deductions deposit dispute dispute deposit end of tenancy moving out check out checkout inventory check-in report fair wear and tear wear and tear betterment apportionment carpet replacement repaint redecoration professional cleaning cleaning charge picture hooks tds dps mydeposits tenancy deposit scheme deposit protection service unprotected deposit deposit not protected three times deposit tenant fees act deposit cap five weeks renting renter tenant rights".toLowerCase(),
    bodyText:
      "get your deposit back (/deposit): the instrument for the list of deductions that arrives after you've moved out of a rented home. the deposit is the tenant's money held as security, and the landlord has to justify each deduction with evidence: the check-in inventory, the check-out report, photos, invoices. in england and wales a deposit must be protected in one of three government schemes (deposit protection service, tenancy deposit scheme, mydeposits) within 30 days, with the details given to the tenant; if not, a court must order it back plus one to three times the amount (housing act 2004 s213-214; up to three times under the renting homes (wales) act 2016). scotland: 30 working days, and the first-tier tribunal can award up to three times if you apply within three months of moving out. once the amount is agreed it must be repaid within ten days; anything disputed stays protected. each scheme runs a free dispute service decided on written evidence; tds and mydeposits take disputes within three months of the tenancy ending. fair wear and tear (reasonable use and the ordinary operation of natural forces) isn't chargeable, nor is betterment; a replacement is apportioned by the life the old item had left (the dps guide's example: a £500 carpet two years into a five-year life costs the tenant £300; the tds lifespan guide gives carpets 2 to 4, 5 to 8 or 8 to 15 years, decoration 3 to 5). the tenant fees act 2019 caps deposits in england at five weeks' rent (six from £50,000 a year). you enter the place, the deposit, the rent, whether it was protected, the scheme, whether there was an inventory, where it's got to, and each deduction with its amount, what it's for and your view (fair, too much, not mine); for replacements and repainting, the age and usual life. the tool prices each line, gives one number to ask back, writes the first ask, the reply to their deductions, the statement for the scheme's dispute form, the chase for an agreed amount, the letter for an unprotected deposit, or the letter before a small claim, and a calendar file (.ics) for the reply date or the last day to raise the dispute. ends in a line to keep and hands off to who gets which room, splitting the bills and make a rule. includes a read-only worked example: £1,395 of deductions on a £1,200 deposit, priced at £395. nothing is sent anywhere. pairs with the anchoring and sludge models and the essay charge for the life that was left.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Is it real? Before you pay, click or reply",
    href: "/scam",
    snippet:
      "A text, call or message wants money, a code or your details now. Judge what it asks, not how it looks, and check it on details you found yourself.",
    meta: "Is it a scam? — should I pay, click or reply?",
    titleText:
      "is it real is this a scam is it a scam scam check scam checker fraud phishing smishing vishing fake text fake call fake email suspicious message suspicious text parcel fee delivery text royal mail usps toll text bank called fraud team safe account hi mum new number whatsapp family emergency gift cards crypto bitcoin atm courier one time code otp verification code passcode remote access tech support virus warning job scam task scam investment scam romance scam refund scam irs hmrc police arrest fake invoice impersonation authorised push payment i've been scammed already paid report fraud 159 7726".toLowerCase(),
    bodyText:
      "is it real? before you pay, click or reply (/scam): the instrument for a text, call or message that wants something now: a parcel fee, your bank's fraud team, a new number saying it's family, a refund, a job, an investment, a virus warning. people judge these by how they look, and how they look costs a scammer nothing: logos, caller id, perfect english, knowing your name or card digits. in the uk's take five survey (2018) 80% thought they could spot a scam approach and 9% got every quiz question right. the read uses what's hard to hide instead (stajano and wilson, communications of the acm 2011, seven principles from the real hustle; kircanski et al., psychology and aging 2018: high arousal, good or bad, raises willingness to buy from misleading ads): who started it (they did, i did through their link or number, i did on details i found myself), what it asks for (pay or move money, read out a code, sign in through a link, personal or card details, install an app or share the screen), how it wants paying (card, bank transfer, payment app, gift cards, crypto, cash) and what's pushing you (a deadline, a threat, a windfall, keep it quiet, don't hang up). the ftc's 2025 figures: about $15.9 billion reported lost, bank transfers the largest losses. a code, gift cards, crypto, cash collected at the door, a bank asking you to move money to a safe account, a secret, don't hang up, remote access from someone who contacted you, a job that asks you to pay, or tech support that found you: stop, nobody real asks this way. anything else that came to you and wants something: don't act inside the message; check it another way, with the check for each kind of sender (call the number on the back of your card from another phone, or 159 in the uk; ring family on the old number; open the company's own app; look up the office on gov.uk or a .gov site; pay on the platform; check the fca register or finra brokercheck) and the words to end the call. already paid, said a code or installed something: the first-hour steps, call your bank now, the gift card company, change passwords starting with email, report to report fraud (reportfraud.police.uk, 0300 123 2040) or reportfraud.ftc.gov, forward texts to 7726, and expect a recovery scam. ends in a line to keep and hands off to lend it give it or say no, cool and make a rule. includes a read-only worked example: a safe account call that knew the card digits. nothing is sent anywhere. pairs with the costly signals and base rates models and the essay judge the ask, not the look.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Sell it, keep it, or let it go?",
    href: "/sell",
    snippet:
      "Something you own sits unused. Ask the buyer's question, price it from what similar ones sold for, and get the listing and the lowest offer to take.",
    meta: "Sell or keep — should I sell it, and for how much?",
    titleText:
      "sell it keep it or let it go sell or keep selling stuff sell my stuff should i sell it how much should i sell it for what price to ask asking price list price pricing second hand secondhand used resale resell ebay facebook marketplace vinted gumtree craigslist depop declutter decluttering clutter unused things stuff i don't use garage sale yard sale car boot give away free to a good home lowball low offer haggle endowment effect status quo bias what i paid sunk cost".toLowerCase(),
    bodyText:
      "sell it, keep it, or let it go? (/sell): the instrument for the thing you own but don't use: the bike in the hall, the camera in a drawer, the pram, last year's phone. owning a thing inflates it (samuelson and zeckhauser 1988 status quo bias; kahneman, knetsch and thaler 1990 endowment effect, owners asked about twice what buyers would pay; gal and rucker argue much of it is inertia). what you paid anchors the price you ask: genesove and mayer (qje 2001) found boston flat owners facing a loss on their purchase price listed higher and sold much more slowly. the listing price is a signal: backus, blake and tadelis (jpe 2019) found round-number ebay listings drew offers 8-12% lower but were 15-25% more likely to sell. you give what similar ones actually sold for (sold listings, not asking prices, after fees and postage), optionally what you paid, then the buyer's question: if you didn't have it, would you buy it today for that? plus when you last used it and why it's still here (might need it, means something, paid a lot, no reason). keep it if you'd buy it again; keep it for what it means if it's sentimental; not sure: box it and date the box 90 days away, with a calendar file (.ics); otherwise sell it, unless selling pays less an hour than your time is worth, then give it away free. the price: a precise number about a tenth above the going price if you want the most, a round number near it if you want it gone, and the lowest offer to take decided now. ends in the listing, the reply to a low offer, a line to keep, and hands off to where's your line, fix it or replace it and make a rule. includes a read-only worked example: a road bike bought for £900, sold listings at £350, listed at £383. nothing is sent anywhere. pairs with the status quo bias, sunk cost and anchoring models and the essay what you paid isn't on the listing.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Which debt first?",
    href: "/debts",
    snippet:
      "Several debts and one amount a month. After the minimums, which one gets the rest? See costliest-first, smallest-first and spread-around on your own numbers.",
    meta: "Which debt first? — avalanche or snowball?",
    titleText:
      "which debt first which debt to pay off first pay off debt debt payoff debt repayment pay down debt get out of debt debt free credit card debt credit cards store card overdraft loan avalanche snowball debt avalanche debt snowball highest interest first smallest balance first minimum payment minimums only balance transfer 0% interest apr payoff plan payoff calculator debt calculator several debts multiple cards".toLowerCase(),
    bodyText:
      "which debt first? (/debts): the instrument for several debts and one amount a month to put towards them. after every minimum, the arithmetic says the highest rate first (the avalanche); the popular advice says the smallest balance first, for the win (the snowball). most people do neither: gathergood, mahoney, stewart and weber (american economic review 2019) followed 1.4 million uk cardholders and found two-card holders put about 51% of their extra on the costlier card where cost-minimising would put about 97%; payments matched each card's share of the balance (the balance-matching heuristic). amar, ariely, ayal, cryder and rick (journal of marketing research 2011): debt account aversion, people clear small debts first even when it costs. gal and mcshane (jmr 2012): closing accounts predicted getting out of debt. kettle, trudel, blanchard and haubl (journal of consumer research 2016): concentrating repayments on one account raised motivation, most for the smallest. stewart (psychological science 2009) and the fca: the printed minimum anchors payments down. you give each debt's balance, yearly rate (apr) and minimum, and what you can pay each month in all, and whether you've stalled before. the tool runs costliest first, smallest first and spread around month by month: take the quick win when it costs next to nothing, go by rate when it costs real money, or one quick win then by rate if you've stalled. gives this month's payments, the month each debt is cleared, the interest by order, what paying only the minimums would cost, and what a little more each month would save. 0% deals and guessed minimums are flagged. can't cover the minimums, or the interest outruns the payment: free debt advice first (stepchange, national debtline, citizens advice, an nfcc counsellor). ends in a line to keep and hands off to keep or cancel, pay now or pay monthly and make a rule. includes a read-only worked example: four debts, £7,550, £400 a month. nothing is sent anywhere. pairs with the goal gradient, anchoring and compound interest models and the essay one debt at a time.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Pay now or pay monthly?",
    href: "/monthly",
    snippet:
      "£649, or 12 payments of £59.99? Add up the plan, see the yearly rate it really charges, and check whether you'd buy it at this price without the plan.",
    meta: "Pay monthly — is the payment plan worth it?",
    titleText:
      "pay now or pay monthly pay monthly monthly payments payment plan instalments installments pay in instalments pay in 3 pay in 4 pay in three pay in four buy now pay later bnpl klarna clearpay afterpay paypal pay later finance store finance interest free 0% finance zero percent no interest deferred interest apr interest rate total cost credit phone contract car finance pcp hire purchase sofa laptop is it worth paying monthly should i pay in full pain of paying".toLowerCase(),
    bodyText:
      "pay now or pay monthly? (/monthly): the instrument for a price with a payment plan beside it — the laptop at £649 or 12 payments of £59.99, the sofa interest-free over a year, the trainers split into four at the checkout, phone or car finance. the monthly figure hides the rate: stango and zinman (journal of finance 2009) found people underestimate the interest rate a loan's payments imply, and those who underestimate most borrow most. small pieces take the sting out of paying (prelec and loewenstein, marketing science 1998, the pain of paying), and di maggio, katz and williams (nber 2022) found access to buy now pay later raised total spending, not just how people paid. plans stack: the cfpb found 63% of pay-later borrowers had several loans at once. you give the price if you pay in full today, each payment, how many, how often (weekly, fortnightly, monthly), whether the first is taken today, and optionally a deposit and a fee. it adds up the plan against the price and turns the difference into the effective yearly rate it charges (how a uk apr is quoted). then two questions: could you pay the full price today without going short (yes, only from emergency savings, no), and without the plan would you buy it at this price (yes, a cheaper one, probably not). interest-free and already decided: spread it and set every payment to come out automatically, since a missed payment is the only way it gets expensive (and some no-interest-if-paid-in-full deals backdate all the interest). a rate: pay now, or save the payment for a month or two first. your savings earn more than it charges: spread it. can't pay today: it's a loan to afford it, so check every payment fits and what a missed one costs. optionally what your savings earn (what keeping the money is worth) and what you already pay a month on other plans (the month's total). ends in a line to keep and hands off to cool the call, survive the worst case, the cover tool and make a rule. includes a read-only worked example: a £649 laptop against 12 payments of £59.99, about 21% a year. nothing is sent anywhere; inputs persist in your browser. pairs with the pain of paying model and the essay the smallest number on the page.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Before the trial ends",
    href: "/trial",
    snippet:
      "Signing up for a free trial? Cancel today if the free time survives it; otherwise get the date to cancel by, put it in your calendar, and get the question back on the day.",
    meta: "Free trial — cancel before it charges",
    titleText:
      "before the trial ends free trial free trials trial period cancel free trial cancel before charged forgot to cancel charged after free trial trial ends auto renew auto-renewal automatic renewal cancel by date cancel-by reminder calendar reminder 7 day trial 14 day trial 30 day free trial one month free first month free introductory offer card number streaming app store default defaults opt out".toLowerCase(),
    bodyText:
      "before the trial ends (/trial): the instrument for the moment you sign up for a free trial. a free trial is a subscription whose default is already chosen: do nothing and it becomes a payment. defaults win far more often than their merits explain (johnson and goldstein, science 2003, organ donation; madrian and shea, qje 2001, automatic pension enrolment). miller, sahni and strulov-shlain randomly offered about two million newspaper readers auto-renewing or auto-ending trials: around half of auto-renewal takers were inert and barely read the paper, and many readers avoided auto-renewing offers knowing their own inertia. so change the default at the start, when it is cheap. you give what it is, the price it turns into (monthly, yearly or weekly), the date of the first payment (in 7 days, 14 days, a month, 3 months, or a date), whether cancelling today keeps the free time, and optionally whether you expect to pay for it afterwards. if cancelling keeps the free time it says cancel today: the trial ends unless you choose it. otherwise it gives the cancel-by date, two days before the first charge (app stores want a day's notice; charges land early), says what forgetting would cost, and puts the date on your return desk and in your calendar as an ics file with an alarm. on the day it asks the fresh-start question with the price in it: would you sign up today, for the use you've actually had? answer kept, cancelled or charged; if it already charged, cancel and ask for a refund promptly. it keeps your record of trials against what you expected at sign-up. includes a worked example: a 14-day language-app trial at £12.99 a month. nothing is sent anywhere. pairs with the defaults model and the essay make the trial end on its own.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Still worth paying for?",
    href: "/keep",
    snippet:
      "The gym, the streaming services, the app that renewed in March. Go through your subscriptions one by one: what each costs a use, whether paying per use is cheaper, and whether you'd sign up today at this price.",
    meta: "Keep or cancel — subscriptions",
    titleText:
      "still worth paying for keep or cancel cancel subscription subscriptions should i cancel my subscription subscription audit recurring payments direct debit standing order membership gym membership streaming netflix spotify apps app store free trial auto renew auto-renewal renewal yearly annual membership news paper magazine box meal kit cost per use pay as you go flat rate status quo bias fresh start would i sign up today save money cut costs budget".toLowerCase(),
    bodyText:
      "still worth paying for? (/keep): the instrument for the subscriptions that renew themselves — the gym, the streaming services, the app whose free trial ended, the yearly membership, the box that arrives every fortnight. three pulls keep them going: we expect to use them more than we do (dellavigna and malmendier, american economic review 2006, paying not to go to the gym: members on monthly contracts over $70 went 4.3 times a month, more than $17 a visit against $10 on a ten-visit pass), a flat rate feels safer than paying per use (lambrecht and skiera, journal of marketing research 2006, the flat-rate bias: an insurance effect and a taxi-meter effect), and whatever is already happening has a head start (samuelson and zeckhauser's status quo bias, 1988). it starts with where to find them all: two months of bank and card statements, your phone's app store subscriptions page, and your email for renewal, receipt and trial, since yearly ones won't show on two months of statements. then one card per subscription: the price, billed monthly, yearly or weekly; times you used it in the last month, counted not planned; and optionally what one use would cost without it (a drop-in visit, renting the film). it works out what each costs a year and a use. if paying per use would have cost less, it says cancel and pay as you go, with the yearly saving. otherwise it asks the fresh-start question: if you didn't have it, would you sign up today at this price? yes: keep it. no: cancel it (for a yearly one, turn off the renewal now; you keep it until the date). not sure: if you could rejoin in a minute at the same price, cancel and see if you miss it, a cheap experiment, not a loss; if you'd lose an old price, your history or a place, keep it for now and set a date to ask again. the list ends with what everything costs a year and what cancelling would free, a line to keep (once a year, ask each subscription the fresh-start question), copy as text, and handoffs to set a tripwire, is it worth the time and make a rule. includes a read-only worked example: a gym, a second streaming service, a yearly news site and photo storage, where cancelling three frees £483 a year. nothing is sent anywhere; inputs persist in your browser. pairs with the status quo bias and reversibility models and the essay the subscription you wouldn't buy today.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Fix it or replace it?",
    href: "/fix",
    snippet:
      "The washing machine, the laptop, the car with a big garage quote. Divide the repair quote by what a new one costs per year of use to see how long the repair has to last to beat buying new.",
    meta: "Fix or replace — is the repair worth it?",
    titleText:
      "fix it or replace it fix or replace repair or replace repair or buy new is it worth repairing is the repair worth it worth fixing should i fix my repair quote garage quote mechanic washing machine dishwasher fridge freezer boiler oven laptop phone screen car repair old car new car upgrade sunk cost mental accounting book value 50 percent rule half the price rule consumer reports right to repair waste".toLowerCase(),
    bodyText:
      "fix it or replace it? (/fix): the instrument for a repair quote set against the price of a new one — the washing machine with a gone bearing, the laptop with a dead battery, the car with a big garage quote, the boiler, the phone screen. the feel is pulled both ways: towards repairing too long by what you've already spent (the sunk cost; okada, journal of consumer research 2001, found people keep a mental book value for what they own and resist replacing it until it feels paid off) and towards replacing too soon by the shiny new model (bellezza, ackerman and gino, journal of marketing research 2017, found people treat what they own more carelessly when an appealing upgrade is available; in a german environment agency study about a third of large appliances replaced in 2012/13 still worked). you give the repair quote, what a new one would cost, how long a new one would last, and optionally what the old one would fetch as it is and what a new one would save a year to run. the sum: a year of new costs (price minus what the old one fetches) divided by its life, less the running saving; the quote divided by that is how long the repair has to keep it going to win. if that's longer than a new one would last, replace it. otherwise you say whether, repaired, it'll keep going longer than that: yes comfortably (fix it), about that (too close to call on money — let hassle, waste or the upgrade decide), no (replace it), or no idea (ask the repairer how long one usually goes on after this repair and what else is close to going; if the bar is under three months, just fix it). ticked pulls each get a sentence: i've already spent a lot on it (gone either way), the new one is better and i want it (price the upgrade: each year you bring it forward costs about a year of new), throwing it out feels wasteful (a fair tie-breaker), i'm worried something else will go next (put it in the estimate). it shows the half-the-price rule of thumb against the sum: that rule is roughly the same division with a guess built in, that a repair buys half a new one's life. ends in a line to keep and hands off to the outside view, the cover tool (before the till), quit-or-stay and make a rule. includes a read-only worked example: a £120 laptop repair against an £800 new model that only had to last ten months. nothing is sent anywhere; inputs persist in your browser. pairs with the mental accounting and sunk cost models and the essay what the repair has to buy.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Insure it or carry it?",
    href: "/cover",
    snippet:
      "The extended warranty at the till, phone or gadget cover, the rental car's damage waiver, a lower excess for a higher premium. Insure the loss you couldn't pay yourself; for the ones you could, see the odds the cover has to beat.",
    meta: "Cover or carry — is the warranty or insurance worth it?",
    titleText:
      "insure it or carry it cover or carry insurance is insurance worth it extended warranty warranty is the warranty worth it protection plan care plan applecare phone insurance gadget insurance mobile insurance damage waiver rental car excess deductible voluntary excess lower excess higher excess premium gap insurance travel insurance pet insurance self-insure self insurance break-even odds claim rate failure rate probability weighting overinsuring sydnor abito salant kunreuther flood insurance".toLowerCase(),
    bodyText:
      "insure it or carry it? (/cover): the instrument for the cover offered at the till and the excess on a renewal — an extended warranty, phone or gadget insurance, the damage waiver at the rental desk, travel or gap cover, a lower excess (deductible) for a higher premium. the offer arrives just after you've said yes to something, framed as a worry, with the odds left out, and people get it wrong in both directions: they pay heavily to cover small replaceable things, and drop the cover that would actually save them after a few quiet years. the tool runs one rule that cuts both ways: insure the loss you couldn't absorb, carry the ones you could. you give the price (once, a month or a year, and how long a one-off covers), what replacing or repairing it would cost you and the excess you'd still pay — or, for an excess choice, the extra premium and the two excess levels — and the biggest bill you could pay from savings this month without borrowing or real hardship. the read, in order: the cover costs more than a claim would pay (carry it); the worst case is bigger than your savings could pay (insure it — this is the loss insurance is for — and take the highest excess you could pay to bring the price down); something you already have may cover it, like the maker's warranty, your legal rights over faulty goods, a card's purchase protection or a home contents policy (check first). otherwise it works out the break-even: the price divided by what it would pay is the chance of a claim at which the cover pays for itself, shown as 1 in n, or for an excess, how often you'd need to claim. you say whether a claim is likelier than that: no (carry it yourself); yes on your own record (worth it on your record — check the exclusions); yes on a feeling (probably not — abito and salant, review of economic studies 2019, found people guessed product failure at 13–15% against an expert 5%, and the median they'd pay roughly halved once they saw it); no idea (carry it — the seller set the odds; gadget insurance paid out about 36p per £1 of premium in the uk regulator's 2025 figures; sydnor, aej applied 2010, found most homeowners chose low deductibles costing far more than they could be expected to return). if you'd worry without it, it names the price of the peace of mind and offers the same calm as a savings pot. kunreuther and colleagues found the typical new us flood policy lapsed within two to four years, so a quiet year isn't evidence you didn't need it. ends in a line to keep: insure losses over my savings line, carry the rest, take the highest excess i could pay. hands off to the outside view (find the base rate), make a rule, and the survival check. includes a read-only worked example: a three-year warranty on a £600 tv for £99 that needed a 1 in 6 chance of failure. nothing is sent anywhere; inputs persist in your browser. pairs with the probability weighting model and the essay insure the catastrophe, carry the rest.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Is it worth the time?",
    href: "/worth",
    snippet:
      "Pay for delivery or do the shop? Drive across town to save a fiver? The cheaper flat with the longer commute? Work out the trade's price per hour, set it against your own price for an hour like that, and catch the percentage doing the persuading.",
    meta: "Time for money — what a trade costs or pays per hour",
    titleText:
      "is it worth the time time for money time vs money time or money worth my time is it worth it value of my time value of time what is my time worth hourly rate price of an hour buy time buying time pay to save time save money spend time delivery grocery delivery cleaner pay a cleaner taxi uber direct flight layover cheaper flight drive across town cheaper elsewhere diy do it yourself outsource chores commute commuting cheaper rent cheaper flat further out move further out relative thinking percentage saving jacket calculator tversky kahneman mental accounting whillans time poverty".toLowerCase(),
    bodyText:
      "is it worth the time? (/worth): the instrument for the everyday trade between time and money — pay for delivery or do the shop yourself, a cleaner, a taxi, the direct flight or the cheap one with the layover, drive across town to save a few pounds, do it yourself, take the cheaper flat further out with the longer commute. these calls get made on feel, and the feel is unreliable in a known way: tversky and kahneman (science, 1981) found far more people would drive 20 minutes to save $5 on a $15 calculator than on a $125 one — relative thinking, judging a saving as a share of the price rather than an amount — and saini and monga (journal of consumer research, 2008) found decisions about time lean more on heuristics than decisions about money because time is harder to account for. the tool puts both sides in one unit. you say which way the trade runs (pay money to save time, or spend time to save money), the money and the time, each once or per day, working day, week, month or year — a habit is counted over a year — and your price for an hour like this one: what someone would have to pay you to spend an hour of free time on it. not your wage, unless you could actually work the hour for pay; use take-home pay if you use pay at all, since money saved isn't taxed. then which is tighter right now, time or money. the read: too small to weigh (the gap is worth less than fifteen minutes of your time over a year — pick either); close (within a quarter of your line — let whichever is tighter decide); buy the time or keep the money; worth your time or not worth your time. if you give the full price, it flags when the percentage is doing the persuading — a big share of a cheap thing, or a small share of a dear one. whillans and colleagues (pnas, 2017) found people who spend money to buy time are more satisfied with their lives, yet only 2% of 98 working adults said they'd spend a $40 windfall that way. commuting came bottom of 28 activities in kahneman's day reconstruction study, and stutzer and frey found longer commutes went with lower life satisfaction. the answer ends in a line to keep — your price for an hour of this — because devoe and house (jesp, 2012) found pricing your time as you go makes free time less enjoyable, so set it once and stop. hands off to make a rule (for a trade that recurs), the comparison (when it's part of a move or a job) and make it happen. includes a read-only worked example: a cheaper flat that pays about £16 an hour to commute. nothing is sent anywhere; inputs persist in your browser. pairs with the relative thinking model and the essay an hour has a price, whether you set it or not.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "If it were next week",
    href: "/later",
    snippet:
      "Someone's asked you to do something weeks or months away: a talk, a committee seat, a favour, a trip. Count the real hours, picture it landing next week, and find out whether it's a yes, a no the distance was hiding, a smaller yes, or a no that's hard to say. Ends in a reply you can send.",
    meta: "Far-off yes — the next-week test for a request",
    titleText:
      "if it were next week far-off yes far off ask future commitment say no saying no how to say no decline decline an invitation turn down invitation overcommit overcommitted over-committed too busy yes damn effect future time slack zauberman lynch construal level liberman trope request favour favor asked to speak give a talk conference talk speaking invitation committee board seat volunteer volunteering help a friend move wedding speech should i say yes people pleaser people pleasing hard to say no guilt flattered owe them calendar prep time".toLowerCase(),
    bodyText:
      "if it were next week (/later): the instrument for a request that lands a good way off — a talk in march, a committee seat from the autumn, helping a friend move next month, a trip, a volunteering role. yes is easy because the cost falls on a future week that looks empty from here. zauberman and lynch (journal of experimental psychology: general, 2005) found people expect more spare time in the future than now, more so for time than money, because time demands arrive close to the day; liberman and trope (jpsp 1998) found distant plans are judged on desirability and near ones on feasibility. the tool moves the ask into the near view. first, the real cost in hours: the thing itself, preparing for it, getting there and back, recovering and following up — and what those hours will come out of. then the next-week test: picture it landing next week, out of the week you actually have — would you say yes? (for things that need lead time, picture the first week of preparation instead.) then the main reason yes is tempting: you'd enjoy it, it's useful, you'd feel bad saying no, it's flattering to be asked, or you owe them; and how hard backing out later would be. four reads: yes, it passes the next-week test (block the prep in your calendar now); no, only the distance made it a yes (decline now while it's cheap — givi and kirk, jpsp 2023, found people overestimate how upset an inviter will be by a no); a smaller yes (you want it, but not at full size — offer the part you'd do next week without resenting it); not a yes, a hard-to-say-no (guilt, flattery or a debt is doing the work). each read ends in a short reply you can copy and send today, and the whole read copies as text. hands off to make it happen (block the prep), the outside view (check the prep estimate) and make a rule (if these asks keep coming). includes a read-only worked example: a 45-minute meetup talk that's really fifteen hours, answered with an offer to share last year's slides. nothing is sent anywhere; inputs persist in your browser. pairs with the future time slack model and the essay future you is not less busy.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Where's your line?",
    href: "/walkaway",
    snippet:
      "You're about to negotiate a number — a job offer, a raise, a car, a house, a rate for your work. Set the worst deal you'll take from what you'll actually do if it falls through, a target you can justify out loud, and who should name the first number. Then check any offer against the line you set before you walked in.",
    meta: "Walk-away — set your line before the room sets it",
    titleText:
      "where's your line walk-away walk away point walkaway reservation price reservation value reservation point batna best alternative to a negotiated agreement getting to yes zopa zone of possible agreement negotiate negotiation negotiating salary negotiation negotiate salary job offer counter offer counteroffer raise pay rise ask for a raise asking price buying a car selling a car buying a house offer on a house selling a house freelance rate day rate contract rate haggle haggling first offer who goes first anchor anchoring precise number range offer bottom line lowest i'll accept most i'll pay deal or no deal impasse".toLowerCase(),
    bodyText:
      "where's your line? (/walkaway): the instrument for the half hour before a negotiation over a number — a job offer, a raise, a car, a house, a contract rate. most people walk in knowing roughly what they hope for and roughly what's too low, and roughly is how the line gets drawn in the room: by the other side's first number (anchoring; galinsky and mussweiler 2001 found first offers predict settlements) and by the discomfort of no deal (tuncel, mislin, kesebir and pinkley, psychological science 2016: people pick options worse than their alternative when they're labelled agreement, and impasse aversion is the stronger pull). the tool sets the line beforehand. first, which way you want the number to go (higher if you're paid or selling, lower if you're paying or buying). then your batna in fisher and ury's sense — what you'll actually do if there's no deal, named as an action, not a number — what it's worth, and how real it is (in hand, likely, or only a hope). then what this deal offers beyond the number, better or worse, and how much that's worth to you; that adjusts the alternative into a reservation value, the walk-away point (malhotra and bazerman, negotiation genius). then a target you can justify out loud, with its reason, because aiming at an ambitious target beats aiming at your floor. then the other side: a guess at how far they can go, whether they've already named a number, and who knows more about what it's worth. four reads: your target is no better than your walk-away (aim higher, or your alternative is worth less than you said — check real deals with the outside view); your walk-away rests on a hope (firm up the alternative before you talk — the strongest move happens before the negotiation — or set the line from what you'd do today); there may be no deal here (their likely limit is short of your line, so check the guess, look for terms beyond the number, or decide on a polite no now); or your line is set — no deal below the walk-away, aim for the target, concede slowly in shrinking steps. the first number: if they know more, let them open and re-anchor to your target; otherwise go first a little past your target, as a precise number (mason, lee, wiley and ames 2013: precise offers draw smaller counteroffers) or a range that starts at your target and runs further (ames and mason 2015, bolstering range); if they already opened, counter from your target, not from their number. a line card to copy — walk-away, target, and the in-the-room question: did i learn something about my alternative, or do i just want this to be over? an in-the-room check: type the number on the table and it says whether it's past your line (no), between line and target (you could take it — ask once more first), or at your target (take it and stop). no share link on purpose — your walk-away is the one number you never tell them. hands off to the outside view, widen, the journal, who gains if you say yes (a recruiter or agent paid on the close), and the blind round (setting an offer price with a partner). includes a read-only worked example: a salary offer of £60,000 against staying at £58,000, line £55,000, target £68,000. nothing is sent anywhere; inputs persist in your browser. pairs with the batna and the walk-away point model and the essay decide your line before the room does.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Neither one wins",
    href: "/par",
    snippet:
      "Two good options, each with something the other can't give, and every pass at the pros and cons comes out even. Find out whether one is really better, a fact is missing, they're a plain tie to flip, or they're on a par — a hard choice you settle by committing to the one you'll stand behind.",
    meta: "On a par — the hard choice more weighing won't settle",
    titleText:
      "neither one wins on a par parity hard choice hard choices ruth chang small improvement test small-improvement argument can't decide between two can't choose between two torn between two options two good options both good options equally good tie tied coin flip flip a coin commit commitment who do i want to be values clash competing values incommensurable incomparable pros and cons list keeps coming out even analysis paralysis drifting status quo default levitt coin toss job or family move or stay".toLowerCase(),
    bodyText:
      "neither one wins (/par): the instrument for a choice between two good options that won't settle however you weigh it — each gives you something the other can't, and the list comes out even every time. it draws on ruth chang's account of hard choices: we assume that options which won't rank must be missing information or be incomparable, but often they're on a par — comparable, neither better, and not equally good either. the small-improvement test tells a par from a tie: if two options were exactly equal, a slight gain to one (a little more pay, a slightly shorter commute) would settle it; if a small gain to either still leaves you unable to choose, they're on a par. the tool sorts the moment into four reads. one is better overall: not a hard choice but a painful one, because you still lose the best thing about the other — go, and don't treat the loss as proof you chose wrong; hands off to make it happen (/act) and ask your older self (/regret). a fact would settle it: not hard, unfinished — check it would change the call and can be learned cheaply and in time; hands off to enough to decide (/enough) and could you be wrong (/test). a tie, or one with a hair of an edge: flip a coin, or take the edge, and stop weighing. on a par: there's no hidden answer for more analysis to find, so settle it by committing — finish 'choosing this, i'm someone who…' for each option, name which one happens anyway if you never decide (steven levitt's coin-toss study of more than 20,000 undecided people found those nudged toward a change were on average happier six months later, so the status quo tends to be overrated on close calls), pick the one you'll stand behind, and get your commitment as a sentence you can keep and copy. hands off to the journal (/decide) and make it happen. the comparison's too-close-to-call result hands its two finalists here. includes a read-only worked example: a research job in edinburgh against staying in bristol near family. nothing is sent anywhere; inputs persist in your browser. pairs with the hard choices (parity) model.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Before anyone speaks",
    href: "/round",
    snippet:
      "Your group has to settle on one number — a deadline, a budget, a price to offer, the odds it works — and whoever says a number first will set it for everyone. Run a blind round: everyone answers privately, all numbers revealed at once, the two ends speak first, then everyone answers again. One phone passed round, or by message.",
    meta: "Blind round — a group estimate without the anchor",
    titleText:
      "before anyone speaks blind round group estimate team estimate estimate together agree on a number group number meeting estimate planning poker delphi method estimate talk estimate wisdom of crowds independent judgments independent estimates anchoring first number groupthink herding senior voice hippo deadline timeline budget price to offer offer price how long will it take how much will it cost launch date estimate as a team family budget".toLowerCase(),
    bodyText:
      "before anyone speaks (/round): the instrument for a group that has to land on one number together — when the project will be done, what to budget, what to offer for the house, how likely the launch is to work. the usual way is to talk it through, and talking means someone says a number first; everyone after adjusts from it (anchoring), the most senior or confident voice pulls hardest, and the quiet person with the crucial fact nods along. the fix is the estimate-talk-estimate procedure from kahneman, sibony and sunstein's noise — the same idea as planning poker and the delphi method, and the reason galton's crowd at the ox-weighing contest beat its experts: many estimates only beat one when they're made independently, so the errors cancel instead of leaning the same way. round one: everyone commits a number privately with one line on why, either passing one phone round the table (each person taps their name, types, locks it in and hides it) or by message (the organizer sends an invite link that carries only the question; each person answers on their own screen and gets a reply link to send to the organizer alone, never the group thread; the organizer pastes the replies back in, still hidden). the reveal shows every number at once on a line with the middle (the median), and reads the spread: within a fifth of the middle you already agree, so take the middle and stop — more talk only adds noise; moderately apart, talk for five minutes; far apart (the high double the low or more), you're not estimating the same thing — different scope, a different idea of done, or a fact one person has — so the lowest and highest speak first about what they were counting, everyone else asks what are you including that i left out, and the most senior person speaks last. round two: everyone answers again privately; the group's number is the middle of round two, and the tool flags when everyone collapsed onto one person's first answer and that person didn't move — persuasion or deference? hands off to the outside view for a timeline or budget, the flip point for a probability, the crux finder if the group is still far apart, and the decision journal to log it. copy the result as text for the meeting notes. includes a read-only worked example: the website launch where the newest person knew about the client's legal review. nothing is sent to any server; the invite and replies ride in the link fragment. pairs with the independent judgments and anchoring models.".toLowerCase(),
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
    title: "Ask your older self",
    href: "/regret",
    snippet:
      "You keep leaning one way but can't tell if it's the real call or just how you feel right now. Play the pull forward — ten minutes, ten months, ten years — and read whether it lasts or evaporates. Then weigh it against the regret you can't feel today: the road not taken, the one people regret most in the long run.",
    meta: "Regret minimization — the 10-10-10 horizon read",
    titleText:
      "regret older self 10-10-10 ten ten ten suzy welch bezos regret minimization framework time horizon future feeling present bias hyperbolic discounting temptation comfort avoidance leaning torn can't tell road not taken omission inaction gilovich medvec things you didn't do impulse durable evaporate trajectory ten years from now what would i regret least tool".toLowerCase(),
    bodyText:
      "ask your older self (/regret): the instrument for the calm-but-conflicted moment, when you keep leaning one way and can't tell whether that's the real call or just the version of you sitting here right now. it isn't the hot state the cooling-off tool meets — no anger, no clock, no pulse up — it's the quieter distortion: the pull of comfort, of avoidance, of the fear of trying, of a new thing's shine. all of them are present-weighted, and present weight is exactly what you can't feel from inside the present. a strong pull collapses the horizons into one loud now; this tool pulls them back apart. it borrows two well-worn moves the site had only ever mentioned in passing (inside the cooling-off tool, as one tactic for a hot state). suzy welch's 10-10-10 asks how the call will look in ten minutes, ten months, ten years, so a pull that evaporates can't out-shout one that lasts. jeff bezos's regret minimization asks the same from the end: project to your older self and choose what they'd least regret (his own frame for leaving a stable job to start amazon — a calm, deliberate call, the opposite of the hot moment). the two meet on one fact the present hides — the asymmetry gilovich and medvec measured: in the long run people regret the things they didn't do far more than the things they did, so a regret of omission is quiet today and grows, and it belongs on the board as its own weight, not folded into the pull. so the tool does two readings. it plays the option you're leaning toward across the three horizons and reads the trajectory — the same read-the-sign-pattern idiom the consequence trace uses, applied to how a feeling changes over time rather than how an effect ripples through the world. glad and stays glad: it lasts, this isn't the feeling talking, go. starts rough and ends glad: short-term cost, lasting gain, the shape of nearly everything worth doing, don't let the ten-minute version cast the deciding vote. a j-curve, glad then a rough middle then glad: go, but go in knowing the trough is coming so it can't ambush you into quitting right before it turns. loud now and a regret later: the classic trap, front-loaded appeal, present bias inflating the near reward until the later cost disappears — the ten-minute glow is not information about whether it's right. a flare that brightens in the middle and fades: usually novelty, discount the middle. drifts to regret at every horizon: nothing durable underneath, don't. feels good now and thins to nothing: a want not a need, an impulse, don't give it the weight of a real call. level across all three: the horizons don't decide it, take it to a tool that weighs the merits. and it asks, separately, about the road you'd be giving up, because the omission is the half the present hides — a road you'd regret giving up is the heaviest, most-underweighted weight on the board, and the cross of the two readings is the most useful thing it produces: when the pull doesn't last but not-trying is a lasting regret, it usually means it isn't this version you want but some version of the road you'd regret, so don't take this one on the strength of the feeling — go find the one your older self is asking for. nothing is sent anywhere; inputs persist in your browser; there's no forecast to log — a horizon read isn't a prediction — only a handoff to the right next tool: turn a durable yes into the first move or a pre-mortem, get distance from a loud-now pull in the cooling-off tool, or weigh a level call on its merits at the flip point. includes a read-only worked example: the comfortable default that curdles while the road not taken becomes a lasting regret. pairs with the cooling-off tool (for the hot version of the same problem), the present bias and second-order effects models, and the decision journal.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Advise a friend",
    href: "/advise",
    snippet:
      "You could tell a friend exactly what to do in your situation, but your own identical version stays a fog — Solomon's paradox. Put the call in a friend's name, say what you'd tell them straight, then face the harder half: would you take it? If not, the decision was never unclear — name the real obstacle, and it hands you the tool for it.",
    meta: "Across-person self-distancing — the advice you don't take",
    titleText:
      "advise a friend advice you don't take solomon's paradox grossmann kross self-distancing social distance outside view what would i tell a friend see clearly for others not myself stuck fogged calm can't decide my own reframe third person whose name obstacle block fear sunk cost what people think comfort of not choosing my case is different special pleading exception take your own advice tool".toLowerCase(),
    bodyText:
      "advise a friend (/advise): the across-person self-distancing instrument, for the calm decider. its sibling is ask your older self (/regret), which runs the across-time move; this runs the across-person one, so the self-distancing cluster now has a calm home on each axis. both moves also live as quick passes inside the cooling-off tool (/cool), but /cool is framed for a hot decider, and solomon's paradox needs no heat — you reason worse about your own dilemma than a friend's identical one stone-cold sober. named for the king whose wisdom ran his kingdom and wrecked his own house; igor grossmann and ethan kross measured it: people reason more wisely about a friend's problem than their own, and the gap closes when they take the outside view. the genuinely distinct thing this does, the reason it isn't a second copy of /cool's reframe, is that /cool shows you the third-person sentence and stops. this walks the whole procedure the essay is named for, you give better advice than you take: reframe your call into a friend's name so the answer comes clear, say the advice out loud and straight without softening it to it-depends, then answer the real question — would you take it yourself? three ways it lands. yes, and hearing it out loud was what you needed: the answer was never missing, only muffled by being yours, so don't re-open it, turn it into the first move before the fog rolls back. no, and that's the actual problem: then the decision was never the unclear part, the obstacle was, and you name which one — the downside scares me (loss aversion, weighting the worst case past its odds, go find the flip point and size it, or pre-mortem the failure); what people will think (an audience you can't name isn't a reason, ask your older self whether it weighs anything in ten years); i've already put too much in (sunk cost dressed as commitment, take it to would you start it today); the comfort of not choosing (drift is a choice too, made for the status quo, turn the advice into a first move); i don't fully trust the advice (maybe you gave the glib answer — reality-test the assumption your quick advice missed, or compare if there are several paths); something else (name it as plainly as the advice). it's genuinely different for me: then name the specific difference in a sentence — my situation is more complicated is not a difference, it's what everyone says. a real named one clears the special-pleading bar and the call gets decided on its merits; a difference you can feel but can't state is the resistance protecting itself, everyone believes their case is the exception, so take your own advice. nothing is sent anywhere; inputs persist in your browser; there's no forecast to log, only a routed handoff to the tool for whatever the read surfaces. includes a read-only worked example: the friend you'd tell to leave a career, held back by a decade of sunk cost you'd never let them count. pairs with the essay you give better advice than you take, the self-distancing model, the cooling-off tool for the hot version, and the older-self tool for the across-time version.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Enough to decide?",
    href: "/enough",
    snippet:
      "You keep telling yourself you need to know more before you can decide — one more data point, one more opinion, one more week. Run the value-of-information test: name the one thing you're waiting on, say what you'd do under each way it lands, and if it's the same either way, you already have enough. More research is delay, not diligence.",
    meta: "Value of information — the cure for analysis paralysis",
    titleText:
      "enough enough to decide value of information voi hubbard how to measure anything analysis paralysis stalling overthinking gather more information more research more data one more opinion need to know first stop researching when to stop gathering information decide now decision paralysis stuck can't decide waiting to know avoidance would it change my mind information worth it tool".toLowerCase(),
    bodyText:
      "enough to decide? (/enough): the value-of-information instrument, for the person stuck gathering. every other making-the-call tool assumes you're ready to weigh what you have; this one meets the moment before that, when you keep telling yourself you can't decide yet — you need one more data point, one more opinion, one more week of research — and you genuinely can't tell whether that's diligence or a way to not decide. the two are almost impossible to tell apart from the inside, because stalling wears the costume of thoroughness. the idea is douglas hubbard's, from how to measure anything (and ronald howard's decision-theory 'value of information' before it): the worth of a fact is not how interesting it is or how much more confident it would make you feel, it is only what it changes about the decision — and by that test most of what people agonize over learning is worth nearly nothing, while the few facts that would actually move the call go unchased. the tool runs the test without any math. name the one thing you feel you have to find out first. then say what you'd do under each way it could turn out — if it's this, i'd ___; if it's that, i'd ___. read the two answers back. same move either way: the information has no decision value, you already have enough, and more research is delay — which is what analysis paralysis almost always is, not a shortage of information but a reluctance to commit defended as needing more; so decide now (take a close two-option call to the flip point, a shortlist to the halo-off comparison, or log the call in the decision journal), and if the real block is discomfort rather than missing facts, name it — turn it into a first move, cool a hot version, or advise-a-friend the fog. different move: the fact is worth having, but only when you can get it cheaply and before the decision has to be made; so if there's a cheap fast way to learn it, don't predict it — design the smallest real test that would settle it (reality-test), or set your estimate against the base rate (the outside view); and if it's costly, slow, or genuinely unknowable, more waiting won't buy the answer, it just postpones the same call, so decide under the uncertainty at the flip point and set a tripwire to catch it if it resolves against you later. it's the qualitative twin of the flip point's own rule that only a fact which could move you across the threshold is worth knowing — the same test, run before you've put a single number on anything. includes a read-only worked example: the move where the rent number you were waiting on wouldn't have changed a thing, and the manager question you weren't asking would have changed everything. nothing is sent anywhere; inputs persist in your browser; there's no forecast to log — a value-of-information check isn't a prediction — only the handoff to the right next tool. pairs with the value of information and decision threshold models.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "When do you stop looking?",
    href: "/stop",
    snippet:
      "You're searching — apartments, jobs, candidates, a used car — and they come one at a time, each take-it-or-leave-it. Run the secretary-problem answer without the math: look at (and pass) the first 37% to learn what good looks like, then take the first that beats them all. Know whether you're settling early or holding out too long.",
    meta: "Optimal stopping — the 37% rule for a sequential search",
    titleText:
      "stop when do you stop looking optimal stopping secretary problem 37 percent rule look then leap sequential search when to stop searching am i settling settling too early holding out too long apartment hunting job search hiring dating used car how do i know when to stop keep looking always another option one at a time take it or leave it kepler algorithms to live by christian griffiths tool".toLowerCase(),
    bodyText:
      "when do you stop looking? (/stop): the optimal-stopping instrument, for a search rather than a choice. every other making-the-call tool assumes you already hold the options — the comparison scores the ones on your table, the flip point weighs two you can name, the value-of-information check asks whether a fact about a fixed choice would move it. this one meets the moment before you have a table at all: when the options are still arriving one at a time, each is take-it-or-leave-it, passing one likely loses it for good, and the real decision isn't which one but when to stop. that's the shape mathematicians call the secretary problem, and it has a proven answer, the 37% rule, popularized by brian christian and tom griffiths in algorithms to live by (kepler is said to have chosen his second wife exactly this way, interviewing eleven candidates in sequence). with no going back over a sequence, look at and reject the first 1/e ≈ 37% of the field no matter how good they seem — using them only to calibrate what good looks like here — then take the first one after that beats everyone in the look phase. that lands the single best option about 37% of the time, better than any other rule, and it's remarkably robust: the exact cutoff barely matters, the value is the structure it forces. it names the two ways people reliably fail. leap too early — grab the first shiny option before you've calibrated — and you settle on something you'd never have picked once you knew the field. look too long — keep passing decent options sure the next will be better — and you sail past the best one and take whatever's left in a panic. the tool runs it with no math. name the search. gate the shape: the rule only holds for a genuine sequential no-recall search, so if you can revisit passed options or see them all at once, it isn't a stopping problem — it's a comparison, and the tool routes you out to the halo-off comparison honestly. size the field, by a rough count, a time window in weeks, or the qualitative fallback if you can't bound it, and it computes your look phase. then locate where you are in the search: still early (keep looking and take nothing, the look phase calibrates, it isn't there to be chosen — note your best as the bar); further in and this one beats everything so far (take it, that's the leap, it won't feel certain because knowing it's the best would mean seeing every option, and holding out from here is how people miss it — commit via make-it-happen or log it in the journal); past the early stretch but nothing's beaten it (take the next that clears your bar, don't keep raising it, and as the field runs out lower the bar rather than hold for a winner that may not exist); or been at it far too long, passed good ones hoping (the second, costlier failure mode — each further look now costs more than the marginal better option, opportunity cost against you, so set a hard stop with a tripwire, a date and what you'll take, and check whether the pull to keep looking is really about wanting more information, which is the value-of-information test at /enough). it's the sequential-search sibling of enough to decide (/enough): both answer when do i stop gathering and commit, one over information about a fixed choice, one over options in a search. includes a read-only worked example: the apartment hunt where the fifth flat you loved and let go set the bar that let you recognize the eighth and grab it before someone else did. nothing is sent anywhere; inputs persist in your browser; there's no forecast to log — a stopping rule isn't a prediction — only the handoff. pairs with the optimal stopping model.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Can you survive the worst case?",
    href: "/ruin",
    snippet:
      "Some losses you recover from; some there's no coming back from — and against those, the odds and the upside stop mattering. Name the worst realistic outcome and ask whether you'd survive it. If yes, go weigh it. If no, refuse this version and cap the downside below ruin — take the shape you'd survive.",
    meta: "The ruin check — loss vs. ruin, survival first",
    titleText:
      "ruin survive survival worst case can i survive it can you survive the worst downside risk of ruin afford to lose can't afford to lose bet the farm all in wipe out wiped out lose everything absorbing barrier point of no return catastrophe catastrophic irrecoverable unrecoverable margin of safety gambler's ruin ergodicity taleb buffett never lose money kelly criterion first survive then optimize skin in the game tail risk blow up tool".toLowerCase(),
    bodyText:
      "can you survive the worst case? (/ruin): the survivability gate — the one instrument that runs the check every quantitative tool on the site quietly defers to. the flip point finds the probability where a call tips; the value-of-information test asks whether a fact would move a fixed choice; the expected-value model sums probability times magnitude. every one of them ends with the same caveat: expected value assumes you survive to keep playing, so against a downside you can't recover from the average is a lie and margin of safety wins. that caveat had no home; this is its home. the core distinction is loss versus ruin. a loss is recoverable — you take the hit and you're still in the game, and that's ordinary risk-and-reward. a ruin is an absorbing barrier (taleb's term): an outcome there's no coming back from — the reserve gone with nothing behind it, the reputation that won't rebuild, bankruptcy that ends the game, a health outcome you can't undo — and against it the odds and the upside stop mattering, because there is no 'on average' for someone who's out of the game. nassim taleb: never cross a river because it's four feet deep on average. warren buffett's rule one, never lose money, means never the ruinous kind. ole peters' ergodicity economics makes it formal: the ensemble average (across many people each betting once) diverges from the time average (one person betting repeatedly) exactly where ruin is possible — his coin that pays +50% heads, −40% tails has a positive average per round yet ruins almost everyone who actually plays it, because the multiplicative growth rate compounds to about −5% a round. two consequences: a small probability of ruin is not a small problem ('probably fine' is how people walk into the one outcome they can't undo, and the rare catastrophe only has to reach you once); and repetition is the multiplier — a one-in-a-hundred chance of ruin taken once may be fine, taken again and again it's a schedule, not a risk, which is why one round of russian roulette for a fortune still isn't a deal. the tool runs it with no math. name the decision. name the worst realistic outcome, concretely — not the theoretical worst, the bad tail you can actually picture — because the outcomes people won't picture are the ones they walk into. answer the one question that decides everything: if that happened, would you recover? four reads. a loss you'd recover from: this isn't a ruin problem at all, so don't let loss aversion veto a bet you could absorb — go weigh the odds against the stakes at the flip point, and trace the downside forward to be sure it stays recoverable. a ruin you can't come back from: don't take this bet — but don't refuse the goal either, refuse the un-survivable version of it. cap the downside below ruin — bet only what you can lose in full, keep a floor you never touch, buy the hedge that turns catastrophe into a cost, stage an irreversible leap into reversible steps — so surviving the worst case doesn't depend on the worst case not happening (that's margin of safety); routes to widen (find the versions that cap the downside) and doors (make it staged and reversible). the grey zone, a hit you might not fully come back from: treat it as ruin until you've put a floor under it, because the middle case doesn't feel like a cliff so it's the one people walk off slowly — the business that bleeds, the debt that creeps — so draw the line now, a state and a date past which you stop, via a tripwire. can't tell: settle that one question first by naming your point of no return concretely, then ask whether the worst case reaches it. the odds are used two opposite ways: for a survivable loss they decide, for a ruin they're confronted — 'probably fine' is the exact reflex the check exists to catch. it asks once-or-repeatedly because repetition turns a small ruin chance into near-certainty. includes a read-only worked example: the savings-into-a-friend's-business bet, where the fix isn't passing but investing the slice you could lose in full and keeping the runway untouched — same opportunity, survivable shape. nothing is sent anywhere; inputs persist in your browser; there's no forecast to log — a survivability check isn't a prediction — only the handoff. pairs with the ruin and margin of safety models.".toLowerCase(),
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
    title: "Your decisions",
    href: "/decisions",
    snippet:
      "Everything you've worked on a real decision, gathered in one place and grouped by the decision itself — the journal entry, the pre-mortem, the tripwires, the calls you're sleeping on. Not what's due (that's the return desk) — the whole record, and a way straight back into any part of it.",
    meta: "The decision home — your whole record, grouped by the call",
    titleText:
      "decisions decision home your decisions record history log everything all my decisions worked one place gathered grouped arc portfolio dashboard ledger overview index what have i decided past decisions my calls saved records journal premortem tripwire cooling-off in one view".toLowerCase(),
    bodyText:
      "your decisions (/decisions): the decision home — everything you've worked on a real call, gathered in one place and grouped by the call itself. for a dozen sessions the site's own complaint about itself was the same: you can walk one decision through half the toolkit — sort the door, hold its funeral in the pre-mortem, log the forecast in the journal, arm a tripwire, park a hot call to cool — and the carry through-line threads your one-liner from tool to tool so you never retype it, but once the pieces were saved there was no single view that showed them back together. the return desk (/review) gathers the scheduled half — what's due to check — and each tool keeps its own list, but everything i've worked on this one decision had no home. this is that home. it reads, never writes, every persisting tool's records straight from your browser and folds them into one shape, then groups records that share the same decision line: a decision carried across the journal, pre-mortem, tripwire, and cooling-off tools lands under the same line in each store, so grouping by that line reassembles the whole arc precisely — not a fuzzy match that might merge unrelated calls, an exact match on the text the tools already agree on, and a record typed on its own stands cleanly alone. each decision is a card: the line you worked, a one-glance summary (worked across how many tools, first worked when, the next return due), and every saved piece under it in the order you worked it — awaiting review, armed, cooling, reviewed, fired, decided cold — each linking straight back into its tool to continue or answer it. only the four tools that actually keep a record appear — the decision journal, the pre-mortem room, the standalone tripwire, and the cooling-off tool; the answer-now tools (which door, widen, flip point, compare, outside view, reality-test, trace, older self, quit-or-stay) compute in the moment and persist nothing, so there's nothing of theirs to gather, and the page says so rather than pretending. a search box filters by the decision line once the record grows, and the whole record prints to a clean pdf you can hold. it's the companion to the return desk: that page answers what did i schedule myself to come back and check; this one answers what have i worked, and where does each piece stand. because it all lives only in this browser, back it up when it grows. nothing is sent anywhere.".toLowerCase(),
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
    title: "The Outcome Isn't the Verdict",
    href: "/debrief",
    snippet:
      "Something already happened and you never logged it. The result answers 'did it work?' — but that's a verdict on your luck, not your decision. A backward-looking debrief that separates the two, guards against hindsight, and names the one thing to actually change.",
    meta: "The debrief for an un-logged past call",
    titleText:
      "debrief post-mortem postmortem past decision already happened resulting outcome bias hindsight bias annie duke thinking in bets good decision good outcome skill or luck variance regression to the mean was i right learn the lesson retrospective review unlogged didn't log grade a past call bad beat got away with it".toLowerCase(),
    bodyText:
      "the outcome isn't the verdict (/debrief): the backward-looking debrief for a decision that already resolved and you never logged in advance. every other instrument on the site fires before the result is in — weigh the close call, compare the options, forecast the magnitude, trace the downstream, cool a hot one, run the pre-mortem, log the forecast — and the only look-back tool, the return desk, only works if you wrote the forecast down first, because it grades a written forecast against what happened. but the far more common case is a call you never logged: it just happened, and now you're sitting with the result trying to work out what to learn. the trap is resulting (annie duke, thinking in bets): judging the quality of a decision by the outcome it happened to get, when outcomes have randomness — a mediocre call that got lucky reads as genius, an excellent call that got unlucky reads as a blunder, and learning from the result updates you in exactly the wrong direction. reconstructing an un-logged call is dangerous ground because memory edits the record after the fact (hindsight bias): what you now know seeps backward into what you're sure you knew. so the tool runs under guard. step one: name what happened and whether it worked out, then set that down — it's the verdict on your luck, not your decision. step two, the hindsight guard: split what you actually knew then from what you only learned after, because the after-facts are exactly what hindsight smuggles into the judgment, and they can't count. step three, the one question that grades the decision: knowing only what you knew then, would you make the same call again? step four: how much of the result was in your hands versus the roll, with a regression-to-the-mean guard for extreme results that won't repeat. then the verdict — annie duke's 2x2, decision quality against outcome quality, in four named cells. earned: you'd repeat it and it paid, bank the reasoning not the score. a bad beat: a sound bet that lost — the costly cell, because the loss screams change something and the honest answer is don't; keep the process, the dice were the problem. you got away with it: the dangerous cell — a flawed call the result rescued, and the win will file a bad process as a good one until the luck runs out, so fix the process now while you can still see the flaw the success is hiding. earned failure: the one cell where the outcome told the truth, so change the process — but only for what was knowable then and ignored, not the variance. the guarded lesson refuses to invent a fix for bad luck: if you'd make the same call again, the correct output may be no change at all. the win you should fix and the loss you should keep are the two moves outcome-based learning never makes on its own, and the whole reason to run the debrief. includes a read-only worked example. nothing is sent anywhere; it works a call you never wrote down, and the clean version is to write the next one down first in the decision journal so it stops being reconstruction. paired with the essays the difference between a good decision and a good outcome and experience doesn't teach, and the expected value and regression to the mean models.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Would You Start It Today?",
    href: "/quit",
    snippet:
      "You can't tell if it's time to quit, because everything you've already put in argues for one more push. This tool strips the sunk cost out of the call: would you start the thing fresh today, and does one more push beat its real alternative? Whatever you keep doing, you leave with a kill criterion.",
    meta: "Quit or keep going — with the sunk cost out of the vote",
    titleText:
      "quit quitting stop persevere keep going give up walk away sunk cost fallacy loss aversion should i quit my job project startup phd manuscript relationship time to quit kill criteria kill criterion tripwire annie duke quit fresh start test would i start it today opportunity cost throwing good money after bad almost there one more push cut losses when to fold".toLowerCase(),
    bodyText:
      "would you start it today? (/quit): the instrument for the moment you can't tell whether to quit — the project that's been 'almost there' for a year, the job or strategy or manuscript or relationship with the sunk decade, where everything already spent argues for one more push and one more after that. the hardest thing about knowing when to quit is that what you've already put in feels like a reason to continue, and it isn't: what's spent is spent whether you stay or go — it's a fact about the past, and the decision is entirely about the future. the pain of writing the loss off is real (loss aversion, the disposition effect, throwing good money after bad) but it is not information about whether to continue. so the tool does the two things the sunk-cost feeling won't let you do alone. step one and two: name what one more push costs from here, then name everything already spent — the money, the years, the effort, the face you'd lose — and understand that box is a quarantine: it gets no vote, because naming it is how you stop it voting in secret dressed up as 'i can't waste all that.' step three, the fresh-start test (annie duke, quit): forget you've already started — if this were put in front of you today, nothing sunk, would you begin it knowing what you know now? a brand-new you carries none of what you've spent, so their answer is the one the sunk cost can't reach; if they'd walk on and you won't, the gap between you is the sunk cost. step four, the opportunity-cost test: staying isn't measured against zero but against the best other use of the same time and money — 'better than nothing' is not the bar, 'better than the alternative' is — so you name the real next-best thing concretely and ask whether one more push beats that from here forward. then the verdict, with the sunk cost set aside, from the two forward tests crossed. keep going: you'd start it fresh and the push still wins — the rare clean stay, so carry on but set a kill criterion so it doesn't become a default you coast on. time to stop: you wouldn't begin it today and the alternative wins — every forward test says go and only the spent money argues to stay, so stop; quitting will feel like admitting the loss, but the loss is already real and quitting just stops adding to it. the tell: you'd start it but the alternative wins — one of those is the truth and the other is the story, usually the forward comparison is honest and 'i'd start it' is romance, so name which before spending another month. the rescue case: you wouldn't start it but the push still wins — that can be true, but only for a nameable reason (measurably near the finish with evidence not a feeling, or a real switching cost), and if you can't name it in a sentence one answer is the sunk cost in disguise; a re-import guard makes you write the measured reason or take the default and stop. whatever you decide to keep doing, the deliverable is a kill criterion (kill criteria, tripwires): a state you can't argue with and a date you're obligated to look — 'if i'm under x by this date, i stop' — set now while calm, because in the moment you'll always find a reason for one more push and quitting on time always feels like quitting too early; arm it as a tripwire so it lands in the return desk on the day. includes a read-only worked example that walks someone away from two and a half years and $30k, the move the sunk-cost feeling never makes on its own. nothing is sent anywhere. paired with the loss aversion, opportunity cost, outside view, and tripwires models and the essay hold the funeral first, and it's the purpose-built tool for the playbook's 'you can't tell if it's time to quit' situation.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Make It a Rule",
    href: "/rule",
    snippet:
      "It's not one decision — it's the same small call you keep facing: the after-hours message, the impulse buy, the 'quick' favour. You re-decide it from scratch every time, tired or tempted, and usually the way you later regret. This turns a recurring decision into a standing rule: a bright line, its rare exceptions named, and a date to re-endorse it.",
    meta: "Turn a recurring decision into a standing rule",
    titleText:
      "rule make it a rule recurring decision decide once standing rule bright line bright-line rule personal rules ainslie bundling private side bet decision fatigue willpower habit policy default the same call over and over stop deciding each time no more deciding brief email after hours phone in bedroom one drink impulse buy grazing weeknight consistency noise kahneman review the rule exceptions decide it once".toLowerCase(),
    bodyText:
      "make it a rule (/rule): the instrument for a decision you don't make once but over and over — the after-hours work message, the second drink, the impulse buy, one more episode, the 'quick' favour that eats the evening. the rest of the kit works one call at a time; this one is for the same small call faced again and again, re-decided from scratch every time, usually while tired, tempted, rushed, or depleted, and usually the way you later wish you hadn't. the insight: you don't lose to one bad choice, you lose to the same choice made a hundred times in a compromised state, so the fix isn't to decide it better each time — it's to stop deciding it each time. decide it once, cold, as a standing rule. why a rule beats a stronger intention: an intention leaves the actual decision in the moment, which leaves it to the version of you least able to make it well; a rule moves the decision out of the moment, made once by the calm planner, so the tired doer only has to execute. george ainslie's personal rules and bundling: face one cigarette alone and the temptation wins, but bundle it with the whole series it belongs to — this cigarette versus being a person who quit — and each small temptation becomes a referendum on the whole policy, a private side-bet against your future self. and kahneman, sibony and sunstein's noise: repeated case-by-case judgment on the same question is where unwanted variability creeps in, which a bright line simply deletes — the reason courts use sentencing guidelines, hospitals protocols, pilots checklists. the tool does four things a vague resolution doesn't. it gates: a genuine one-off is the wrong shape for a rule (it routes you to the guided front door or the reversibility triage instead) — a rule earns its keep only when the same call comes back. it forces a bright line: the test is whether a stranger watching could tell you'd broken it — 'none on weeknights,' not 'less'; 'decided at the door,' not 'be reasonable about it' — because a line you construe in the moment just hands the decision back to the self you built the rule to overrule (the same 'a bind you can talk your way out of is decoration' failure a weak tripwire has). it makes you name the rare, specific exceptions that should genuinely override it — binding against your predictable weakness, not against the news that you were wrong; a vague exception ('unless it's important') is a trapdoor the moment always finds, too many and you've written no rule at all. and it schedules a review: a rule is a standing decision to re-endorse, not a life sentence, or it becomes the same autopilot it replaced — so it arms the review on the return desk by handing the rule to the tripwire, pre-filled, no new machinery. the honest limits: a rule you can talk your way out of is decoration; don't rule-ify what genuinely needs judgment each time (over-generalizing is the mirror of the willpower mistake — rule only where the variation is your mood, not the case); and review it or retire it. includes a read-only worked example — the weeknight work message, carried to a finished rule. nothing is sent anywhere; there's nothing to log, a rule isn't a forecast. it's the recurring cousin of the tripwire — where the tripwire binds a single decision against a future self, a rule replaces a decision that keeps coming back — paired with the bright-line rules model and the essay decide it once.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Decided Isn't Done",
    href: "/act",
    snippet:
      "You made the call and it was right — but a week later it's still just a call. This turns a decision into an if-then plan that fires on a cue: the smallest first move, a backup for the obstacle, and a tripwire to reconsider — after checking a plan is even the right tool.",
    meta: "Make a decision actually happen",
    titleText:
      "act make it happen follow through follow-through implementation intentions if-then if then plan gollwitzer intention action gap intention-action gap procrastination never started never got around to it first step first move cue trigger habit tripwire kill criterion reconsider stick execution deciding and doing get it done".toLowerCase(),
    bodyText:
      "decided isn't done (/act): the instrument for the moment right after a decision — the week where most of them quietly die, never started or never revisited. there's a particular relief in finally settling something, and then often nothing happens: a week later the call is still just a call. the decision was never the hard part; the doing was, and deciding felt so much like progress it disguised how little moved. psychologists call it the intention-action gap and it's the default, not the exception — knowing what you intend barely predicts whether you'll do it. the fix is peter gollwitzer's, almost mechanical: take what you intend and rewrite it as an if-then plan — 'when this specific situation happens, i will do this specific thing' — and you hand control of the behaviour from your distractible in-the-moment self to the situation itself. across 94 studies and more than 8,000 people it produced a medium-to-large jump in follow-through (about d = 0.65) over holding the same goal without one, one of the most replicated results in behavioural science, and it costs a single sentence. the specificity is the active ingredient: a concrete cue — a time, a place, an event you'll unambiguously notice — fires the action almost automatically, while 'soon' or 'when i have time' never becomes a cue at all. the tool opens with the honest gate most planning skips: is the hard part the doing or the wanting? an if-then is powerful against starting, remembering, and catching a narrow window, and weak against a goal you don't actually want — no cue rescues a decision your gut keeps voting against — so if you only feel you should, it refuses to build a plan and sends you to decide whether to do the thing at all (the flip point, compare, or the quit-or-stay tool). once it's a genuine want it builds the plan. the first move: the smallest concrete step you could finish this week, because the first step's job is to start not to finish and a cheap easy-to-undo step taken now beats a perfect one planned forever — action creates information deliberation can't (reversibility). the cue: the specific moment that fires it, best of all an event that already happens (after i pour my morning coffee, when i sit down monday at 9, the moment my paycheck lands); it flags a vague cue that will never trip. the obstacle and the coping if-then: name the one thing most likely to stop the first move and pre-decide now, while it isn't happening, what you'll do when it does — a second if-then that keeps the plan from dying the first time the world doesn't cooperate. and the tripwire to reconsider: the same if-then pointed the other way (chip and dan heath's tripwire, annie duke's kill criteria), a state you can't argue with and a date you're obligated to look — 'if x by this date, i stop and rethink' — because a plan welded to one cue can coast past the point it stopped being right, and a decision dies two ways, never started or never revisited. the deliverable is a plan you can hold: three if-then sentences (to start, if it stalls, to reconsider), each weak link named, copyable so you can put it where the cue lives and it outranks the tired later version of you. arm the reconsider date as a tripwire so it lands in the return desk on the day. includes a read-only worked example — meaning to save for retirement and never starting, built out to a load-bearing plan. nothing is sent anywhere. paired with the implementation intentions and tripwires models and the essays the distance between deciding and doing and the plan was never tried; it's the purpose-built tool for the playbook's 'you've made the call — now make sure it happens' situation, and where the decision journal's first-move line grows into a full plan.".toLowerCase(),
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
      "the toolkit (/tools): the front door to the working instruments, organized by the moment you're in rather than by what each tool is called. see also the worked example at /example, one decision walked across the whole kit. the site grew an instrument at a time — the flip point, the consequence trace, the cooling-off tool, the pre-mortem, the decision journal, the return desk, the trainers — each built for a different shape of moment, but a person facing a real decision doesn't arrive knowing which of six tools fits; they arrive knowing what their moment feels like. every other index is browse-by-thing (models is browse-by-concept, writing is browse-by-essay, the playbook routes by moment but to ideas); this is the missing one, browse-by-moment routing to the instrument. three groups. facing a decision right now, where the value lands in this one sitting: the flip point for a close either/or where you keep arguing the exact odds, and then what for a move that looks good now but may reverse later, cool the call for a decision being made hot. about to commit to something that matters, where the tool sets up a return you make later: the pre-mortem for a big hard-to-undo commitment, the decision journal for a call worth recording how you thought. coming back or sharpening the blade: the return desk that gathers every scheduled review and tripwire check, and practice, the trainers for the numbers under a forecast. each row leads with the moment, hands you the instrument and the one thing it does there, and the question it answers. everything you enter stays in your browser and is sent nowhere. companion to the playbook, which routes the same way but to the mental models — the ideas to think with, where these are the instruments to think through. the two now cross-link at the moment: where a playbook situation has a purpose-built instrument, the playbook hands it to you right there (a one-way door hands you the pre-mortem, a hot-state call hands you cool the call, a stuck system or a metric you're designing hands you and-then-what, judging a past call that already resolved hands you the debrief), and each tool here names the moment it was built for, linking back into the playbook — the idea and the tool that does it, one click apart.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "One Decision, Worked Through",
    href: "/example",
    snippet:
      "Each tool has a worked example of its own; this is the one thing a single tool can't show — how they connect. One real decision, take the offer at the smaller company or stay, walked across the whole loop, with the through-line carrying it from tool to tool.",
    meta: "See how the tools fit together",
    titleText:
      "example worked example walkthrough demo one decision worked through how the tools connect fit together through-line new here getting started show me how it works end to end".toLowerCase(),
    bodyText:
      "one decision, worked through (/example): a cross-tool worked example. each instrument has an example of its own, but a single tool can't show how they connect — this page can. it follows one real, ordinary decision — take the offer at the smaller company, or stay where i am — across the whole loop: the reversibility triage (which door is this), the flip point (p* = r/(b+r), which side of the line you're on), the pre-mortem (write the failure, turn each cause into a fix, an accepted risk, or a tripwire), the decision journal (record the reasoning, seal a forecast with a confidence number, schedule the review), and the return desk (grade the decision apart from the outcome). the point it demonstrates is the through-line: you type the decision once, at the first door, and the same ?subject= handoff the live tools use carries it into every tool after it, so the kit works as one instrument instead of five separate forms each demanding you restate the decision. every step links into the live tool with the decision already loaded, so a reader can pick up where the example left off or clear it and drop in their own call — and the pre-fill never writes over saved work. good front door for someone new, or anyone who wants to see how the instruments hand off to each other rather than what each one does alone. its companion is the hot spine at /example/hot; nothing on the page is saved and the example decision is invented.".toLowerCase(),
  },
  {
    type: "Tool",
    title: "Deciding Hot, Worked Through",
    href: "/example/hot",
    snippet:
      "The other worked example — the one people actually regret. One hot, clock-pressured call, 'quit my job today,' walked across the kit, where the toolkit's first move is to stop you deciding at all: cool the call and park it, come back cold, run the triage, log the real decision, turn it into a first move.",
    meta: "The hot spine, worked through",
    titleText:
      "deciding hot worked example hot decision angry quit resign panic emotional urgent walkthrough cool the call park sleep on it return cold second example the other spine anger burnout".toLowerCase(),
    bodyText:
      "deciding hot, worked through (/example/hot): the companion to /example, walking the hot spine instead of the cold one. the flagship example follows a cold, deliberate call agonized over for weeks; this one follows the kind people actually regret — a decision made hot, pulse up, a resignation half-typed at 11pm. one call — quit my job today, i can't take another week of this — walked across the kit: cool the call (the two facts a hot head can still judge — reversible? forced? — settle it: one-way and not forced is the one combination you never act on hot, so the verdict is don't decide tonight, and you park it to come back in three days), the return desk (three days later it hands the parked call back cold, unchanged — the beat the cold walkthrough has no room for: the most important move on a hot decision is the one not made yet), which door is this (cold, separate the irreversible edges — burning a reference, the résumé gap — from the reversible whole, having a job at all; the panic had fused them), the decision journal (the real call isn't quit today, it's leave within three months on my terms with something lined up — logged with a forecast and a review date), and decided isn't done (turn it into a first move bound to a cue, a backup for the obstacle, and a reconsider tripwire). two things make it its own page: the shape is different — the kit's first move is to refuse to let you decide while hot — and unlike the cold spine, which dead-ends at the subject-less return desk, every tool here reads the through-line, so the exact words typed in anger ride into every calm tool after them and three days later you don't reconstruct what you meant. parking isn't talking yourself out of it: a real signal survives the wait, so if the call still stands cold that's a reason to act. every step links into the live tool with the decision loaded, and the pre-fill never writes over saved work. nothing on the page is saved and the example decision is invented.".toLowerCase(),
  },
];

/**
 * Light singular/plural stemming so a query term also matches its other number:
 * "models" finds "model", "biases" finds "bias", "companies" finds "company".
 * Substring matching already covers the singular→plural direction ("model" is a
 * substring of "models"), so this only strips the query down, never up.
 */
function termVariants(term: string): string[] {
  const variants = [term];
  if (term.length > 4 && term.endsWith("ies")) variants.push(term.slice(0, -3) + "y");
  if (term.length > 3 && term.endsWith("es")) variants.push(term.slice(0, -2));
  if (term.length > 3 && term.endsWith("s") && !term.endsWith("ss")) variants.push(term.slice(0, -1));
  return variants;
}

/** Best hit for one term against one doc: 3 in the title fields, 1 in the body, 0 for a miss. */
function termScore(doc: SearchDoc, term: string): number {
  const variants = termVariants(term);
  if (variants.some((v) => doc.titleText.includes(v))) return 3;
  if (variants.some((v) => doc.bodyText.includes(v))) return 1;
  return 0;
}

/**
 * The words the site actually contains, drawn from the *title-level* fields
 * only — names, tags, authors, model and tool names, playbook titles. That is
 * the high-signal vocabulary people reach for by name (and misspell): "kahneman"
 * from a book author, "reversibility" from a model, "anchoring" from a bias.
 * Building the correction dictionary from title text, not body prose, is the
 * false-positive guard: a typo is only ever rescued *to* a word the site treats
 * as a keyword, never to some incidental word buried in an essay.
 */
const VOCABULARY: string[] = Array.from(
  new Set(
    docs
      .flatMap((doc) => doc.titleText.split(/[^a-z0-9]+/))
      .filter((w) => w.length >= 4)
  )
).sort();

/**
 * Levenshtein distance between `a` and `b`, capped: returns the true distance
 * when it's within `max`, or `max + 1` once it's provably past budget — so a
 * correction check against the whole vocabulary stays cheap. A length gap wider
 * than `max` can't be closed, so it's rejected before any DP work.
 */
function boundedEditDistance(a: string, b: string, max: number): number {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > max) return max + 1;

  let prev = Array.from({ length: lb + 1 }, (_, j) => j);
  for (let i = 1; i <= la; i++) {
    const curr = [i];
    let rowMin = i;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      curr[j] = v;
      if (v < rowMin) rowMin = v;
    }
    // Whole row already past budget — no later row can recover.
    if (rowMin > max) return max + 1;
    prev = curr;
  }
  return prev[lb];
}

/** True once any doc scores this term — i.e. it's already a word the site has. */
function termMatchesAnyDoc(term: string): boolean {
  return docs.some((doc) => termScore(doc, term) > 0);
}

/**
 * The closest real vocabulary word to a misspelled term, or null. The budget
 * scales with length — one edit for a short word, two for a long one — because a
 * one-character slip in "kahnemann" and a two-character slip in "reversibiity"
 * are the same *kind* of typo, and a fixed budget of 1 would rescue only the
 * former. Ties break toward the shorter word (the likelier root), then
 * alphabetically, so the correction is deterministic.
 */
function nearestVocabWord(term: string): string | null {
  if (term.length < 4) return null;
  const budget = term.length >= 8 ? 2 : 1;
  let best: string | null = null;
  let bestDist = Infinity;
  for (const word of VOCABULARY) {
    if (word === term) return null; // exact vocab word — not a typo to fix
    if (Math.abs(word.length - term.length) > budget) continue;
    const dist = boundedEditDistance(term, word, budget);
    if (dist > budget) continue;
    // Closest wins; ties break toward the shorter word (the likelier root), and
    // VOCABULARY is sorted so a remaining tie resolves alphabetically and stably.
    if (dist < bestDist || (dist === bestDist && best !== null && word.length < best.length)) {
      best = word;
      bestDist = dist;
    }
  }
  return best;
}

export type Correction = { from: string; to: string };

export type SearchResult = {
  docs: SearchDoc[];
  /** True when no page matched every term and these are the closest partial matches instead. */
  partial: boolean;
  /** Misspelled terms that were auto-corrected to rescue an otherwise-empty page. */
  corrections: Correction[];
  /** The query actually run, with corrections applied — for the "showing results for" line. */
  correctedQuery?: string;
};

/** Score and rank a fixed set of terms — the strict-AND primary, then the near-miss fallback. */
function runSearch(terms: string[]): { docs: SearchDoc[]; partial: boolean } {
  const scored = docs.map((doc) => {
    let score = 0;
    let matched = 0;
    for (const term of terms) {
      const s = termScore(doc, term);
      if (s > 0) matched += 1;
      score += s;
    }
    return { doc, score, matched };
  });

  // Primary: pages that matched every term (strict AND), best score first.
  const full = scored
    .filter((r) => r.matched === terms.length)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.doc);
  if (full.length > 0) return { docs: full, partial: false };

  // Fallback: no page matched every term, so one absent word no longer collapses
  // the whole set to a dead end — surface the closest matches (most terms hit
  // first, then by score), capped, so a near-miss lands somewhere useful.
  const partial = scored
    .filter((r) => r.matched > 0)
    .sort((a, b) => b.matched - a.matched || b.score - a.score)
    .slice(0, 8)
    .map((r) => r.doc);
  return { docs: partial, partial: true };
}

function search(query: string): SearchResult {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return { docs: [], partial: false, corrections: [] };

  const primary = runSearch(terms);
  if (primary.docs.length > 0) return { ...primary, corrections: [] };

  // Nothing matched, not even a partial. Before giving up, ask whether a term
  // was simply misspelled: correct only the terms that hit nothing, only to a
  // word the site actually carries, and re-run. This is purely a rescue — it
  // fires only on an already-empty page, so it can never reshuffle or degrade a
  // query that was working; the worst case is the same empty page as before.
  const corrections: Correction[] = [];
  const rescued = terms.map((term) => {
    if (termMatchesAnyDoc(term)) return term;
    const fix = nearestVocabWord(term);
    if (fix) {
      corrections.push({ from: term, to: fix });
      return fix;
    }
    return term;
  });
  if (corrections.length === 0) return { ...primary, corrections: [] };

  const retry = runSearch(rescued);
  if (retry.docs.length === 0) return { ...primary, corrections: [] };
  return { ...retry, corrections, correctedQuery: rescued.join(" ") };
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
  const { docs: results, partial, corrections, correctedQuery } = useMemo(
    () => search(query),
    [query]
  );
  const showResults = query.trim().length > 0;
  const corrected = corrections.length > 0;

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
            ? "No matches. Try a single, broader word."
            : corrected
              ? `No matches for ${corrections
                  .map((c) => `“${c.from}”`)
                  .join(" or ")} — showing ${
                  results.length === 1 ? "the result" : `${results.length} results`
                } for “${correctedQuery}” instead.`
              : partial
                ? `Nothing matched every word — ${
                    results.length === 1
                      ? "the closest match"
                      : `the ${results.length} closest matches`
                  }, by how much of your search each one covers:`
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
          and base-rate trainers, and {books.length}{" "}books.
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
