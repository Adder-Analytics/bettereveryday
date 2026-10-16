/**
 * The split behind "Who Does Which Chore?" (/chores).
 *
 * Housework is the fair-division problem every household has and almost none
 * settles on purpose. It usually settles by drift: whoever notices first, or
 * minds mess most, ends up doing it, and each person is quietly sure they do
 * more than their share. Three findings shape the tool:
 *
 *   - Everyone overclaims. Michael Ross and Fiore Sicoly (JPSP, 1979) found
 *     that people in joint work, married couples included, take more credit
 *     for the shared work than their partners give them: your own
 *     contributions come to mind more easily than anyone else's. So the tool
 *     starts with a list, a count instead of two memories.
 *   - The work you don't see is still work. Allison Daminger (American
 *     Sociological Review, 2019) split household "cognitive labour" into
 *     anticipating needs, identifying options, deciding and monitoring, and
 *     found it often goes unseen, by the person doing it as well as their
 *     partner. So the list asks for the remembering too, and the split assigns
 *     each chore to one owner who notices when it's due.
 *   - Chores are bads, and people mind different ones. That's the opening.
 *     Fair division of chores (Spliddit's task app among others) asks each
 *     person how much each task costs *them*, and looks for a split that is
 *     equally fair to everyone by their own measure. When one of you minds
 *     cooking and the other minds the bathroom, trading lets each do less than
 *     half the housework as you each count it.
 *
 * The method. Each chore has an agreed rough time a week, and each person
 * rates how much they mind it: happy to (×0.5), fine (×1), rather not (×2),
 * hate it (×3). A person's share of a split is the time they'd spend, each
 * chore weighted by their own rating, over the same sum for all the chores.
 * Because each person's share is measured against their own total, rating
 * everything "hate it" changes nothing: only how you rank the chores counts.
 * Chores marked "take turns" are split evenly (each does it one week in n).
 * The rest go whole, to the split that makes the largest share as small as it
 * can, then the total of everyone's shares as small as it can. That is the
 * whole-chore version of Spliddit's "equitable" aim; whole chores can't always
 * reach an even share, and when they can't, the tool says so and names the one
 * chore that taking turns on would even out the most.
 *
 * Pure data and functions, no React, so the split can be checked by a script.
 */

export type Mind = "" | "happy" | "fine" | "rather" | "hate";

export type Person = {
  /** Stable id for keys and ratings; never shown. */
  id: string;
  name: string;
};

export type Chore = {
  id: string;
  name: string;
  /** Rough time a week, as typed: "30", "1h 30m", "90 min". */
  minutes: string;
  /** Take turns on this one, rather than giving it to one person. */
  turns: boolean;
  /** Who does it now: a person id, "shared", or "" (not said). */
  now: string;
  /** How much each person minds it, by person id. */
  mind: Record<string, Mind>;
};

export type ChoresInputs = { people: Person[]; chores: Chore[] };

export const MAX_PEOPLE = 5;
export const MAX_CHORES = 15;

export const WEIGHT: Record<Exclude<Mind, "">, number> = {
  happy: 0.5,
  fine: 1,
  rather: 2,
  hate: 3,
};

export const MIND_LABEL: Record<Exclude<Mind, "">, string> = {
  happy: "Happy to",
  fine: "Fine",
  rather: "Rather not",
  hate: "Hate it",
};

export function blankChore(id: string, name = ""): Chore {
  return { id, name, minutes: "", turns: false, now: "", mind: {} };
}

export const BLANK_CHORES: ChoresInputs = {
  people: [
    { id: "p1", name: "" },
    { id: "p2", name: "" },
  ],
  chores: [blankChore("c1")],
};

/** A fresh id with this prefix that isn't taken. */
export function nextId(prefix: string, taken: { id: string }[]): string {
  const ids = new Set(taken.map((t) => t.id));
  let n = taken.length + 1;
  while (ids.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

/**
 * Minutes a week from what was typed: "30", "45 min", "1h", "1h 30m",
 * "1.5 hours", "2:15". Null when it can't be read or isn't positive.
 */
export function parseMinutes(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/\s*(a|per|each)\s*week$/, "").replace(/\s*\/\s*w(ee)?k$/, "");
  if (!s) return null;
  let m: RegExpMatchArray | null;
  if ((m = s.match(/^(\d+):(\d{1,2})$/))) {
    const v = Number(m[1]) * 60 + Number(m[2]);
    return v > 0 ? v : null;
  }
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*(m|mins?|minutes?)?$/))) {
    const v = Number(m[1]);
    return v > 0 ? v : null;
  }
  if ((m = s.match(/^(\d+(?:\.\d+)?)\s*(h|hrs?|hours?)(?:\s*(\d+)\s*(m|mins?|minutes?)?)?$/))) {
    const v = Number(m[1]) * 60 + (m[3] ? Number(m[3]) : 0);
    return v > 0 ? v : null;
  }
  return null;
}

export function minutesInvalid(raw: string): boolean {
  return raw.trim() !== "" && parseMinutes(raw) === null;
}

/** "45 min", "2h", "2h 40m". */
export function formatMinutes(mins: number): string {
  const total = Math.round(mins);
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** A person's name for display, never blank. */
export function personName(inp: ChoresInputs, id: string): string {
  const i = inp.people.findIndex((p) => p.id === id);
  if (i < 0) return "Someone";
  return inp.people[i].name.trim() || `Person ${i + 1}`;
}

/** A chore's name for display, never blank. */
export function choreName(c: Chore, index: number): string {
  return c.name.trim().replace(/[.!?\s]+$/, "") || `Chore ${index + 1}`;
}

/** How much this person minds this chore, as a weight; unrated counts as fine. */
export function weightOf(c: Chore, personId: string): number {
  const m = c.mind[personId];
  return m ? WEIGHT[m] : 1;
}

/** Chores with a usable time, in list order, with their index kept for names. */
export function countedChores(inp: ChoresInputs): { chore: Chore; index: number; mins: number }[] {
  const out: { chore: Chore; index: number; mins: number }[] = [];
  inp.chores.forEach((chore, index) => {
    const mins = parseMinutes(chore.minutes);
    if (mins !== null) out.push({ chore, index, mins });
  });
  return out;
}

/** Ratings still to give, among chores with a time. */
export function missingRatings(inp: ChoresInputs): number {
  let n = 0;
  for (const { chore } of countedChores(inp)) {
    for (const p of inp.people) if (!chore.mind[p.id]) n++;
  }
  return n;
}

export type Owner = string | "turns";

export type Search = {
  /** Owner per counted chore, by chore id. */
  owner: Record<string, Owner>;
  /** Each person's share as they count it, 0–1, by person id. */
  share: Record<string, number>;
  /** The largest share. */
  worst: number;
  /** False only if the search hit its step limit before proving the best. */
  exact: boolean;
};

/**
 * The best whole-chore split: smallest largest share, then smallest total of
 * shares. Branch and bound over the chores that aren't taken in turns, biggest
 * first, from a greedy start. Returns null with fewer than two people or no
 * timed chores.
 */
export function bestSplit(inp: ChoresInputs, turnsOverride?: Set<string>, limit = 1_500_000): Search | null {
  const people = inp.people;
  const n = people.length;
  const counted = countedChores(inp);
  if (n < 2 || counted.length === 0) return null;

  // cost[p][k]: person p's weighted minutes for counted chore k.
  const cost = people.map((p) => counted.map(({ chore, mins }) => mins * weightOf(chore, p.id)));
  const total = cost.map((row) => row.reduce((a, b) => a + b, 0));
  // inc[p][k]: what chore k adds to person p's share.
  const inc = cost.map((row, p) => row.map((v) => v / total[p]));

  const isTurns = (k: number) =>
    turnsOverride ? turnsOverride.has(counted[k].chore.id) : counted[k].chore.turns;

  const base = new Array<number>(n).fill(0);
  const free: number[] = [];
  counted.forEach((_, k) => {
    if (isTurns(k)) for (let p = 0; p < n; p++) base[p] += inc[p][k] / n;
    else free.push(k);
  });
  // Biggest, most contested chores first: they decide the most.
  free.sort((a, b) => Math.max(...inc.map((r) => r[b])) - Math.max(...inc.map((r) => r[a])));

  // Lower bound on what the remaining chores add to the total of shares.
  const restMin = new Array<number>(free.length + 1).fill(0);
  for (let d = free.length - 1; d >= 0; d--) {
    const k = free[d];
    restMin[d] = restMin[d + 1] + Math.min(...inc.map((r) => r[k]));
  }

  const EPS = 1e-9;
  const load = base.slice();
  const pick = new Array<number>(free.length).fill(0);

  // Greedy start: each chore to whoever it raises least, judged by the new
  // largest share, then by their own new share.
  let bestPick = new Array<number>(free.length).fill(0);
  let bestWorst = 0;
  let bestSum = 0;
  {
    const l = base.slice();
    free.forEach((k, d) => {
      let bp = 0;
      let bw = Infinity;
      let bo = Infinity;
      for (let p = 0; p < n; p++) {
        const own = l[p] + inc[p][k];
        let w = own;
        for (let q = 0; q < n; q++) if (q !== p && l[q] > w) w = l[q];
        if (w < bw - EPS || (Math.abs(w - bw) <= EPS && own < bo)) {
          bp = p;
          bw = w;
          bo = own;
        }
      }
      l[bp] += inc[bp][k];
      bestPick[d] = bp;
    });
    bestWorst = Math.max(...l);
    bestSum = l.reduce((a, b) => a + b, 0);
  }

  let steps = 0;
  let exact = true;
  const dfs = (d: number, curMax: number, curSum: number) => {
    if (++steps > limit) {
      exact = false;
      return;
    }
    const sumLB = curSum + restMin[d];
    const maxLB = Math.max(curMax, sumLB / n);
    if (maxLB > bestWorst + EPS) return;
    if (maxLB >= bestWorst - EPS && sumLB >= bestSum - EPS) return;
    if (d === free.length) {
      bestWorst = curMax;
      bestSum = curSum;
      bestPick = pick.slice();
      return;
    }
    const k = free[d];
    // Try the people this chore costs least first.
    const order = Array.from({ length: n }, (_, p) => p).sort((a, b) => load[a] + inc[a][k] - (load[b] + inc[b][k]));
    for (const p of order) {
      if (!exact) return;
      load[p] += inc[p][k];
      pick[d] = p;
      dfs(d + 1, Math.max(curMax, load[p]), curSum + inc[p][k]);
      load[p] -= inc[p][k];
    }
  };
  dfs(0, Math.max(...base), base.reduce((a, b) => a + b, 0));

  const owner: Record<string, Owner> = {};
  const finalLoad = base.slice();
  counted.forEach(({ chore }, k) => {
    if (isTurns(k)) owner[chore.id] = "turns";
  });
  free.forEach((k, d) => {
    const p = bestPick[d];
    owner[counted[k].chore.id] = people[p].id;
    finalLoad[p] += inc[p][k];
  });
  const share: Record<string, number> = {};
  people.forEach((p, i) => (share[p.id] = finalLoad[i]));
  return { owner, share, worst: Math.max(...finalLoad), exact };
}

export type PersonRead = {
  id: string;
  name: string;
  /** Chores they own, in list order. */
  owns: string[];
  /** Their share as they count it, 0–1. */
  share: number;
  /** Minutes a week, their own chores plus their turn of the shared ones. */
  minutes: number;
  /** Minutes a week now, by the "who does it now" answers; null if none given. */
  nowMinutes: number | null;
  /** Names of people whose list this person would rather have, by their own count. */
  envies: string[];
};

export type ChoresRead = {
  people: PersonRead[];
  /** Names of chores taken in turns. */
  turns: string[];
  /** Each person's even share: 1/n. */
  fair: number;
  worst: number;
  /** Whether everyone is at or under their even share. */
  even: boolean;
  /** When not even: the chore whose turns would even it out most, and the new worst. */
  suggest: { chore: string; worst: number } | null;
  totalMinutes: number;
  missing: number;
  exact: boolean;
};

/** The whole read, or null while there aren't two people and a timed chore. */
export function readChores(inp: ChoresInputs): ChoresRead | null {
  const best = bestSplit(inp);
  if (!best) return null;
  const n = inp.people.length;
  const counted = countedChores(inp);
  const fair = 1 / n;
  const SLACK = 0.005;

  const turns = counted.filter(({ chore }) => best.owner[chore.id] === "turns").map(({ chore, index }) => choreName(chore, index));
  const totalMinutes = counted.reduce((a, c) => a + c.mins, 0);
  const anyNow = counted.some(({ chore }) => chore.now !== "");

  // Weighted cost of each person's bundle, judged by each person.
  const bundleCost = (judge: string, holder: string) =>
    counted.reduce(
      (a, { chore, mins }) => (best.owner[chore.id] === holder ? a + mins * weightOf(chore, judge) : a),
      0,
    );

  const people: PersonRead[] = inp.people.map((p) => {
    const owns = counted.filter(({ chore }) => best.owner[chore.id] === p.id);
    const minutes =
      owns.reduce((a, c) => a + c.mins, 0) +
      counted.filter(({ chore }) => best.owner[chore.id] === "turns").reduce((a, c) => a + c.mins / n, 0);
    let nowMinutes: number | null = null;
    if (anyNow) {
      nowMinutes = counted.reduce((a, { chore, mins }) => {
        if (chore.now === p.id) return a + mins;
        if (chore.now === "shared") return a + mins / n;
        return a;
      }, 0);
    }
    const mine = bundleCost(p.id, p.id);
    const envies = inp.people
      .filter((q) => q.id !== p.id && bundleCost(p.id, q.id) < mine - 1e-6)
      .map((q) => personName(inp, q.id));
    return {
      id: p.id,
      name: personName(inp, p.id),
      owns: owns.map(({ chore, index }) => choreName(chore, index)),
      share: best.share[p.id],
      minutes,
      nowMinutes,
      envies,
    };
  });

  const even = best.worst <= fair + SLACK;
  let suggest: ChoresRead["suggest"] = null;
  if (!even) {
    const already = new Set(counted.filter(({ chore }) => chore.turns).map(({ chore }) => chore.id));
    let bestW = best.worst;
    for (const { chore, index } of counted) {
      if (already.has(chore.id)) continue;
      const trial = bestSplit(inp, new Set([...already, chore.id]), 150_000);
      if (trial && trial.worst < bestW - 0.01) {
        bestW = trial.worst;
        suggest = { chore: choreName(chore, index), worst: trial.worst };
      }
    }
  }

  return {
    people,
    turns,
    fair,
    worst: best.worst,
    even,
    suggest,
    totalMinutes,
    missing: missingRatings(inp),
    exact: best.exact,
  };
}

/** A share as a whole percentage. */
export function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}

/** The answer in one sentence: printed largest and spoken. */
export function choresHeadline(inp: ChoresInputs, read: ChoresRead | null = readChores(inp)): string | null {
  if (!read) return null;
  if (read.even) {
    const each = inp.people.length === 2 ? "Each of you" : `Each of the ${inp.people.length} of you`;
    return `${each} does at most ${pct(read.worst)} of the housework, as you each count it.`;
  }
  const top = read.people.reduce((a, b) => (b.share > a.share ? b : a));
  return `Whole chores won't split evenly here: ${top.name} ends up with ${pct(top.share)}, as ${top.name} counts it.`;
}

/** The sentence under the headline that says what the number means. */
export function choresWhy(inp: ChoresInputs, read: ChoresRead): string {
  const n = inp.people.length;
  const fairText = pct(read.fair);
  if (read.even && read.worst < read.fair - 0.04) {
    return `An even share would be ${fairText} each. You come in under it because you mind different chores: each one goes to whoever minds it least, so every hour costs the household less.`;
  }
  if (read.even) {
    return `An even share would be ${fairText} each, and that's what this split gives you. You mind mostly the same chores, so there's little to trade.`;
  }
  const fix = read.suggest
    ? ` Taking turns on ${read.suggest.chore} brings the largest share down to ${pct(read.suggest.worst)}.`
    : n === 2
      ? " One chore is too big to place fairly whole: take turns on it, or split it into parts."
      : " Taking turns on one of the big chores, or splitting it into parts, would even it out.";
  return `An even share would be ${fairText} each. Whole chores can't get closer than this on your ratings.${fix}`;
}

/** The standing rule: the part of the answer to keep. */
export function choresRule(): string {
  return "Our line for chores: every chore has one owner, who notices when it's due and does it without being asked. Helping isn't owning. We look at the list again in a month, and whenever someone's life changes.";
}

/** Plain text to send the house. */
export function choresSummary(inp: ChoresInputs, read: ChoresRead | null = readChores(inp)): string {
  if (!read) return "";
  const lines: string[] = [];
  const head = choresHeadline(inp, read);
  if (head) lines.push(head, "");
  for (const p of read.people) {
    const owns = p.owns.length ? p.owns.join(", ") : "nothing on their own";
    lines.push(`${p.name}: ${owns} (about ${formatMinutes(p.minutes)} a week)`);
  }
  if (read.turns.length) lines.push(`Taking turns: ${read.turns.join(", ")}`);
  lines.push("", choresRule());
  return lines.join("\n");
}

/** A short subject for the decision list. */
export function choresSubject(inp: ChoresInputs): string | null {
  const names = inp.people.map((p) => p.name.trim()).filter(Boolean);
  const chores = inp.chores.filter((c) => c.name.trim()).length;
  if (names.length === 0 && chores === 0) return null;
  const who = names.length ? names.join(", ") : `${inp.people.length} people`;
  return `Chores: ${who}${chores ? ` (${chores} chore${chores === 1 ? "" : "s"})` : ""}`;
}

const MINDS: Mind[] = ["happy", "fine", "rather", "hate"];

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseChoresInputs(raw: unknown): ChoresInputs {
  if (!raw || typeof raw !== "object") return BLANK_CHORES;
  const v = raw as Record<string, unknown>;
  if (!Array.isArray(v.people) || !Array.isArray(v.chores)) return BLANK_CHORES;
  const str = (o: Record<string, unknown>, k: string) => (typeof o[k] === "string" ? (o[k] as string) : "");

  const people: Person[] = [];
  for (const item of v.people.slice(0, MAX_PEOPLE)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    let id = str(o, "id");
    if (!id || people.some((p) => p.id === id) || id === "shared") id = nextId("p", people);
    people.push({ id, name: str(o, "name") });
  }
  while (people.length < 2) people.push({ id: nextId("p", people), name: "" });
  const pids = new Set(people.map((p) => p.id));

  const chores: Chore[] = [];
  for (const item of v.chores.slice(0, MAX_CHORES)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    let id = str(o, "id");
    if (!id || chores.some((c) => c.id === id)) id = nextId("c", chores);
    const mind: Record<string, Mind> = {};
    if (o.mind && typeof o.mind === "object") {
      for (const [k, m] of Object.entries(o.mind as Record<string, unknown>)) {
        if (pids.has(k) && typeof m === "string" && (MINDS as string[]).includes(m)) mind[k] = m as Mind;
      }
    }
    const now = str(o, "now");
    chores.push({
      id,
      name: str(o, "name"),
      minutes: str(o, "minutes"),
      turns: o.turns === true,
      now: now === "shared" || pids.has(now) ? now : "",
      mind,
    });
  }
  return { people, chores: chores.length ? chores : [blankChore("c1")] };
}

/**
 * The worked example: a couple whose split settled by drift. Alex cooks and
 * does most of the rest; Sam does the laundry and the bins. Rated, it turns
 * out they mind nearly opposite things.
 */
export const CHORES_EXAMPLE: ChoresInputs = {
  people: [
    { id: "p1", name: "Alex" },
    { id: "p2", name: "Sam" },
  ],
  chores: [
    { id: "c1", name: "Cooking", minutes: "3h 30m", turns: false, now: "p1", mind: { p1: "happy", p2: "rather" } },
    { id: "c2", name: "Washing up", minutes: "1h 45m", turns: false, now: "p1", mind: { p1: "rather", p2: "fine" } },
    { id: "c3", name: "Food shop and meal plan", minutes: "1h", turns: false, now: "p1", mind: { p1: "fine", p2: "hate" } },
    { id: "c4", name: "Laundry", minutes: "1h 30m", turns: false, now: "p2", mind: { p1: "fine", p2: "happy" } },
    { id: "c5", name: "Hoovering and floors", minutes: "40", turns: false, now: "p1", mind: { p1: "hate", p2: "fine" } },
    { id: "c6", name: "Bathroom", minutes: "45", turns: true, now: "p1", mind: { p1: "hate", p2: "hate" } },
    { id: "c7", name: "Bins and recycling", minutes: "15", turns: false, now: "p2", mind: { p1: "fine", p2: "fine" } },
    { id: "c8", name: "Bills, bookings and birthdays", minutes: "30", turns: false, now: "p1", mind: { p1: "rather", p2: "happy" } },
  ],
};
