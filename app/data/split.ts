/**
 * The read behind "Who Gets Which Room?" (/split).
 *
 * Housemates moving into a place whose rooms aren't equal: one has the en
 * suite, one is the box room over the stairs. Splitting the rent equally is
 * only fair if everyone wants a different room. Splitting by floor area prices
 * one thing (size) and ignores the light, the noise and the bathroom. And
 * haggling it out at the kitchen table hands the answer to whoever speaks
 * first or minds least.
 *
 * Fair division has a clean answer to this, and it has been used for real:
 *
 *   - Francis Su, "Rental Harmony: Sperner's Lemma in Fair Division" (American
 *     Mathematical Monthly 106(10), 1999) showed that under mild assumptions
 *     there is always a split of the rent at which every housemate prefers a
 *     different room: an envy-free division.
 *   - Spliddit (Goldman & Procaccia, SIGecom Exchanges, 2014) put it online.
 *     Each person says what each room is worth to them, with their numbers
 *     adding up to the whole rent. Rooms go to the assignment that makes the
 *     most of everyone's numbers, and there are always prices that leave
 *     nobody wanting to swap.
 *   - Gal, Mash, Procaccia & Zick, "Which Is the Fairest (Rent Division) of
 *     Them All?" (EC 2016; JACM 2017) found envy-freeness alone allows
 *     lopsided splits, and that Spliddit users rated the split that does best
 *     by the worst-off person as clearly fairer than an arbitrary envy-free one.
 *   - Peters, Procaccia & Zhu, "Robust Rent Division" (NeurIPS 2022): people's
 *     numbers are rough (they've seen the rooms for ten minutes), so prefer
 *     prices that stay envy-free even if everyone's numbers are a bit off.
 *
 * This module does that, small enough to check by hand. With each person's
 * numbers summing to the rent:
 *
 *   1. Rooms go to the assignment with the biggest total of everyone's numbers
 *      for the room they get (brute force; at most 6 people, so 720 tries).
 *   2. Prices make each person prefer their own room-at-its-price to every
 *      other by the widest margin the numbers allow. That margin is the
 *      tightest "rotate the rooms round a loop" trade, averaged over the loop
 *      (every simple cycle, at most 409 of them).
 *   3. Within that, everyone gets an equal share of what's left: the gap
 *      between what the rooms are worth to the people in them and the rent.
 *
 * Step 2 only gives up surplus if it can do so without pushing anyone below
 * what step 3 alone would leave the worst-off person, so the robustness never
 * costs the person doing worst.
 *
 * Only the gaps between one person's numbers matter, not their level: adding
 * the same amount to all of one person's rooms changes nothing. So a row that
 * doesn't add up to the rent is evened out by spreading the difference across
 * that person's rooms, and the tool says so.
 *
 * Pure data and functions, no React, so the read can be checked by a script.
 */

import { formatMoney, parseMoney } from "./worth";

export const MIN_PEOPLE = 2;
export const MAX_PEOPLE = 6;

export type SplitInputs = {
  /** What's being split, e.g. "The flat on Elm Road". The carried subject. */
  what: string;
  /** The rent for the whole place, per month (or whatever period you pay). */
  rent: string;
  /** One name per housemate. */
  people: string[];
  /** One label per room, same count as people. */
  rooms: string[];
  /** bids[person][room]: what that room is worth to that person. */
  bids: string[][];
  /** Whether each person has locked in their numbers. */
  locked: boolean[];
};

export function blankSplit(n = 3): SplitInputs {
  return {
    what: "",
    rent: "",
    people: Array.from({ length: n }, () => ""),
    rooms: Array.from({ length: n }, () => ""),
    bids: Array.from({ length: n }, () => Array.from({ length: n }, () => "")),
    locked: Array.from({ length: n }, () => false),
  };
}

export const BLANK_SPLIT: SplitInputs = blankSplit(3);

/** Change the number of housemates (and rooms), keeping what's there. */
export function resize(inp: SplitInputs, n: number): SplitInputs {
  const k = Math.max(MIN_PEOPLE, Math.min(MAX_PEOPLE, Math.round(n)));
  const fit = <T>(arr: T[], fill: () => T) =>
    Array.from({ length: k }, (_, i) => (i < arr.length ? arr[i] : fill()));
  return {
    ...inp,
    people: fit(inp.people, () => ""),
    rooms: fit(inp.rooms, () => ""),
    bids: fit(inp.bids, () => [] as string[]).map((row) => fit(row, () => "")),
    // Changing the rooms changes what everyone was valuing, so unlock all.
    locked: k === inp.people.length ? inp.locked : Array.from({ length: k }, () => false),
  };
}

export function personName(inp: SplitInputs, i: number): string {
  return inp.people[i]?.trim() || `Person ${i + 1}`;
}

export function roomName(inp: SplitInputs, r: number): string {
  return inp.rooms[r]?.trim() || `Room ${String.fromCharCode(65 + r)}`;
}

export function splitCurrency(inp: SplitInputs): string {
  const m = [inp.rent, ...inp.bids.flat()].join(" ").match(/[£$€]/);
  return m ? m[0] : "£";
}

/** True when the rent has pence/cents, so prices are rounded to them too. */
function rentDecimals(rent: number): number {
  return Math.abs(rent - Math.round(rent)) > 1e-9 ? 2 : 0;
}

export function money(n: number, cur: string, decimals = 0): string {
  if (decimals === 0) return formatMoney(Math.round(n), cur);
  const sign = n < 0 ? "-" : "";
  return `${sign}${cur}${Math.abs(n).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** One person's row: parsed numbers, or null while any is missing or bad. */
export function parseRow(row: string[]): number[] | null {
  const out: number[] = [];
  for (const raw of row) {
    const v = parseMoney(raw);
    if (v === null) return null;
    out.push(v);
  }
  return out;
}

/** How far a row is from adding up to the rent (positive: left to place). */
export function rowGap(row: string[], rent: number): number | null {
  const v = parseRow(row);
  if (!v) return null;
  return rent - v.reduce((a, b) => a + b, 0);
}

/** Spread the gap evenly across a row: harmless, since only gaps count. */
export function evenOut(v: number[], rent: number): number[] {
  const gap = (rent - v.reduce((a, b) => a + b, 0)) / v.length;
  return v.map((x) => x + gap);
}

/** The same, rounded the way the rent is, still adding up to it exactly. */
export function evenOutRounded(v: number[], rent: number): number[] {
  return roundToRent(evenOut(v, rent), rent, rentDecimals(rent));
}

// ---------------------------------------------------------------------------
// The maths
// ---------------------------------------------------------------------------

function permutations(n: number): number[][] {
  const out: number[][] = [];
  const cur: number[] = [];
  const used = Array<boolean>(n).fill(false);
  const go = () => {
    if (cur.length === n) {
      out.push([...cur]);
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(i);
      go();
      cur.pop();
      used[i] = false;
    }
  };
  go();
  return out;
}

/** Every simple directed cycle on n nodes (length ≥ 2), each listed once. */
function cycles(n: number): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const on = Array<boolean>(n).fill(false);
  // Each cycle is listed from its smallest node, visiting only larger ones.
  const go = (start: number) => {
    if (path.length >= 2) out.push([...path]);
    for (let next = start + 1; next < n; next++) {
      if (on[next]) continue;
      on[next] = true;
      path.push(next);
      go(start);
      path.pop();
      on[next] = false;
    }
  };
  for (let s = 0; s < n; s++) {
    on[s] = true;
    path.push(s);
    go(s);
    path.pop();
    on[s] = false;
  }
  return out;
}

/**
 * The welfare-maximising assignment: room[i] for person i. Also how many
 * assignments tie for best, since a tie means two of you are interchangeable.
 */
export function bestAssignment(v: number[][]): { room: number[]; total: number; ties: number } {
  const n = v.length;
  let best: number[] = [];
  let total = -Infinity;
  let ties = 0;
  const tol = 1e-6 * Math.max(1, ...v.flat().map(Math.abs));
  for (const p of permutations(n)) {
    let s = 0;
    for (let i = 0; i < n; i++) s += v[i][p[i]];
    if (s > total + tol) {
      total = s;
      best = p;
      ties = 1;
    } else if (Math.abs(s - total) <= tol) {
      ties++;
    }
  }
  return { room: best, total, ties };
}

/**
 * Least non-negative h with h[i] ≥ h[j] + w[i][j] + s for every i ≠ j
 * (longest paths). The no-envy constraints, with slack s, in utility terms.
 */
function leastPotentials(w: number[][], s: number): number[] {
  const n = w.length;
  const h = Array<number>(n).fill(0);
  for (let pass = 0; pass <= n; pass++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const need = h[j] + w[i][j] + s;
        if (need > h[i] + 1e-9) {
          h[i] = need;
          moved = true;
        }
      }
    }
    if (!moved) break;
  }
  return h;
}

export type Placement = {
  person: number;
  room: number;
  price: number;
  /** What the room is worth to them, after evening out. */
  worth: number;
  /** How much more they like their own deal than the next best one. */
  margin: number;
  /** The room they'd like next best at these prices. */
  nextRoom: number;
};

export type SplitKind = "clear" | "close" | "tie";

export type SplitRead = {
  kind: SplitKind;
  rent: number;
  decimals: number;
  /** Placements in person order. */
  placements: Placement[];
  /** The smallest margin anyone has. */
  margin: number;
  /** Who has it. */
  tightest: number;
  /** Rows that didn't add up to the rent and were evened out. */
  evened: number[];
  /** Rooms more than one person likes best (an equal split fails on these). */
  clashes: { room: number; people: number[] }[];
  /** True when everyone's favourite room is different. */
  equalWorks: boolean;
  /** Any price below zero (someone is paid to take a room). */
  negative: boolean;
  /** Other room assignments that score just as well. */
  ties: number;
};

/** Under this margin, a swap is a near thing: about 1% of the rent. */
export function closeLine(rent: number): number {
  return Math.max(1, rent * 0.01);
}

/**
 * Round prices to whole units (or pence) so they add up exactly to the
 * rent, moving the rounding where it's smallest (largest remainder).
 */
function roundToRent(prices: number[], rent: number, decimals: number): number[] {
  const f = 10 ** decimals;
  const scaled = prices.map((p) => p * f);
  const floor = scaled.map(Math.floor);
  let left = Math.round(rent * f) - floor.reduce((a, b) => a + b, 0);
  const order = scaled
    .map((x, i) => ({ i, r: x - Math.floor(x) }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  const out = [...floor];
  for (let k = 0; left > 0 && k < 10 * order.length; k++, left--) out[order[k % order.length].i]++;
  for (let k = 0; left < 0 && k < 10 * order.length; k++, left++) out[order[order.length - 1 - (k % order.length)].i]--;
  return out.map((x) => x / f);
}

/**
 * The read, or null until the rent is set and everyone has locked in a full
 * row of numbers.
 */
export function readSplit(inp: SplitInputs): SplitRead | null {
  const rent = parseMoney(inp.rent);
  const n = inp.people.length;
  if (rent === null || rent <= 0 || n < MIN_PEOPLE || n > MAX_PEOPLE) return null;
  if (inp.rooms.length !== n || inp.bids.length !== n) return null;
  if (!inp.locked.every(Boolean)) return null;
  const raw: number[][] = [];
  for (const row of inp.bids) {
    if (row.length !== n) return null;
    const v = parseRow(row);
    if (!v) return null;
    raw.push(v);
  }
  const decimals = rentDecimals(rent);
  const evened: number[] = [];
  const v = raw.map((row, i) => {
    const gap = rent - row.reduce((a, b) => a + b, 0);
    if (Math.abs(gap) >= 0.5 / 10 ** decimals) evened.push(i);
    return evenOut(row, rent);
  });

  // 1. Rooms.
  const { room, total, ties } = bestAssignment(v);

  // 2. The widest no-swap margin: w[i][j] is how much i would gain (in their
  // own numbers) from j's room over j's own valuation of it.
  const w = v.map((_, i) => v.map((__, j) => (i === j ? 0 : v[i][room[j]] - v[j][room[j]])));
  let sMax = Infinity;
  for (const c of cycles(n)) {
    let sum = 0;
    for (let k = 0; k < c.length; k++) sum += w[c[k]][c[(k + 1) % c.length]];
    sMax = Math.min(sMax, -sum / c.length);
  }
  if (!Number.isFinite(sMax) || sMax < 0) sMax = 0;

  // 3. Share what's left equally. Back the margin off if it would push the
  // worst-off below what no margin at all would leave them.
  const surplus = total - rent;
  const floorU = (s: number) => (surplus - leastPotentials(w, s).reduce((a, b) => a + b, 0)) / n;
  const target = Math.min(0, floorU(0));
  let s = sMax;
  if (floorU(sMax) < target - 1e-9) {
    let lo = 0;
    let hi = sMax;
    for (let k = 0; k < 50; k++) {
      const mid = (lo + hi) / 2;
      if (floorU(mid) >= target - 1e-9) lo = mid;
      else hi = mid;
    }
    s = lo;
  }
  const h = leastPotentials(w, s);
  const share = (surplus - h.reduce((a, b) => a + b, 0)) / n;
  const exact = v.map((row, i) => row[room[i]] - (h[i] + share));
  const priced = roundToRent(exact, rent, decimals);

  // Price of each room, then everyone's margin at the rounded prices.
  const priceOf = Array<number>(n).fill(0);
  room.forEach((r, i) => (priceOf[r] = priced[i]));
  const placements: Placement[] = v.map((row, i) => {
    const own = row[room[i]] - priceOf[room[i]];
    let margin = Infinity;
    let nextRoom = room[i];
    for (let r = 0; r < n; r++) {
      if (r === room[i]) continue;
      const d = own - (row[r] - priceOf[r]);
      if (d < margin) {
        margin = d;
        nextRoom = r;
      }
    }
    return { person: i, room: room[i], price: priceOf[room[i]], worth: row[room[i]], margin, nextRoom };
  });
  let tightest = 0;
  placements.forEach((p, i) => {
    if (p.margin < placements[tightest].margin) tightest = i;
  });
  const margin = placements[tightest].margin;

  // An equal split works only if everyone's favourite room is different.
  const favs = v.map((row) => {
    const top = Math.max(...row);
    return row.map((x, r) => (Math.abs(x - top) < 1e-9 ? r : -1)).filter((r) => r >= 0);
  });
  // Clashes count only people with one clear favourite; someone who likes two
  // rooms equally doesn't mind which.
  const clashes: { room: number; people: number[] }[] = [];
  for (let r = 0; r < n; r++) {
    const who = favs.map((f, i) => (f.length === 1 && f[0] === r ? i : -1)).filter((i) => i >= 0);
    if (who.length > 1) clashes.push({ room: r, people: who });
  }
  const equalWorks = permutations(n).some((p) => p.every((r, i) => favs[i].includes(r)));

  const kind: SplitKind = ties > 1 || margin < 0.5 / 10 ** decimals ? "tie" : margin < closeLine(rent) ? "close" : "clear";

  return {
    kind,
    rent,
    decimals,
    placements,
    margin: Math.max(0, margin),
    tightest,
    evened,
    clashes,
    equalWorks,
    negative: priced.some((p) => p < 0),
    ties,
  };
}

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

function list(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function splitHeadline(inp: SplitInputs, read: SplitRead): string {
  const cur = splitCurrency(inp);
  const m = money(read.margin, cur, read.decimals);
  switch (read.kind) {
    case "clear":
      return `Nobody would swap. Each of you prefers your own room by at least ${m}.`;
    case "close":
      return `Nobody would swap, but it's close for ${personName(inp, read.tightest)}.`;
    case "tie":
      return "Nobody would swap, but two of you could trade rooms and be just as happy.";
  }
}

/** One line per person, for the copied text and the screen reader. */
export function placementLine(inp: SplitInputs, read: SplitRead, p: Placement): string {
  const cur = splitCurrency(inp);
  return `${personName(inp, p.person)}: ${roomName(inp, p.room)}, ${money(p.price, cur, read.decimals)}`;
}

export function tightestSentence(inp: SplitInputs, read: SplitRead): string {
  const cur = splitCurrency(inp);
  const p = read.placements[read.tightest];
  const who = personName(inp, p.person);
  const next = roomName(inp, p.nextRoom);
  if (read.kind === "tie") {
    return `At these prices ${who} would be as happy with ${next} as with ${roomName(inp, p.room)}. Your numbers can't separate you, so settle it some other way: a coin, or let whoever cares more choose.`;
  }
  return `The nearest thing to a swap: ${who} would need ${next} to be ${money(p.margin, cur, read.decimals)} cheaper before they'd rather have it.`;
}

export function equalSentence(inp: SplitInputs, read: SplitRead): string {
  const cur = splitCurrency(inp);
  const n = read.placements.length;
  const each = money(read.rent / n, cur, Number.isInteger(read.rent / n) ? 0 : 2);
  if (read.equalWorks) {
    return `Each of you can have a room you like best, so an equal split (${each} each) would also leave nobody wanting to swap. If it's simpler to say yes to, it's a fair choice too.`;
  }
  if (read.clashes.length === 0) {
    return `An equal split (${each} each) wouldn't settle it: at the same price, more of you would want the same rooms than there are rooms to go round.`;
  }
  const msg = read.clashes
    .map(
      (c) =>
        `${list(c.people.map((i) => personName(inp, i)))} would ${c.people.length === 2 ? "both" : "all"} take ${roomName(inp, c.room)}`,
    )
    .join("; ");
  return `An equal split (${each} each) wouldn't settle it: at the same price, ${msg}. Someone would end up in a room they like less, paying the same.`;
}

export function splitSummary(inp: SplitInputs, read: SplitRead): string {
  const cur = splitCurrency(inp);
  const lines = [
    `How we're splitting ${money(read.rent, cur, read.decimals)}${inp.what.trim() ? ` for ${inp.what.trim()}` : ""}:`,
    ...read.placements.map((p) => `- ${placementLine(inp, read, p)}`),
    "",
    "Each of us said privately what every room was worth to us, with our numbers adding up to the whole rent. Rooms went to whoever valued them most as a set, and the prices are the ones at which nobody would rather swap.",
    read.kind === "tie" ? tightestSentence(inp, read) : `Each of us prefers our own room at these prices by at least ${money(read.margin, cur, read.decimals)}.`,
  ];
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/** Read stored inputs defensively: anything malformed falls back to blank. */
export function parseSplitInputs(raw: unknown): SplitInputs {
  if (!raw || typeof raw !== "object") return BLANK_SPLIT;
  const v = raw as Record<string, unknown>;
  const strs = (x: unknown) =>
    Array.isArray(x) ? x.map((s) => (typeof s === "string" ? s : "")) : [];
  const people = strs(v.people);
  const n = people.length;
  if (n < MIN_PEOPLE || n > MAX_PEOPLE) return BLANK_SPLIT;
  const base: SplitInputs = {
    what: typeof v.what === "string" ? v.what : "",
    rent: typeof v.rent === "string" ? v.rent : "",
    people,
    rooms: strs(v.rooms),
    bids: Array.isArray(v.bids) ? v.bids.map(strs) : [],
    locked: Array.isArray(v.locked) ? v.locked.map((b) => b === true) : [],
  };
  // resize() pads anything short; force the lock list to match exactly.
  const fitted = resize({ ...base, people: base.people }, n);
  return {
    ...fitted,
    locked: Array.from({ length: n }, (_, i) => base.locked[i] === true),
  };
}

/**
 * The worked example: three friends taking a £2,400-a-month flat with an
 * en-suite room, a bright front room and a box room. Two of them like the
 * en suite best, so an equal split leaves someone short.
 */
export const SPLIT_EXAMPLE: SplitInputs = {
  what: "The flat on Elm Road",
  rent: "£2,400",
  people: ["Alex", "Sam", "Priya"],
  rooms: ["En-suite room", "Front room", "Box room"],
  bids: [
    ["1,050", "800", "550"],
    ["900", "950", "550"],
    ["1,000", "850", "550"],
  ],
  locked: [true, true, true],
};
