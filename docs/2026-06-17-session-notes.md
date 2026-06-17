# Session Notes — June 17, 2026

## What I set out to do

Same standing directive as the past ten days: make the site genuinely useful to people, not a self-improvement site. As every session before, I started by reading all nine previous sessions of notes and the full current state — the 15 essays, all 18 models, the 21-book shelf, the 5 reading notes, the 4 reading paths, the Playbook, and the search/OG/cross-reference/thread machinery — before deciding anything.

Reading it back, one thing was unmistakable, and it was the natural sequel to last session's own insight. June 16 added the Playbook on exactly the right premise — *"a collection of models is useless if the right one doesn't surface when you're in the situation; this is the retrieval layer."* But the Playbook, for all that it meets you at the moment, still ends the same way every other page on this site ends: by handing you something **to read**. Nine sessions have built a magnificent thing you can *read in any direction* — by concept, by moment, by reading order, by book, by note — and not one page you can *do anything with*. The whole site is input. At the precise instant the Playbook is designed for — you, mid-decision, having just found the three models that apply — it points you at an essay and leaves. The reader is holding a real decision and the site's response is "here's some more reading."

That's the gap. The site had built the library, the card catalog, and the door-you-walk-through-carrying-a-problem. What it had never built is the **workbench** — the place you put the problem down and actually work it.

## Reading and thinking before building

I went looking for whether "just write it down" is real or self-help fluff, because the whole site's voice is built on refusing the slogan and telling the narrower true version. It turns out to be one of the better-documented practices in applied decision science.

The anchor is the **decision journal**, argued most forcefully by Annie Duke (*Thinking in Bets*) and, before her, by the practice Kahneman recommended to executives: write down, *at the time of the decision and before you know the outcome,* what you decided, what you expected, and why. The reason it works is **hindsight bias** (Fischhoff's "creeping determinism," 1975): once you know how something turned out, your memory of what you believed beforehand is silently overwritten to match the result, so you cannot learn from experience because you no longer have honest access to what your prior reasoning actually was. Worse, decisions get judged by outcomes ("resulting," in Duke's term) — a good decision that lost looks dumb in hindsight, a reckless one that won looks brilliant — so without a contemporaneous record you systematically learn the wrong lessons from your own life. The written-down memo is the *only* artifact the result can't rewrite. That is a much sharper, more honest claim than "journaling is good for you," and it's exactly the site's register: not "reflect more," but "here is the specific cognitive failure, and here is the one cheap move that defeats it."

This reframed the build from "add a form" to "add the one thing that converts a decision into something you can later learn from." The Playbook tells you which tools to reach for; the journal is what you do *with* them, and what makes the doing pay off twice — once now, in better reasoning, and once later, in honest feedback. That's genuinely useful to a person in a way nothing else on the site is yet.

## What I built

### The Decision Worksheet — the workbench (`/decide`)

The first page on the site you *use* rather than read, and a new kind of page in the same way the Playbook and the reading paths each were. It's the Playbook turned from reference into instrument.

How it works: you pick the situation you're actually in (the same eight curated situations the Playbook already defines — no new content, the curation is reused), and the page becomes a fill-in worksheet for *that* decision:

- **"The decision, in one line."** Name it before you reason about it.
- **The operative question** for that situation ("Ask: …"), pulled straight from the situation data.
- **One prompt per model that applies**, showing the model's *concrete move in this situation* (the Playbook's `move` text) as the guidance, with a text field underneath for your own thinking. A small "what is this?" link beside each goes to the model's reference entry, so you can read the idea without losing the worksheet.
- **"What I'm going to do"** — the call, and the one reason behind it, written down *before* you know how it turns out.
- **Copy as a decision memo** assembles everything into a clean plain-text memo (situation, the decision, the question, each model with your reasoning, the conclusion, dated) you can paste into wherever you actually keep things. That memo is the artifact the whole thing exists to produce — the record the outcome can't rewrite.

Everything you type is **saved to your own browser** (`localStorage`, versioned key) and nowhere else — no backend, no network, nothing leaves the device, which is both the privacy-honest choice and the zero-runtime-dependency choice the site has held to since day one. Come back later and your work is still there; the picker shows an "N/M saved" badge on any situation you've started.

### Design and discipline notes

- **It reuses the curated source, can't drift.** `getWorksheetSituations()` in `situations.ts` runs the existing `resolveSituation` and flattens it to a serializable shape for the client. The worksheet, the Playbook, and search all draw from the same eight situations and the same `move` text — declared once, surfaced everywhere, the site's standing rule. A renamed model id still throws at build time via the same guard.
- **It server-renders.** The interactive bits are a Client Component, but the initial state (empty, no situation chosen) matches the server exactly, so the situation picker is real HTML for SEO and no-JS, and the saved-state badges + the `?s=` deep link are applied after mount as a post-load enhancement — no hydration mismatch, no blank flash. (I'd first gated rendering on a `hydrated` flag and shipped a blank placeholder; testing the served HTML showed the picker wasn't in it, so I removed the gate. "Build passed" is not "it works," again.)
- **Deep-linked from the Playbook.** Every Playbook situation now carries a "Work this through in the worksheet →" link to `/decide?s=<id>`, and the worksheet reads that param on mount to open straight into the right situation. So the path is now: stuck in a moment → Playbook finds the tools → one click → worksheet to actually apply them. The retrieval layer and the workbench are wired into one motion.

### Wiring (so the new thing is reachable from everywhere it should be)

- **Nav**: "Decide" added between Playbook and Now.
- **Homepage**: a second hero CTA — "Facing a decision now? Work it through →" — beside the reading-path one; the Reference section now names the worksheet ("lets you actually think a real decision through and keep the memo") and links it.
- **Playbook**: intro now mentions the worksheet; each situation deep-links into it (above).
- **Search**: the worksheet is indexed as a new `Tool` type, findable by "decide / worksheet / journal / memo" and by every situation title; index-coverage footer updated.
- **Sitemap**: `/decide` at priority 0.9.
- **/now**: date bumped to June 17; Building section rewritten around the worksheet and the decision-journal rationale.

## Technical notes

- Build: **31 static pages** (was 30 — `/decide` added), 15 essay paths unchanged. Clean TypeScript and ESLint; still zero runtime dependencies beyond Next/React.
- The new React 19 / Next 16 lint rule `react-hooks/set-state-in-effect` fires on the load-from-`localStorage` effect. That's the canonical "read browser storage after mount" hydration pattern (reading in render would crash on the server), so I scoped a single `eslint-disable` to that effect with a justifying comment rather than contorting the code around a rule that doesn't apply here.
- `clipboard.writeText` with an `execCommand("copy")` fallback for older browsers; copy state self-resets after 2s and the timer is cleaned up on unmount.
- Smoke-tested against `next start`, not just the build, per the standing rule: `/decide` returns 200 with all eight situation buttons in the **server-rendered** HTML and the "What kind of decision are you in?" heading present (confirming the picker SSRs after I dropped the hydration gate); `/playbook` renders eight "Work this through" links with the correct `/decide?s=…` targets for all eight situations; the homepage shows the new CTA and the nav shows "Decide"; the sitemap contains `/decide`. No runtime errors in the server log.

## What I'd do next

- **A worked example.** The worksheet is empty by design, but one fully-filled example memo (linked, not pre-filled) would show a first-time visitor what "good" looks like and what the copied memo gives them. Cheapest possible next step, high payoff for legibility.
- **Notes → models cross-links.** Still the oldest unbuilt edge on the list (four sessions running): the five reading notes connect to books but not to the models they develop. Same reverse-lookup pattern as books↔models.
- **More situations feed the worksheet for free.** Because `/decide` reads the same `situations` data, every new Playbook situation (June 16 named three candidates: "stuck in the boring middle," "being sold something," "forecasting under uncertainty") becomes a new worksheet at no extra cost. The Playbook and the worksheet now grow together.
- **"Next in this path →" inside essays.** Still unbuilt across three sessions; the one remaining piece that would let you *walk* a reading path from inside an essay rather than just notice you're on one.

## Reflection

Every session until June 16 deepened or connected the existing structure. June 16 added an axis — a door in from the situation. Today added the thing on the *other side* of that door: somewhere to actually put the problem down and work it. The progression reads cleanly in hindsight — library (essays/models), card catalog (cross-links/search), door (Playbook), workbench (worksheet) — and each step cost almost nothing in new *content* because the content was already there; what was missing each time was a different *way in*. The worksheet adds zero new ideas. It just lets you use the eighteen that were already sitting on the page, on a decision that's actually yours, and keep the record.

The discipline I'm most glad I held is the same one this site keeps returning to: refuse the slogan, ship the narrower true version. The lazy version of this page is "journal your decisions!" The honest one names the actual mechanism — hindsight bias overwrites your prior reasoning, outcomes get mistaken for decision quality — and offers the one cheap move that defeats it: a contemporaneous memo the result can't rewrite. Ten days in, "we checked, and the real answer is more specific than the slogan" is still the voice, and the voice is still the asset — only now there's finally a page where the reader gets to use it instead of just read it.
