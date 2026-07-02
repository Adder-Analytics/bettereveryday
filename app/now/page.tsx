import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Now — Better Every Day",
  description: "What I'm focused on right now.",
};

const UPDATED = "July 2, 2026";

type NowItem = {
  label: string;
  items: string[];
};

const sections: NowItem[] = [
  {
    label: "Reading",
    items: [
      "Poor Charlie's Almanack — Charlie Munger. Second read. The mental models are more useful now that I know which ones I've actually internalized vs. which ones I just thought I had.",
      "Designing Data-Intensive Applications — Martin Kleppmann. A third of the way through, finally doing it properly instead of skimming.",
    ],
  },
  {
    label: "Writing",
    items: [
      "Trying to publish something weekly. This site is that commitment made public — knowing something will be read forces a different kind of clarity than writing just for myself.",
      "Working on writing more honestly and less impressively. Clarity first. Craft second.",
    ],
  },
  {
    label: "Building",
    items: [
      "This site. Both essays in the base-rate corner end on the same admission: the arithmetic of updating is the easy part, and the genuinely hard judgement is upstream — choosing the prior at all, deciding what class of thing your case even belongs to. The reading note on Thinking, Fast and Slow has been demanding the fix for weeks ('make the base-rate lookup a mandatory step'), and the base-rate trainer's session notes had flagged a reference-class mode twice as the honest finish line. So it's built: the trainer at /update now has a third mode, Pick the prior. Messy, real-shaped questions with no answer key — a deadline you're about to promise, a friend's restaurant, a wedding, a startup — where you give your gut answer first, then choose which reference class you'd start from. The candidates include traps, because real life includes them: classes of one ('founders this talented' — the inside view wearing a costume, with no rate to give you) and folklore rates ('90% of restaurants fail in year one' — traced to a TV commercial; the census says about 17%). Every honest class is sourced — Buehler's thesis study, the BLS survival data, the CDC marriage data, the venture-return research — and the reveal shows where every honest class lands, next to your gut. What it records across visits is the one number the mode exists to expose: your inside-view premium, how far your gut runs above the outside view before any evidence arrives. It's paired with a new essay, 'Nobody Thinks They're the Base Rate' (the newlyweds who accurately recite the ~50% divorce rate and put their own odds at zero), a new mental model (Outside View — the 23rd), and a new playbook situation for the commonest planning moment there is: 'You're about to promise a deadline.' The honest limit is the essay's coda: Kahneman himself heard his team's base rate and ignored it, so knowing about the inside view protects nobody — the lookup has to live in the procedure, which is exactly what a drill, a checklist step, and a journal are for.",
      "Before that: for three weeks the site had been growing a family of trainers — calibration (how wide should my uncertainty be?), estimation (how do I get to a number at all?), and base rates (how much should a new fact move me?) — each built the same way, as an essay + model + interactive drill, and each keeping its own little record in your browser. What it never had was the thing that makes them feel like one project instead of three loose tools: a single place to see all three records side by side. So now there's a practice hub at /practice. It reads each trainer's record straight from the browser, shows your three headline numbers together — your 90% hit rate, your typical estimation miss in factors of ten, your base-rate lean in points — and, the genuinely useful part, points you at the weakest of the three so you spend the next ten minutes where it actually helps rather than re-practising the one you're already good at. Most people aren't vaguely 'bad at thinking'; they're specifically overconfident, or specifically frozen in front of a blank estimate, or specifically prone to letting the latest vivid thing knock them around — different muscles, different exercises, and now legible at a glance. It's paired with a new essay, 'Three Numbers for an Uncertain World,' which is the case for treating the three as one skill: every forecast in the decision journal uses all three at once, so a sharp estimate with no error bars is a trap, and a perfect prior you refuse to update is just a different kind of stubbornness. The read side is deliberately separate from the trainers that own the records, so the hub can't regress any of them — it only reads. The honest limit, the same one the trainers carry: a tidy score on trivia with knowable answers is a warm-up; the decisions that matter don't come with an answer key, which is exactly why the journal exists.",
      "Before the hub: two trainers for putting honest numbers on the world — calibration (how wide should my uncertainty be?) and estimation (how do I get to a number at all?) — plus a Base Rates model that half the playbook quietly leans on, and yet no way to practise the skill that model names: updating, the act of letting a new piece of evidence move you by the right amount. The canonical case: a test is 99% accurate and you test positive for a disease one person in a thousand has, and almost everyone — including most doctors asked this exact question — puts the odds you're sick near 99%. It's about 9%, because the rare true cases are swamped by false positives drawn from the huge healthy majority. That error — trusting the test and forgetting how rare the thing was — is base-rate neglect, and it's behind needless health scares, 'highly accurate' screens that are wrong most of the time, and the fraud alert you learn to wave through. The cure is Gerd Gigerenzer's and it's almost embarrassingly simple: stop thinking in percentages and count a concrete crowd, where the answer becomes something you can just tally. So there's a new base-rate trainer at /update, with two modes — walk one scenario through slowly (guess first, then watch the numbers redrawn as people), or take a quick round of six — scored not only on how far off you were but on whether you keep landing high, which is base-rate neglect made measurable on you. It's paired with a new essay ('How Much Should This Change Your Mind?') and wired into the Base Rates model and the playbook situations that turn on a prior, completing the essay + model + trainer triangle for the third member of that family. The honest caveat is the whole back half of the essay: the arithmetic is the easy part; the hard part is choosing the right reference class and an honest prior — a confident wrong base rate just launders itself into a confident wrong answer with the math lending it authority.",
      "Before that, the estimation trainer at /estimate. The journal and the calibration trainer both lean on a number you're supposed to supply — a probability, a forecast — but the site had never taught the more basic move underneath them: producing a defensible number for a quantity you can't look up. How big is this market, how long will this take, how many people would actually use the thing. Most people freeze or wave a hand; there's a third option, and it's a skill — break the question into pieces you can guess and multiply them. The surprising part, and the reason it was worth a whole tool: a chain of rough guesses lands closer than one confident guess, because independent errors tend to point in different directions and partly cancel. So there's a new estimation trainer at /estimate, with two modes. Decompose walks one hard problem (the classic 'piano tuners in Chicago,' golf balls in a school bus) — it takes your gut guess first, then has you build the answer from its factors, so you watch the decomposition beat the gut. One-shot tests the instinct on quantities that span orders of magnitude (trees on Earth, neurons in a brain, people who've ever lived), scoring how many factors of ten you were off. Your record builds across rounds, in the browser. It's paired with a new essay ('How to Guess on Purpose') and wired into the Fermi Estimation model and the existing 'Orders of Magnitude' essay — completing the essay + model + trainer triangle the calibration work started. The honest caveat is built in: the error-cancellation only works when your mistakes are independent and unbiased — a consistent optimist's errors compound instead, and one load-bearing factor can still sink the estimate. But that's the quiet payoff: a decomposition shows you exactly which assumption the answer hinges on, turning a vibe into something you can argue with and check.",
      "And before that: for its whole life the decision journal had asked, on every forecast, a question it never taught you to answer: how sure are you? It offers 60%, 80%, 90% — and then takes your word for it. But a probability is only worth something if it's true, and almost nobody's is. People's 90% confidence intervals contain the real answer closer to half the time; the feeling of being sure and the fact of being right have quietly come apart. The remarkable thing — and the reason this was worth building — is that calibration is the rare bias you can actually train away. Douglas Hubbard finds most people go from badly overconfident to nearly perfect in about half a day of feedback; being well-calibrated is the trait that most defines Tetlock's superforecasters. So there's a new tool, a calibration trainer at /calibrate: put 90% ranges on facts with knowable answers (using Hubbard's 'equivalent bet' to catch your own inflation — would you rather win on your range, or on a 9-in-10 wheel?), or rate true/false statements by confidence and watch your calibration curve. Your record builds across rounds, all in the browser. It's paired with a new model (Calibration) and an essay ('Your 90% Isn't 90%'), and wired straight into the journal's forecast step — because the trivia is only a warm-up. The honest caveat is the whole back half of the essay: real decisions don't come with an answer key, which is exactly why the journal exists — it's the same calibration loop for the bets reality refuses to grade.",
      "Earlier: the whole decision tool stopped at the decision — and for most people the decision was never the hard part. You settle something, feel the relief of a question closed, and then a week later the call is still just a call: never started, or never revisited when something changed. That gap between deciding and doing is one of the most reliably measured facts about behavior (intentions barely predict action), and the fix is almost mechanical — Peter Gollwitzer's if-then plans, which across 94 studies roughly doubled follow-through by handing the behavior to a concrete cue instead of to your future, busier self. So the worksheet now ends at 'the first move': the smallest first step, written as an if-then, plus the tripwire — the same tool pointed backward, the signal that snaps you awake to reconsider (the Heaths' idea from Decisive). I added the model that anchors it, Implementation Intentions, an essay ('The Distance Between Deciding and Doing'), and a new situation for the moment the site had never addressed — 'You've made the call, now make sure it happens.' The honest caveat is built in: an if-then helps when the obstacle is starting or remembering, but it's weak against a goal you don't really want, and a plan welded to one rigid cue can blind you — which is exactly why you set the tripwire alongside it.",
      "Earlier still: the decision tool kept assuming a calm person at the keyboard — but the decisions people most regret are made hot: the email sent in anger, the panic-sell after bad news, the leap made while infatuated, the sunk cost you can't stand to write off. So now there's a situation for exactly that — 'You're about to decide in the grip of a strong feeling' — built on two findings that point the same way. Solomon's paradox (Grossmann & Kross): people reason more wisely about a friend's dilemma than their own identical one, and the gap closes when they take a distanced view of themselves. And Loewenstein's hot–cold empathy gap: in a hot state we overweight what we feel right now and can't model the calm self who lives with the choice. The fix is to manufacture distance — across time (Suzy Welch's 10/10/10: how will this look in ten minutes, ten months, ten years?) and across person (what would you tell a friend in this exact spot?). I added the mental model that anchors it, Self-Distancing, and an essay, 'You Give Better Advice Than You Take' — with the honest caveat that distance is for stripping the overweighting, not for numbing a feeling that's real information. The catch-all worksheet now carries the same distance step, which had been the one stage of the WRAP process it underplayed.",
      "Before all that: the decision tool at /decide had a quiet gap — it only worked the eight named situations I'd curated — a one-way door, a number someone put in front of you, designing incentives. A real decision that didn't fit one of those molds had nowhere to go. So now there's a catch-all worksheet that works any decision through, built on the Heath brothers' WRAP process: widen the options before anything else (most choices are framed as a narrow 'whether or not,' which throws away every option nobody named), reality-test against the base rate, weigh by probability not vividness, run a pre-mortem and set a tripwire, and calibrate how much to deliberate to how reversible it is. I added the missing mental model that anchors it — Narrow Framing, the most common decision error, which happens before any analysis in how you pose the question — and an essay on it ('The First Mistake Is the Question'). It removes the biggest reason someone would land on the tool and bounce: 'my decision isn't on the list.'",
      "The decision journal also still keeps for years — export the whole log, carry it between devices, set a calendar reminder for any review, and once you've reviewed a few it shows your calibration: of the calls you were 70% sure of, how many actually went your way. Generated entirely in your browser, no account, nothing sent anywhere.",
      "Connected the last loose edge in the reference: reading notes now link to the mental model each one is a concrete instance of, and every model lists the notes that illuminate it — so a story (Wald's bombers) and the idea it teaches (survivorship, base rates) are one click apart in both directions.",
      "Some internal tooling I can't talk about yet — but it's the most interesting technical problem I've worked on in a while.",
    ],
  },
  {
    label: "Physical",
    items: [
      "Training for a half marathon. Currently at 18 miles per week. Race is in September.",
      "Recovering from a minor shoulder strain — doing PT exercises. Learning that patience is part of the training.",
    ],
  },
  {
    label: "Learning",
    items: [
      "Spanish. B1 plateau is real. Started a conversation exchange with someone in Madrid — three sessions in, it's helping more than any app has.",
      "Systems design. Reading papers from infrastructure teams at companies I admire. The field rewards long, patient study.",
    ],
  },
  {
    label: "Not doing",
    items: [
      "Social media — down to one deliberate 20-minute check per week. It's been six months. I miss almost none of it.",
      "Meetings before 10am. The first two hours of the day are protected.",
    ],
  },
];

export default function Now() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-14">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-2">
          Now
        </h1>
        <p className="text-sm text-[var(--muted)]">Updated {UPDATED}</p>
      </div>

      <div className="space-y-12">
        {sections.map(({ label, items }) => (
          <section key={label}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
              {label}
            </h2>
            <ul className="space-y-3">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-16 text-xs text-[var(--muted)]">
        Inspired by{" "}
        <span className="underline underline-offset-2">
          Derek Sivers&rsquo; /now pages
        </span>
        .
      </p>
    </div>
  );
}
