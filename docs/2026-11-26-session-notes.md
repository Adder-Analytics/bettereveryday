# Session Notes — November 26, 2026

## What I set out to do

Same brief: make the site useful to real people, not a self-improvement
site. I reread the last few days' notes. "Making a will" has sat in the
"Left for later" list for weeks, carried from day to day. The last week of
tools (Pension Credit, Attendance Allowance, PIP, power of attorney) built
up a "before and after" cluster with one obvious hole: what happens to
everything when you die. Nothing on the site helps anyone make a will.
`/bereavement` covers the paperwork after a death, and intestacy only
appears there as a side note. It passed the "curated, not exhaustive" bar
because:

- **It's common.** Surveys keep finding that about half of UK adults have no
  will. I didn't quote a figure on the site because I couldn't check a
  primary source.
- **The wrong belief is specific and expensive.** Unmarried couples assume
  it all goes to each other ("common-law marriage" doesn't exist in
  England and Wales). Married parents with children from an earlier
  relationship don't know the spouse takes the first £322,000. Parents of
  young children don't know nobody is named to bring them up.
- **It's timely.** Will Aid runs through November: participating
  solicitors write a basic will for a donation to charity. Today is the
  26th.
- **It sits with `/lpa` and `/bereavement`.** The group "Someone has died"
  is now **"Before and after a death"**, with `/will` first.

## Before building: checking the PIP table

Yesterday's notes asked for the Schedule 1 wording behind `/pip` to be
checked. legislation.gov.uk is still DNS-blocked (WebFetch: ENOTFOUND), so I
checked `app/data/pip.ts` line by line against my own knowledge of the
Schedule. All twelve activities, every descriptor letter and every points
value match (including mobility 1e at 10 for overwhelming psychological
distress, 1f at 12, and moving around c/d/e/f at 8/10/12/12). The 8 and 12
thresholds are right. The 2026/27 rates are 2025/26 × 1.038 (CPI), which
gives £76.70 / £114.60 / £30.30 / £80.00, matching what the site uses. Still
not checked against the text itself.

## Outside reading

gov.uk and legislation.gov.uk were blocked again, so I worked from search
results and kept what several sources agreed on:

- **Statutory legacy £322,000** for deaths from 26 July 2023 (Fixed Net Sum
  Order 2023). Several 2026 sources still give it; none reports a newer
  increase. One says "last updated February 2020", which is wrong.
- **Scotland**: the £50,000 / £89,000 cash prior rights were set in 2012
  (legislation.gov.uk amendment notes, via search). One commercial site
  gives the house and furniture limits as £473,000 and £29,000 and says the
  Trust and Succession (Scotland) Act 2024 changed things. I couldn't
  confirm that from an official source, so **the tool puts no pounds on
  Scotland**. It explains prior rights, legal rights and a cohabitant's
  six-month court claim in words.
- **Northern Ireland**: only the £450,000 (no children) figure turned up,
  from one secondary source, and nothing on the with-children figure, so
  **no pounds for NI either**. The structure (a half with one child, a
  third with more) is from memory.
- **Cohabitation reform**: the MoJ consultation "A fairer end to
  relationships" (published 5–8 June 2026, closed 14 August) asks whether
  qualifying cohabitants should get intestacy rights. Commentary mentions a
  five-year qualifying period. No timetable. The tool says "a proposal, not
  law".
- **Will Aid**: the official site suggests £120 for a single basic will and
  £200 for a pair of mirror wills. Older figures (£100/£180, £95/£150) are
  around. I used the official one.
- **From memory, not verified**: the order of entitlement and per stirpes
  representation (none for parents or grandparents); the 28-day survival
  rule; statutory trusts vesting at 18; the 1975 Act (two years of living
  together as a couple; six months from the grant); joint tenancy passing
  by survivorship; Wills Act s9 (two witnesses present at the same time),
  s15 (a witness loses a gift), s18 (marriage revokes), s18A (divorce treats
  the ex as having died); two administrators needed where a minor
  inherits; Scottish wills from 12; marriage revoking a will in NI; Free
  Wills Month in March and October for over-55s; the Land Registry £7 title
  register. **Verify on gov.uk and legislation.gov.uk.**

**Ideas**:
- **Defaults** (already a model). Johnson and Goldstein's organ donation
  result is the frame: intestacy *is* a default will, and it wins the same
  way defaults always win.
- **Terror management theory** (Greenberg, Pyszczynski and Solomon, from
  1986). We cope with mortality by not thinking about it, and the easiest
  defence is "not now". **Russell James**, "An economic model of mortality
  salience in personal financial decision making" (*Journal of Financial
  Therapy*, 2016): estate planning gets deferred in ways ordinary
  procrastination doesn't explain. **James and colleagues** (*Financial
  Services Review*, 2021, 1,771 participants): messages encouraging a
  living will worked best when they combined benefit to family with social
  norms (with mixed effects by gender, which I didn't put on the site).
  Advance-care-planning studies (Meeker and Jezewski 2005, via search) found
  that avoiding one's own mortality is a main reason people don't complete
  the documents. New model: **Mortality Salience**.

## The insight that shaped it

**Don't ask "should I make a will?" Ask "who does the one I already have
give it to?"** The first is a question about your death, with no deadline,
built to be postponed. The second is about the living and has an answer in
names and pounds. James's finding says the family framing is what moves
people. Seeing "Sam: £0" next to "Your 2 children: £90,000 each, held until
18" does more than any argument.

The second insight is that **a will is only part of it**. A home owned as
joint tenants, life insurance in trust and pension death benefits all pass
outside the will. So the read shows two lists side by side: "Without a will,
the estate goes to" and "Outside the will, whatever it says". The useful
fixes are often a free trust form from the insurer and a pension nomination,
not just the will itself.

## What I built

**`/will`, "No Will Yet: Who Would Get What, and What Would You Change?"**
(short: "Making a will").

- **Inputs**: where; relationship (married / living together / married but
  separated / single); how long together (for the 1975 Act); partner's
  name; existing will (none / current / made before marrying / made before
  a divorce / old); children, children who died leaving children, any under
  18, any from an earlier relationship, a stepchild; the closest relative if
  there's no partner and no children; the home (none / sole / joint tenants
  / tenants in common / not sure), value and mortgage; everything else;
  debts; life insurance (none / in trust / not / not sure) and amount;
  pension death benefits (nominated / not / not sure / none); what you'd
  want (six chips).
- **The read** (`app/data/will.ts`, pure): verdicts cohab / spouse-all /
  spouse-split / separated / children / kin / crown / scotland / ni, with
  "your old will was cancelled when you married" and "you have a will,
  check it" as modifiers. Tiles; the two share lists; a rough inheritance
  tax figure (spouse exemption, £325,000, £175,000 for a home left to
  children with the £2m taper, 40%); routes and costs (Will Aid, Free Wills
  Month, online, solicitor, with the reasons a solicitor is worth it for
  *you*); checks; dates with .ics; messages (notes for whoever writes it,
  an opener for your partner, asking a guardian, the pension scheme, the
  insurer); a keep list; a line to keep; handoffs to `/lpa`,
  `/bereavement`, `/pension` and `/baby`.
- **Worked example**: Jo and Sam, not married, nine years, two children,
  a joint home (£130,000 equity), £30,000 savings, £150,000 insurance not in
  trust, a pension nomination never filled in. "Without a will, Sam would get
  nothing from your £180,000 estate. It would go to your two children, held
  until they're 18." Married, Sam would get all of it.
- **New model**: Mortality Salience (Psychology). **New essay**: "The Will
  You Already Have". Defaults and Ulysses Contract now link to the essay.
- **Wired into**: tools (entry, group renamed), `/find` triage (then →
  `/lpa`), the playbook (situation "no-will-unmarried"), backup
  (`will:v1`), search, sitemap, writing groups, `/now` (new lead item; the
  oldest dropped), `SITE_UPDATED`.

## How I verified it

- **A Bun script ran fourteen cases** through `readWill` and the prose:
  the example; married with a large estate (spouse £511,000, children
  £94,500 each); married with children from an earlier relationship and a
  small estate; married without children; separated; single with nobody
  (Crown); single with siblings; cohabiting as tenants in common with
  parents as next of kin; single with two children plus a predeceased
  child's line at £2.4m (RNRB tapered to zero, IHT about £830,000);
  Scotland; NI; a current will; a will made before marrying; no money
  entered. Plus a parser round-trip and junk rejection.
- From the output I fixed: "anyone who died first is replaced by their
  children" shown for parents and grandparents (there's no representation
  there); the pension note mentioning unmarried partners for married
  people; an inheritance tax tile for the Crown; a "£0 held until 18" tile;
  a "book Will Aid" reminder dated after November ends; a solicitor line
  that listed every possible reason rather than the user's own; Will Aid
  copy that only made sense in November.
- `bunx tsc --noEmit`, eslint and `bun run build` are clean.
- **Headless Chromium at 375 px on `next start`**: the worked example
  renders. A live entry (living together, one child under 18, tenants in
  common, £300k home, £100k mortgage, £20k savings) gives "Without a will,
  Alex would get nothing from your £120,000 estate. It would go to your
  child, held until they're 18." and the tenants-in-common paragraph.
  scrollWidth is 375 on `/will`, `/tools`, `/now`, the essay, `/models`,
  `/playbook`, `/find`, `/search` and `/`. `#mortality-salience` exists. No
  console errors.
- **Not done**: no check against gov.uk or the legislation (blocked); no
  screen reader or real phone; `/find` checked by build-time id resolution
  only.

## Calls I'd defend

- **No pounds for Scotland or Northern Ireland.** The rules are different
  enough that a wrong figure would be worse than none, and I couldn't verify
  the current amounts. Words, plus where to check.
- **A rough inheritance tax figure, labelled rough.** It matters most for
  unmarried couples (no spouse exemption, and a joint home still counts), so
  leaving it out would hide the second-biggest surprise. It ignores gifts,
  a transferable band from a late spouse and pensions after April 2027, and
  says so.
- **Chattels aren't separated out.** They go to the spouse, but splitting
  them only changes the arithmetic when they're worth more than the
  estate's cash, which is rare. I noted it in the code.
- **"Joint, not sure" is treated as joint tenants** (most couples are), with
  a flag and the £7 Land Registry check.
- **Reform is mentioned once, as not law.** People read headlines about
  cohabitants' rights and conclude they can wait. The tool says don't.

## Left for later

- `/will`: verify the from-memory list above; Scottish and NI figures once
  primary sources can be reached; maybe a "mirror wills for a couple" view
  computing both deaths; the Law Commission's 2025 wills report
  (recommendations, not law) isn't mentioned yet; a printable one-page
  version of the notes.
- `/pip`: check against the Schedule's actual text when legislation.gov.uk
  is reachable (my own check found no errors); print layout of the day
  count; RH v SSWP; reg. 7's combining rule.
- `/attendance`: give it the same printable day count; the verify list.
- `/pensioncredit`: the AA-linked backdating rule, carried.
- Carried: motor finance redress after the Upper Tribunal (February–March
  2027); BNPL complaints; `/lpa` verification; `/pension`; `/carers`;
  `/statepension`; `/studentloan`; `/remortgage`; `/childcare`; `/speeding`;
  `/taxcode`; `/dismissed`; `/sick`; `/taxreturn`; `/baby` (could hand off to
  `/will` for guardians); a real screen-reader pass.
