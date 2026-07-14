/**
 * Site-wide data portability: back up everything, restore it anywhere.
 *
 * Every tool on this site keeps what you write in your own browser and sends
 * nothing anywhere. That is the whole privacy story, and it is a good one. But
 * it has a cost the site spent a month quietly accumulating: localStorage is
 * not durable. Clear your browsing data, switch devices, or let the cache
 * evict, and a month of logged decisions, armed tripwires, and practice history
 * is simply gone — and the site's entire premise is that you come back in three
 * months to see what actually happened. A record you will lose is a review you
 * will never do.
 *
 * The decision journal already faced this and answered it: it can export its
 * log to a file and merge one back in ("the escape hatch that makes [browser-
 * only storage] defensible — a backup you own"). But that escape hatch was only
 * ever cut for one of ten stores. The pre-mortem's future-dated tripwire checks
 * — commitments you are trusting the site to hold — had no backup. Neither did
 * the trainers' month-spanning records that answer the question in the site's
 * own name. This module generalizes the journal's own principle to everything.
 *
 * This is the local-first "longevity" and "you own your data" ideals (Ink &
 * Switch, 2019), done in the only honest way a zero-backend site can: a file
 * you hold. See the essay "A Record You Can Hold."
 *
 * Design: the bundle stores each key's RAW string value, exactly as it sits in
 * localStorage — a faithful snapshot, not a re-serialization. Restore writes
 * those strings straight back, byte for byte. That means this module never has
 * to understand any tool's internal schema, so it can never corrupt one, and it
 * keeps working when a tool's shape changes. Each tool already parses its own
 * key defensively on load, so a restored value flows back through unchanged.
 */

/** The current bundle format. Bumped only on a breaking change to the wrapper
 *  (never for a tool's own schema — those are opaque strings here). */
export const BUNDLE_VERSION = 1 as const;

/** Stable tag identifying our own export files, so import can tell a backup
 *  from an unrelated JSON file the user picked by mistake. */
export const BUNDLE_APP = "bettereveryday" as const;
export const BUNDLE_KIND = "full-backup" as const;

/**
 * Every localStorage key the site writes, with a human label and the tool it
 * belongs to. This registry is the single source of truth: add a tool's key
 * here and it is automatically backed up, restored, and shown in the summary.
 * `describe` is an OPTIONAL, defensive introspector that turns a raw stored
 * string into a friendly one-line count ("12 decisions, 3 awaiting review").
 * It must never throw and must return null on any shape it doesn't recognize —
 * the backup itself never depends on it, it is only for the on-screen preview.
 */
export type StoreDescriptor = {
  key: string;
  /** The tool this store belongs to, for grouping in the summary. */
  tool: string;
  /** Where that tool lives, so the summary can link to it. */
  href: string;
  /** What this store holds, in one plain phrase. */
  label: string;
  /** Optional friendly count of what's inside. Defensive; returns null if the
   *  shape is unfamiliar. Never throws. */
  describe?: (raw: string) => string | null;
};

/** Safe JSON.parse — returns null instead of throwing on bad input. */
function parse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function count(n: number, one: string, many = one + "s"): string {
  return `${n} ${n === 1 ? one : many}`;
}

export const STORES: StoreDescriptor[] = [
  {
    key: "decide:log:v1",
    tool: "Decision journal",
    href: "/decide",
    label: "Your logged decisions and their reviews",
    describe: (raw) => {
      const v = parse(raw);
      if (!Array.isArray(v)) return null;
      const reviewed = v.filter(
        (e) => e && typeof e === "object" && (e as { reviewedOn?: unknown }).reviewedOn
      ).length;
      const pending = v.length - reviewed;
      if (v.length === 0) return "no decisions yet";
      return pending > 0
        ? `${count(v.length, "decision")}, ${pending} awaiting review`
        : `${count(v.length, "decision")}, all reviewed`;
    },
  },
  {
    key: "decide:v1",
    tool: "Decision journal",
    href: "/decide",
    label: "The worksheet you're part-way through",
    describe: (raw) => (parse(raw) ? "a worksheet in progress" : null),
  },
  {
    key: "premortem:v1",
    tool: "Pre-mortem room",
    href: "/premortem",
    label: "Your pre-mortems and their armed tripwires",
    describe: (raw) => {
      const v = parse(raw);
      if (!v || typeof v !== "object") return null;
      const reasons = (v as { reasons?: unknown }).reasons;
      if (!Array.isArray(reasons)) return "a pre-mortem in progress";
      const tripwires = reasons.filter(
        (r) => r && typeof r === "object" && (r as { triage?: unknown }).triage === "tripwire"
      ).length;
      return tripwires > 0
        ? `${count(reasons.length, "failure named", "failures named")}, ${count(tripwires, "tripwire")}`
        : count(reasons.length, "failure named", "failures named");
    },
  },
  {
    key: "premortem:draft:v1",
    tool: "Pre-mortem room",
    href: "/premortem",
    label: "A pre-mortem draft",
  },
  {
    key: "calibrate:v1",
    tool: "Calibration trainer",
    href: "/calibrate",
    label: "Your calibration practice record",
    describe: describeTrainer,
  },
  {
    key: "estimate:v1",
    tool: "Estimation trainer",
    href: "/estimate",
    label: "Your estimation practice record",
    describe: describeTrainer,
  },
  {
    key: "update:v1",
    tool: "Base-rate trainer",
    href: "/update",
    label: "Your base-rate practice record",
    describe: describeTrainer,
  },
  {
    key: "weigh:v1",
    tool: "Flip point",
    href: "/weigh",
    label: "The either/or you last weighed",
    describe: (raw) => (parse(raw) ? "a decision in progress" : null),
  },
  {
    key: "cool:v1",
    tool: "Cooling-off tool",
    href: "/cool",
    label: "A hot decision you're sleeping on",
    describe: (raw) => (parse(raw) ? "a decision in progress" : null),
  },
  {
    key: "trace:v1",
    tool: "Consequence trace",
    href: "/trace",
    label: "The consequence chain you last traced",
    describe: (raw) => (parse(raw) ? "a trace in progress" : null),
  },
];

/** Every trainer folds each answer into a per-day bucket (see history.ts), so
 *  the number of days is an exact, meaningful count that reads the same across
 *  all three trainers without depending on their differing tallies. */
function describeTrainer(raw: string): string | null {
  const v = parse(raw);
  if (!v || typeof v !== "object") return null;
  const days = (v as { days?: unknown }).days;
  if (Array.isArray(days) && days.length > 0) {
    return `practised on ${count(days.length, "day")}`;
  }
  return "practice recorded";
}

export type Bundle = {
  app: typeof BUNDLE_APP;
  kind: typeof BUNDLE_KIND;
  version: number;
  exportedOn: string;
  keys: Record<string, string>;
};

/** A single store's live state, for the on-screen summary. */
export type StoreSummary = {
  descriptor: StoreDescriptor;
  present: boolean;
  bytes: number;
  detail: string | null;
};

/** Read every registered key from localStorage, keeping only those present.
 *  Returns the raw strings — no parsing, so nothing here can throw on bad data. */
export function collect(): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof window === "undefined") return out;
  for (const { key } of STORES) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) out[key] = raw;
    } catch {
      /* a locked-down browser can throw on access; skip that key */
    }
  }
  return out;
}

/** Build the downloadable bundle from whatever is currently stored. */
export function buildBundle(exportedOn: string): Bundle {
  return {
    app: BUNDLE_APP,
    kind: BUNDLE_KIND,
    version: BUNDLE_VERSION,
    exportedOn,
    keys: collect(),
  };
}

/** Per-store live summary for the page: what's here, and roughly how much. */
export function summarize(): StoreSummary[] {
  const present = collect();
  return STORES.map((descriptor) => {
    const raw = present[descriptor.key];
    return {
      descriptor,
      present: raw != null,
      bytes: raw != null ? raw.length : 0,
      detail: raw != null && descriptor.describe ? safeDescribe(descriptor, raw) : null,
    };
  });
}

function safeDescribe(d: StoreDescriptor, raw: string): string | null {
  try {
    return d.describe ? d.describe(raw) : null;
  } catch {
    return null;
  }
}

export type ParsedBundle =
  | { ok: true; bundle: Bundle; keys: Record<string, string>; source: "full" | "legacy-log" }
  | { ok: false; error: string };

/**
 * Validate and normalize an imported file. Accepts two shapes:
 *   - a full-backup bundle written by this page, and
 *   - the decision journal's own older `{ app: "bettereveryday-decision-log",
 *     …, log }` export, so a backup made before this page existed still
 *     restores. That legacy file is re-expressed as a one-key bundle.
 * Only keys in the registry are ever accepted; anything else is dropped, so an
 * import can only ever touch this site's own stores.
 */
export function parseBundle(text: string): ParsedBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON — it doesn't look like a backup." };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "That file doesn't look like a Better Every Day backup." };
  }
  const obj = parsed as Record<string, unknown>;

  // Legacy decision-log export → re-express as a one-key bundle.
  if (obj.app === "bettereveryday-decision-log" && Array.isArray(obj.log)) {
    const raw = JSON.stringify(obj.log);
    const bundle: Bundle = {
      app: BUNDLE_APP,
      kind: BUNDLE_KIND,
      version: BUNDLE_VERSION,
      exportedOn: typeof obj.exportedAt === "string" ? obj.exportedAt : "",
      keys: { "decide:log:v1": raw },
    };
    return { ok: true, bundle, keys: bundle.keys, source: "legacy-log" };
  }

  if (obj.app !== BUNDLE_APP || obj.kind !== BUNDLE_KIND || typeof obj.keys !== "object" || obj.keys === null) {
    return { ok: false, error: "That file doesn't look like a Better Every Day backup." };
  }

  const known = new Set(STORES.map((s) => s.key));
  const keys: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj.keys as Record<string, unknown>)) {
    if (known.has(k) && typeof v === "string") keys[k] = v;
  }
  if (Object.keys(keys).length === 0) {
    return { ok: false, error: "That backup is empty — there's nothing in it to restore." };
  }

  const bundle: Bundle = {
    app: BUNDLE_APP,
    kind: BUNDLE_KIND,
    version: typeof obj.version === "number" ? obj.version : BUNDLE_VERSION,
    exportedOn: typeof obj.exportedOn === "string" ? obj.exportedOn : "",
    keys,
  };
  return { ok: true, bundle, keys, source: "full" };
}

/** Describe what a parsed bundle contains, for the confirm-before-restore step.
 *  Uses the same defensive describers as the live summary. */
export function describeBundle(keys: Record<string, string>): { descriptor: StoreDescriptor; detail: string | null }[] {
  return STORES.filter((s) => keys[s.key] != null).map((descriptor) => ({
    descriptor,
    detail: descriptor.describe ? safeDescribe(descriptor, keys[descriptor.key]) : null,
  }));
}

/**
 * Write a restored bundle to localStorage. This is a REPLACE for the keys the
 * bundle carries: each such key is overwritten with the backup's value, and —
 * because a partial restore that left some keys behind would be a silent, hard-
 * to-notice mix of two histories — every OTHER registered key is cleared. The
 * result is that the browser now holds exactly the state the backup captured.
 * Callers are expected to snapshot the current state first (see the page's
 * safety backup) so this is never lossy in practice.
 */
export function applyBundle(keys: Record<string, string>): void {
  if (typeof window === "undefined") return;
  for (const { key } of STORES) {
    try {
      if (Object.prototype.hasOwnProperty.call(keys, key)) {
        window.localStorage.setItem(key, keys[key]);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch {
      /* skip a key the browser won't let us write; the rest still restore */
    }
  }
}
