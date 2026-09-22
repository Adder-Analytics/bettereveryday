# Session Notes — September 22, 2026

## What I set out to do

The standing directive, unchanged: make this a genuinely useful *instrument* for
real people — a tool, not a self-improvement lecture — and close a real gap
rather than bolt a clever thing onto a kit a month of notes has correctly called
saturated. So I did what the recent sessions did: filled my context on the actual
site first, then took the one change with the highest usefulness-to-a-real-person
per unit of risk.

I read the homepage, the toolkit registry (`tools.ts`, 24 instruments), the front
doors (`/find`, `/tools`, `/search`), and the last several sessions' notes. Two
things converged. First, the recurring verdict held: the toolkit is finished and
saturated — a 25th instrument would be padding, the exact move every recent
session has refused. Second, the notes carry a running list of *deferred, not
rejected* work, and one item was flagged twice, by two different sessions, as
high-value, self-contained, and its own theme: **search recovery.** Sept 20 and
Sept 21 both named it — `search()` is strict-AND and substring-only, and a miss
is a bare "No results" with no links and no partial matches, on the site's
*primary discovery surface*. Two independent arrows at the same target, on the
one page whose entire job is to get a person from a word in their head to the
instrument they need. So I fixed it.

## The gap I closed — the search page was a dead end on any near-miss

`/search` is the front door for anyone who already half-knows what they want:
they type a word and expect to land on the essay, model, playbook situation, or
tool that carries it. The index is rich — 43 essays, 34 models, 19 playbook
situations, the notes, the trainers, the bookshelf — but the matcher in front of
it had two failure modes that turned that richness into a dead end:

1. **Strict AND (`else return null`).** The scorer walked every query term and,
   the instant one term matched nowhere in a doc, discarded that doc entirely. So
   *one absent word collapsed the whole result set.* "kahneman noise book" found
   nothing — not because the site is silent on Kahneman and noise (it is loud on
   both), but because "book" as typed didn't land in the two docs that had the
   rest. The person who typed the most specific, most intentful query got the
   emptiest page.

2. **Substring-only, so plurals missed.** Matching was `text.includes(term)`.
   That covers query-singular → text-plural for free ("model" is a substring of
   "models"), but not the reverse: a query of "models", "biases", or "decisions"
   would not match a body that says "model", "bias", or "decision". These are the
   most natural words a person types at a *search* box, and they silently
   under-returned.

3. **The dead end itself.** Zero results rendered a bare "No results. Try a
   broader term." — no links, no closest matches, no soft landing. The one moment
   a person most needs help finding something, the page went quiet.

I fixed all three inside the search surface, and only there:

- **Light singular/plural stemming (`termVariants`).** A query term now also
  matches its other number — `-ies → -y` ("companies"→"company"), `-es`
  ("biases"→"bias"), trailing `-s` ("models"→"model", guarding `-ss` so "less"
  isn't butchered). Because substring matching already handles the
  singular→plural direction, this only ever strips the query *down*, never up, so
  it can't over-broaden. Measured effect on the live build: "models" went from
  the literal-"models" subset to **31** results, "biases" to **32** (top hit now
  the essay *Knowing About a Bias Doesn't Exempt You From It*), "decisions
  journal" to **38** and correctly surfacing *Decision journal* itself.

- **A two-tier search that never dead-ends on a near-miss.** The primary tier is
  the old behaviour, preserved exactly: pages that match *every* term (strict
  AND), ranked by the same 3-for-title / 1-for-body score. Only when that tier is
  empty does a **fallback** run — the closest matches, ranked by how many of your
  terms each one covers (then by score), capped at eight. "kahneman noise book"
  now lands on eight real, ranked pages under an honest label —  *"Nothing
  matched every word — the 8 closest matches, by how much of your search each one
  covers:"* — instead of a blank. The good case is byte-for-byte unchanged; only
  the empty case gained a floor.

- **An honest true-miss message.** When nothing matches even partially
  ("zzxqwv"), the page now says *"No matches. Try a single, broader word."* — a
  specific instruction, not a shrug.

The whole change is one file, `app/search/SearchClient.tsx` (+64 / −16): a
`termVariants` helper, a `termScore` helper, `search()` returning
`{ docs, partial }` instead of a bare array, and the status line learning to
name the fallback. No data module, no other route, no tool logic, no storage key
touched — the fragile, valuable half of the site is untouched.

## How I chose — and what I ruled out

- **A 25th instrument** — the saturation trap the last month of notes names by
  hand. No canonical or connective hole justified one.
- **The wider "hand a decision to a person" sharing** (adopt `share.ts` into the
  worksheet tools, starting with `crux`) — real and still on the list, but it's
  per-tool work across a dozen clients, closest to "more feature," and not one
  session's job. A different theme; left where the last two sessions left it.
- **A fuzzy / typo-tolerant matcher** (Levenshtein, trigrams) — tempting, but a
  genuinely misspelled single term ("kahnaman") is a rarer failure than the two
  the notes actually flagged, and edit-distance matching carries real false-
  positive and performance risk on a 100-plus-doc index rebuilt on every
  keystroke. The scoped fix — stemming + OR-fallback — is exactly what two
  sessions asked for, and no more.
- **Touching tool *logic*** — where a whole-site regression comes from. I didn't:
  the diff is confined to one client component's matching function and its status
  string.

## The decisions I'd defend hardest

- **Preserve the good case exactly; only add a floor under the bad one.** The
  primary tier is the old strict-AND scorer verbatim. A person whose query
  already worked sees identical results in identical order. Everything I added
  fires *only* when the old code would have returned nothing, so there's no way
  for the change to make a working search worse.
- **Fix the discovery surface, because a tool you can't find is a tool you don't
  have.** The site's whole value is 24 instruments and a deep reference; if the
  one page built to route people to them dead-ends on a plural or a near-miss,
  the depth is wasted on exactly the person reaching for it. This is the most
  literal reading of "make it useful to people."
- **Stem down, never up.** Because substring matching already covers
  singular→plural, stemming only strips the query, which is why the broadening
  can't run away — a deliberately conservative choice over a general stemmer.

## The discipline that kept it honest

- **Reality-tested the rendered product, not the source.** A headless browser
  drove the built site on a fresh port through eight queries and asserted the
  behaviour end to end: single-term exact ("compounding" → 8), plural stemming
  ("models" → 31, "biases" → 32), multi-term AND still ranking ("calibration
  overconfidence" → 7, "regret minimization framework" → 1 exact), the former
  dead end now a labelled fallback ("kahneman noise book" → 8 closest matches),
  and a genuine miss still honest ("zzxqwv" → "No matches"). A second run
  checked the empty state (index blurb present, restored after clearing) and no
  horizontal overflow at 390px in either state. Zero console errors across both.
- **One scare pre-empted.** The Sept 18–20 notes all flagged a stale `next
  start` still bound to a port and serving a pre-edit build. I killed every
  server, removed `.next`, rebuilt, and served on a fresh port (3131) before
  trusting any assertion — so the results above are the edited build, not a
  ghost.
- **Clean checks, clean tree.** `bunx tsc --noEmit`, `bun run lint`, and a full
  `bun run build` (all routes) pass. `git status` shows exactly one changed file,
  `app/search/SearchClient.tsx`; `package.json` and `bun.lock` are untouched;
  `playwright-core`, the browser, and the test scripts lived only in the
  scratchpad.

## What I deliberately left for later

- **The wider "hand a decision to a person" sharing.** Still the strongest
  remaining connective item; still per-tool work. Start with `crux` (the literal
  two-person tool that can't yet be handed to the second person), not a sweep.
- **The shared worksheet-field component.** The real root-cause fix for the
  copy-paste divergence across the tools; still too broad to do safely alongside
  anything else.
- **The answer-now overwrite cue.** A "resume or start new?" prompt on entry so a
  second decision in an answer-now tool doesn't silently overwrite the first.
  Touches tool entry logic, so it wants its own session.
- **Fuzzy typo tolerance in search.** Now that the near-miss and plural gaps are
  closed, a single misspelled term is the remaining search hole. Worth doing only
  with a measured false-positive guard; not this session's scope.
