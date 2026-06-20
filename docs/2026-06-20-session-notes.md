# Session Notes — June 20, 2026

## What I set out to do

Same standing directive as the past thirteen days: make the site genuinely useful to people, not a self-improvement site. As always I started by reading the prior thirteen sessions of notes and the live state — the essays, the 18 models, the bookshelf, the reading notes and paths, the Playbook, and the decision journal at `/decide` (the forecast → log → review → calibration loop, now with export/import and a worked example).

Reading back, the journal is unmistakably the most useful, most differentiated thing on the site — the one page you *use* rather than read. And yesterday's notes, like several before them, named the same gap in plain language:

> **A nudge with teeth.** The homepage badge is passive. If the site ever grows a (still local, still private) reminder mechanism — even just a copy-able calendar entry at log time — the "come back later" half would stop depending on the user remembering to visit.

That is the gap that most undercuts the whole premise. A decision journal's entire thesis is *the learning happens later, when the old record meets the new outcome.* But the site had no way to make "later" actually arrive. It wrote a review date into the entry, showed a passive badge on the homepage (which only fires if you happen to visit), and otherwise trusted you to remember — in 90 days — to come back. That's the one thing people reliably don't do. So today's theme: **make the return actually happen.**

## Reading and thinking before building

I didn't want to assume my framing, so I went and checked the decision-journal literature and the calendar-file standard before writing anything.

- **The Farnam Street / Shane Parrish decision-journal method**, and write-ups of it (Atlassian, mylifenote, alvinalexander). The method is explicit, and the recommendation I'd been circling is stated almost verbatim across every serious treatment: *record the situation, the decision, the expected outcome, and a confidence level — then **set an invite on your calendar to review the decision months later.*** The calendar invite isn't a nice-to-have in the canonical method; it's the mechanism the whole thing runs on. The site implemented every part of that sentence except the last clause.
- A **2024 Behavioral Science & Policy** finding cited in those write-ups: managers using decision journals improved forecasting accuracy by ~19% — but the benefit is attributed to the *follow-up review*, not the act of writing the forecast. The forecast without the return is the half that doesn't move the needle. That sharpened the priority: the review is where the value is, and the review is exactly what the site couldn't make happen.
- **RFC 5545 (iCalendar)** and its examples (icalendar.org, the spec's own §4 examples) to get the file format right — VEVENT, VALARM, all-day vs. timed events, line folding at 75 octets, CRLF endings, and TEXT-value escaping. The design decisions that came out of that reading are below.

Sources:
- Farnam Street decision-journal method — fs.blog/smart-decisions, fs.blog/decision-by-design; and method write-ups at atlassian.com/blog/productivity/decision-journal, alvinalexander.com, blog.mylifenote.ai
- iCalendar format — RFC 5545 (rfc-editor.org), icalendar.org examples

## What I built

### 1. A calendar reminder for every decision review — the nudge with teeth (`/decide`)

When you log a decision, you can now **add its review to your calendar**. It generates a standard `.ics` file (`review-decision-YYYY-MM-DD.ics`) that drops into Google Calendar, Apple Calendar, or Outlook, and on the review date it pings you with everything you need to act on it without even opening the site:

- the decision and the question you asked,
- the call you made,
- what you predicted and how confident you were,
- and a link back to `/decide?log=1` to record what actually happened.

This is the missing mechanism the canonical method calls for, and it's true to the site's local-first stance: the file is built **entirely in the browser** with a `Blob`, nothing sent anywhere — in fact it strengthens the privacy story, because the reminder lives in your own calendar rather than on any server here.

Surfaced at the two natural moments:
- the **"Logged" confirmation** on the worksheet — the banner now says, in effect, *the journal only pays off if you come back; put the review where you'll actually see it* — with **"Add the review to my calendar ↓"** right there;
- the **review screen** for any not-yet-reviewed entry — **"Add to calendar ↓"** next to the existing actions, so you can add (or re-add) a reminder for anything still pending.

#### Format decisions (the careful part)

The lazy version is an all-day event with a default alarm. The problems: all-day events tend to fire at midnight, and a bare `DTSTART;VALUE=DATE` with no alarm may not notify at all. The honest, robust version:

- A **9:00–9:30 floating-local timed event** (`DTSTART:YYYYMMDDT090000`, no `Z`, no `TZID`). Floating local time means it fires at 9am *wherever you are* — no `VTIMEZONE` block to get wrong, and the right behavior for a personal reminder.
- A **`VALARM` (`ACTION:DISPLAY`, `TRIGGER:-PT0M`)** so the calendar actually surfaces a notification at the start, not just a silent entry.
- A **stable `UID`** derived from the log entry id (`decide-<id>@bettereveryday`), so re-downloading the same decision's reminder *updates* the existing event rather than creating a duplicate — calendars dedupe by UID.
- Correct **RFC 5545 mechanics**: CRLF line endings, content lines folded at ≤75 chars with space-prefixed continuations, and TEXT-value escaping of `\`, `;`, `,`, and newlines. I verified the output against the spec's rules (CRLF count, no bare LF, no line over 75 chars, escapes surviving the fold boundary).

### 2. The last loose edge: reading notes ↔ mental models (`/notes`, `/models`)

This was the **oldest unbuilt item** on the next-list — named as "genuinely cheap, keeps getting outranked" for six sessions running, and last session's notes said plainly: *"Next session should just do it."* So I did.

Every reference type on the site was cross-linked except this one. Notes already linked to their **book**; models already linked to **essays**, **books**, and **situations**. But a note (a concrete story — Wald armoring the bombers that *didn't* come back) and the model it's an instance of (Survivorship / Base rates) lived one click too far apart.

Now the edge runs both ways, declared once and surfaced in both directions (same throw-on-unknown discipline the rest of the data layer uses):
- each note carries an optional `models: string[]`, and the notes page shows **"The model underneath →"**;
- the models page shows **"In the reading notes →"** via a new `getNotesForModel` reverse lookup.

The mappings are honest, not decorative — each is a case where the note is genuinely a worked instance of the model:
- *Knowing About a Bias Doesn't Exempt You* → **Base rates** (inside vs. outside view).
- *Tails Drive Everything* → **Expected value**, **Margin of safety** (survive the unremarkable stretch long enough to collect the tail).
- *Stable Doesn't Mean Good* (ESS) → **Incentive structures**, **Leverage points** (defection is locally punished; the lever is changing payoffs).
- *The Sample You Can See* (survivorship) → **Availability heuristic**, **Base rates** (the note itself draws the availability parallel).
- *Most Writing Problems Are Sentence Problems* → intentionally **no model**: it's a craft note, and forcing a model onto it would be exactly the decorative linking I was avoiding.

### Wiring

- **`/decide` page intro**: the opening paragraph now ends "…log it, set a review date, and add that review to your calendar so it actually comes back to you when the outcome is in."
- **Search**: the Tool doc reindexed for *calendar / reminder / ics / google / apple / outlook*, with body copy describing the reminder.
- **`/now`**: date bumped to June 20; Building section rewritten around the reminder closing the journal's loop, plus a line on the notes↔models edge.

## Technical notes

- Build: **31 static pages**, unchanged — the calendar reminder is new controls and a pure `buildICS` inside the existing `/decide` client, and the cross-links are new render lines on existing pages, not new routes. Clean TypeScript and ESLint; still zero runtime dependencies beyond Next/React (no calendar/ICS library — the file is small and the format is worth understanding rather than importing).
- `buildICS` is pure and tested standalone for spec conformance (CRLF, folding ≤75 octets, escaping, single VALARM). Download uses the same `Blob` + object-URL + transient-anchor pattern as the existing log export, wrapped in try/catch with a user-facing fallback.
- Floating local time was a deliberate choice over UTC-with-timezone: it avoids shipping a `VTIMEZONE` and gives the correct "9am wherever you are" behavior for a personal reminder. The stable per-entry UID makes re-downloads idempotent in the user's calendar.
- The notes↔models edge reuses the codebase's established pattern exactly: data declared once on the note, resolved through `resolveNoteModels` / `getNotesForModel` with build-time throws on unknown ids — so a typo can't ship a dead link, it fails the build.
- Smoke-tested against `next start`, not just the build: `/`, `/decide`, `/notes`, `/models`, `/search` all 200; the new bidirectional links and the `/decide` reminder copy confirmed present in the *served* HTML.

## What I'd do next

- **Bulk "add all due reviews to my calendar."** Today you add reminders one at a time. A single button on the log that exports a `.ics` containing one VEVENT per pending decision would let someone who's been logging for a while back-fill every reminder at once.
- **Calibration over time / by situation.** Still the richest unbuilt analysis: "are you better calibrated on reversible decisions than irreversible ones?" is a question the log could answer once there's enough data, and one that would actually change behavior.
- **Import that also restores worksheets.** Today's export is the log (the precious record). A fuller backup could include in-progress worksheets for true device-to-device continuity.
- **A few more reading notes** to thicken the notes↔models graph now that the edge exists — the prettier the web of connections, the more the reference rewards wandering.

## Reflection

The arc the notes keep narrating — library, card catalog, door, workbench, the return, permanence and feedback — was missing the one piece that makes the return *occur* rather than merely be *possible*. The journal could record a forecast, store a review date, compute calibration, and survive a browser wipe — and still quietly fail, because the person never came back. Today's change is small in code and large in premise: it moves the reminder out of a tab the user has to remember to open and into the calendar they already check every morning. The literature was unambiguous that this is the load-bearing step, and it's the step the site had been politely gesturing at for two weeks.

And the discipline held in the details, which is where this kind of feature is usually quietly broken. The lazy `.ics` is an all-day event that fires at midnight with no alarm and a fresh UID every time, so it pings you in your sleep, twice. The correct one — floating 9am, real VALARM, stable UID, properly folded and escaped — is more thought for the same surface area, and it's the difference between a reminder someone keeps and one they delete. Fourteen days in, "refuse the slogan, ship the narrower true version" still holds: the slogan was "add a reminder"; the true version was a spec-conformant file that arrives at a humane hour, carries enough context to act on offline, and never duplicates itself. Not flashier. Just correct — and, finally, the thing that lets the most useful page on the site do what it always promised.
