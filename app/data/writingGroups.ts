import { posts, type Post } from "./posts";
import { situationGroups } from "./situations";

/**
 * The essays, sorted by what's making the decision hard.
 *
 * /writing used to open on the essays in the order they were written, behind a
 * strip of eighteen tag chips. Neither helped a reader find anything: authoring
 * order put the oldest, most generic pieces on the first screen, and the tags
 * carried no scent — "decisions" sits on 33 of the 43 essays, and nine tags sit
 * on exactly one. So the page now sorts the essays under the same kinds of hard
 * the playbook and the guided router use, so all three front doors share one
 * vocabulary. The labels are read from `situationGroups` rather than copied, so
 * a rewording there reaches here too.
 *
 * The one group the playbook doesn't have is the slow work of getting better at
 * a skill: those essays answer no single decision, so they sit last, under their
 * own honest heading.
 */

type EssayGroup = {
  /** A playbook group id, or a writing-only id with its own `label`. */
  id: string;
  label?: string;
  slugs: string[];
};

const essayGroups: EssayGroup[] = [
  {
    id: "options",
    slugs: ["whether-or-not", "the-flip-point", "neither-is-better", "look-then-leap"],
  },
  {
    id: "stakes",
    slugs: [
      "the-door-you-can-walk-back-through",
      "the-river-is-four-feet-deep",
      "the-option-to-wait",
      "nobody-thinks-theyre-the-base-rate",
      "money-math",
      "inflation-silent-tax",
    ],
  },
  {
    id: "head",
    slugs: [
      "advice-you-dont-take",
      "loss-aversion",
      "availability-heuristic",
      "your-ninety-percent",
      "the-plan-was-never-tried",
      "paintings-of-the-drowned",
    ],
  },
  {
    id: "loop",
    slugs: [
      "what-would-you-do-either-way",
      "hold-the-funeral-first",
      "the-money-is-already-gone",
      "decide-it-once",
    ],
  },
  {
    id: "people",
    slugs: [
      "the-one-thing-that-would-change-your-mind",
      "never-ask-a-barber",
      "decide-your-line-first",
      "future-you-is-not-less-busy",
      "metric-not-the-mission",
      "second-order-thinking",
      "the-bill-comes-later",
    ],
  },
  {
    id: "numbers",
    slugs: [
      "anchoring",
      "guessing-on-purpose",
      "orders-of-magnitude",
      "how-much-should-this-change-your-mind",
      "three-numbers-for-an-uncertain-world",
    ],
  },
  {
    id: "after",
    slugs: [
      "decision-quality",
      "deciding-and-doing",
      "tie-me-tighter",
      "the-honest-number-comes-after",
      "experience-doesnt-teach",
      "the-return",
      "the-last-inch",
      "a-record-you-can-hold",
    ],
  },
  {
    id: "practice",
    label: "It's not one decision — it's getting better at something",
    slugs: [
      "deliberate-practice",
      "the-compound-needs-evidence",
      "plateau-boredom",
      "compounding-improvements",
      "deep-work-is-a-skill",
      "reading-system",
    ],
  },
];

export type ResolvedEssayGroup = { id: string; label: string; posts: Post[] };

/**
 * Every essay must sit in exactly one group: one left out would vanish from
 * /writing, the only index of them. Throws at build time on an unknown group id,
 * an unknown slug, a duplicate, or an essay in no group — the same discipline
 * `getGroupedSituations` uses.
 */
export function getGroupedPosts(): ResolvedEssayGroup[] {
  const bySlug = new Map(posts.map((p) => [p.slug, p]));
  const placed = new Set<string>();
  const ids = new Set<string>();
  const grouped = essayGroups.map((group) => {
    if (ids.has(group.id)) throw new Error(`Duplicate essay group id "${group.id}"`);
    ids.add(group.id);
    const label = group.label ?? situationGroups.find((g) => g.id === group.id)?.label;
    if (!label) throw new Error(`Essay group "${group.id}" has no label and no playbook group`);
    return {
      id: group.id,
      label,
      posts: group.slugs.map((slug) => {
        const post = bySlug.get(slug);
        if (!post) throw new Error(`Essay group "${group.id}" names unknown essay "${slug}"`);
        if (placed.has(slug)) throw new Error(`Essay "${slug}" is in more than one group`);
        placed.add(slug);
        return post;
      }),
    };
  });
  for (const p of posts) {
    if (!placed.has(p.slug)) throw new Error(`Essay "${p.slug}" is in no writing group`);
  }
  return grouped;
}

export type EssayPlace = {
  group: { id: string; label: string };
  prev: Post | null;
  next: Post | null;
};

/**
 * Where an essay sits in the grouped order /writing shows: its group, and the
 * essays either side of it. The essay page's Previous / Next used to follow the
 * order the essays were written in, so after "The Flip Point" came an essay on
 * reading habits. Walking the grouped order instead keeps a reader beside essays
 * on the same kind of hard, and only crosses into the next group at its edge.
 */
export function getEssayPlace(slug: string): EssayPlace {
  const groups = getGroupedPosts();
  const order = groups.flatMap((g) => g.posts.map((post) => ({ post, group: g })));
  const i = order.findIndex((e) => e.post.slug === slug);
  if (i === -1) throw new Error(`Essay "${slug}" is in no writing group`);
  const { id, label } = order[i].group;
  return {
    group: { id, label },
    prev: i > 0 ? order[i - 1].post : null,
    next: i < order.length - 1 ? order[i + 1].post : null,
  };
}
