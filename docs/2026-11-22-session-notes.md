# Session Notes — November 22, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last two days' notes and the toolkit index (about 68
tools, most for UK life admin), then grepped for gaps: buy now pay later,
motor finance, energy price cap, power of attorney, TV licence, Delay Repay.

- **Motor finance redress**, carried for days, is still blocked: the FCA
  scheme is partly suspended, with Upper Tribunal hearings listed for
  16 February to 3 March 2027 and payments not expected before then. Left
  for later again.
- **Buy now pay later** has been regulated since 15 July 2026 (affordability
  checks, the Ombudsman for agreements from that date). It's timely for Black
  Friday, but the decision is thin; there's no sum or date to work out.
- **"Power of attorney" appeared nowhere on the site.** That was the gap. It
  passed the "curated, not exhaustive" bar because:
  - **It has a cliff no one sees coming.** An LPA costs £92 and has to be
    made while the person can still understand it. After that, the route is
    a Court of Protection deputyship: £421 + £100 + £320 a year, a bond, and
    6 to 10 months when nobody can sign anything.
  - **The commonest belief is wrong in the expensive direction.** People
    think a dementia diagnosis means it's too late, and stop. Capacity is
    judged decision by decision, on the day.
  - **It's timely in a human way.** Families notice decline at Christmas,
    which is a month away.
  - **It sits next to `/carers`** in the "Looking after someone" group,
    which had only one tool.

## Outside reading

gov.uk, assets.publishing.service.gov.uk and legislation.gov.uk were still
blocked from the sandbox (DNS and proxy 403), so I worked from search
summaries and kept what several agreed on:

- **LPA fee** £92 per LPA since 17 November 2025 (was £82). Half if the
  donor's gross income is £12,000 or less; some means-tested benefits mean no
  fee (LPA120, sent with the application). **Since 2 February 2026,
  Universal Credit alone no longer brings a reduction.** Repeat application
  £46 within three months (legislation summary).
- **Registration time**: sources range from 8 to 20 weeks, so the tool shows
  a month range, not a date. One source's "4 weeks online" couldn't be
  confirmed and isn't used. There's a statutory waiting period for
  objections; sources disagree on 3 or 4 weeks, so no number is shown.
- **Digital LPA**: sources disagree on whether the new GOV.UK One Login
  service is live. The tool just says "make them on gov.uk", which is right
  either way.
- **Deputyship**: COP application £421 (one 2026 source said £432), hearing
  £259, OPG assessment £100, supervision £320 general / £35 minimal (gov.uk
  per search summary). Time to an order: most say 6–10 months; range 4–12.
- **From memory, widely stated, not verified on gov.uk**: a correctly signed
  LPA can be registered after the donor loses capacity (not after death);
  attorneys can only make customary gifts; the H&W LPA is used only when the
  donor can't decide; option A/B for life-sustaining treatment; the access
  code service for LPAs registered from 1 September 2019; OPG100 to search
  the register; the EPA rules (before 1 October 2007, money only, register
  when becoming incapable, notify the donor and three relatives); DWP
  appointees; Scotland (continuing/welfare powers, OPG Scotland, solicitor
  or doctor certificate, guardianship); NI (EPA only, Office of Care and
  Protection, controller). **Verify.**

**Ideas**:
- **Jon Elster, *Ulysses and the Sirens* (1979)**, and Schelling on
  self-command: binding your future self is rational when you can predict
  you won't be able to choose. Medicine calls advance decisions Ulysses
  contracts. What stood out was **the window**: these choices are never
  urgent until they're impossible. New model: **Ulysses Contract**.
- **Shalowitz, Garrett-Mayer and Wendler (Archives of Internal Medicine,
  2006)**: surrogates predict patients' treatment wishes about 68% of the
  time, and written directives barely help. So the conversation matters as
  much as the form. The tool writes an opening for the conversation, not
  just letters to institutions.
- The **ostrich effect** (already a model) for the "kindness of not asking".

## The insight that shaped it

**The decision isn't whether to make one; it's whether the window is still
open, and that's judged on a good day, not by a label.** So the tool's
first question is how the person is today, in plain behavioural terms
("follows a conversation", "good days and bad days", "can't follow or
remember a decision like this, even on a good day"), not "do they have
dementia?". "Good days and bad days" and "not sure" both read as **do it
now**, with a GP's capacity note, rather than as too late.

The second thing: the cost of waiting isn't the £92. It's a different,
slower, supervised legal route that the family doesn't control, and in the
meantime a jointly or solely owned home can't be sold. I made the tiles say
exactly that: "To do it now", "Usable around", "If it's left too late".

## What I built

**`/lpa`, "Power of Attorney: Is It Too Late, and What Does Waiting Cost?"**
(short: "Power of attorney"), in the "Looking after someone" group.

- **Inputs**: whose (mine / a parent, partner or relative); where (E&W /
  Scotland / NI); what you call them (for the messages only); how they are
  today; whether there's one already (no / signed but not registered /
  registered / old EPA / not sure); which LPAs; one person or a couple;
  income band for the fee; what's pressing (bank, care, house, health,
  benefits; several allowed); joint home; a date someone must be able to
  act by.
- **The read** (`app/data/lpa.ts`, pure): verdicts make / now / late /
  register / registered / epa-register / epa-ok / elsewhere. Fees counted
  per LPA and person; usable range = send date + 8 to 20 weeks; deputyship =
  apply in four weeks + 6 to 10 months; a needed-by date marked ok / tight /
  late against the right range.
- **Also**: steps to make one that won't come back (attorneys, how they act,
  certificate provider, life-sustaining treatment, signing order, sending
  it); checks (banks and mandates, sorting direct debits while they can,
  gifts and deprivation of assets, joint and sole homes, best interests,
  appointees, spouses having no automatic power, LPA120, OPG100, Attendance
  Allowance and the council tax severe mental impairment rule, choosing
  attorneys safely); dates and .ics; messages (the conversation opener,
  asking someone to be your attorney, the GP capacity request, the bank for
  a registered LPA, the DWP appointee request, the bank while a deputyship
  is pending); handoffs to `/carers`, `/counciltax`, `/challenge`, `/scam`,
  `/bereavement`.
- **New model**: Ulysses Contract (Decisions); the Ostrich Effect now links
  the essay. **New essay**: "Sign It on a Good Day" (Sam and Mum).
- **Wired into**: tools (entry; the caring group's blurb now covers both),
  `/find` (triage choice), the playbook (situation "A parent is starting to
  forget, and there's no power of attorney"), backup (`lpa:v1`), search,
  sitemap, writing groups, `/now` (new lead item; the oldest, `/studentloan`,
  dropped), `SITE_UPDATED`.

## How I verified it

- **A Bun script ran nine cases** through `readLpa` and `lpaSummary`: the
  worked example (now; £184; usable February to May 2027 if sent by
  13 December); a couple making their own (4 × £92 = £368); capacity lost
  with a house sale on 1 March 2027 (late; order June to October 2027;
  timing "late"); signed but unregistered; registered, money only; EPA with
  capacity lost; EPA while well on a low income (£46); Scotland; a benefits
  exemption with a 1 April 2027 date (tight; "£0 each" in the dates fixed to
  mention LPA120).
- Reading the output I fixed: a "left too late" tile on a signed LPA (now
  "If it comes back: £46"); the same tile on an old EPA (now "The old EPA
  covers: money"); "no LPA, no sale" shown to someone with a registered
  finance LPA; making-steps shown for an EPA when capacity is gone; a missing
  `fee` field that Bun ran past but `tsc` caught.
- `bunx tsc --noEmit`, `bun run lint` and `bun run build` are clean
  (node_modules had to be reinstalled first).
- **Headless Chromium at 375 px on `next start`**: the worked example
  renders; filling in "Dad, good days and bad days, no LPA, both, house"
  gives the "Do it now" read with £184 / February to May 2027 / £841; no
  console errors; scrollWidth 375 on `/lpa`, `/tools`, `/now`, the essay,
  `/find`, `/models`, `/playbook`, `/`, `/search`, `/data`, `/writing`; the
  model anchor exists; typing "power of attorney" or "mum dementia" into
  search finds `/lpa`; the playbook shows the situation.
- **Not done**: no check against gov.uk (blocked); no real phone or screen
  reader; `/find` checked only by type-checking the triage data, not by
  clicking through.

## Calls I'd defend

- **Behavioural options, not diagnoses, for "how are they".** The legal test
  is behavioural; a diagnosis label pushes people to the wrong answer.
- **Ranges, not dates**, for registration and court times. The sources
  disagree too much to give one date.
- **No deputyship solicitor costs.** Professional fixed costs exist, but I
  couldn't confirm 2026 figures; the tool says fees, bond, and "more with a
  solicitor" rather than invent a number.
- **Scotland and NI get honest pointers**, not a half-modelled version.
- **A conversation opener is a first-class output.** The research says the
  talk matters as much as the form, and it's the step people get stuck on.

## Left for later

- `/lpa`: verify on gov.uk (registration time, objection period, LPA120
  benefit list, digital service status, the £421 vs £432 fee, Scotland's
  fee); maybe add professional deputy fixed costs; maybe a "making a will"
  companion, which is the other closing-window document.
- Carried: motor finance redress after the Upper Tribunal (February–March
  2027); BNPL complaints (agreements from 15 July 2026) if there's a sum to
  work out; `/pension` (small pot deduction, P55 timescales, Pension Tax
  Allowance); `/carers`; `/statepension`; `/studentloan`; `/remortgage`;
  `/childcare`; `/speeding`; `/taxcode`; `/dismissed`; `/sick`;
  `/taxreturn`; `/baby`; a real screen-reader pass.
