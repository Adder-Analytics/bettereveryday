import Link from "next/link";
import { posts, formatDate } from "./data/posts";
import ReviewDueBadge from "./components/ReviewDueBadge";

const sortedPosts = [...posts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
const recentPosts = sortedPosts.slice(0, 3);
const lastUpdated = formatDate(sortedPosts[0].date);

const currentFocus = [
  { label: "Reading", value: "Poor Charlie's Almanack (2nd read) + DDIA" },
  { label: "Writing", value: "Publishing weekly — this site is the commitment" },
  { label: "Learning", value: "Spanish B1 plateau, systems design" },
  { label: "Physical", value: "Half marathon training, ~18 mi/week" },
];

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-6">
      {/* Hero */}
      <section className="pt-20 pb-16 border-b border-[var(--border)]">
        <h1 className="text-4xl font-semibold tracking-tight leading-tight text-[var(--foreground)] mb-6">
          Better Every Day.
        </h1>
        <p className="text-lg text-[var(--muted)] leading-relaxed max-w-lg">
          Essays on finance, decisions, learning, and craft. The conviction
          underneath all of it: understanding a few fundamental ideas well beats
          knowing many things shallowly.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/start"
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            New here? Start with a reading path →
          </Link>
          <Link
            href="/decide"
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Facing a decision now? Work it through →
          </Link>
          <span className="text-sm text-[var(--muted)]">Updated {lastUpdated}</span>
        </div>
      </section>

      {/* Recent Writing */}
      <section className="py-14 border-b border-[var(--border)]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-8">
          Recent Writing
        </h2>
        <div className="space-y-8">
          {recentPosts.map((post) => (
            <article key={post.slug}>
              <Link href={`/writing/${post.slug}`} className="group block">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-medium text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <span className="text-xs text-[var(--muted)] whitespace-nowrap mt-0.5">
                    {post.readTime} min
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-[var(--muted)] leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {formatDate(post.date)}
                </p>
              </Link>
            </article>
          ))}
        </div>
        <Link
          href="/writing"
          className="inline-block mt-10 text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          All writing →
        </Link>
      </section>

      {/* Models Teaser */}
      <section className="py-14 border-b border-[var(--border)]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
          Reference
        </h2>
        <ReviewDueBadge />
        <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md mb-4">
          A curated collection of mental models — ideas from finance, decisions,
          systems thinking, and psychology that change how you reason. The{" "}
          <Link
            href="/playbook"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            playbook
          </Link>{" "}
          flips them around so you can find the right one by the moment you&rsquo;re
          in, and the{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>{" "}
          lets you think a real decision through, log what you expect to happen,
          and come back later to check it against what actually did. Before a
          big commitment, the{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pre-mortem room
          </Link>{" "}
          finds the failure while it&rsquo;s still cheap — and leaves tripwires
          on your calendar, not worries in your head. When it comes down to an
          either/or, the{" "}
          <Link
            href="/weigh"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            flip point
          </Link>{" "}
          stops you arguing the exact odds and shows the threshold where the
          decision actually turns. When the call is being made hot — in anger,
          panic, or FOMO — the{" "}
          <Link
            href="/cool"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            cooling-off tool
          </Link>{" "}
          settles whether to decide now at all, then helps you get the distance
          to see it straight. When a move looks good but you suspect the bill
          comes later,{" "}
          <Link
            href="/trace"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            and then what?
          </Link>{" "}
          follows it down its chain of consequences and finds the point where the
          effect you intended reverses into the one you have to live with. The{" "}
          <Link
            href="/practice"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            practice page
          </Link>{" "}
          trains the three skills underneath every forecast — how sure you should
          be, how to get to a number at all, and how much a new fact should move
          it — and shows those records beside the one that counts: how your real,
          reviewed decisions actually went. And once your record spans enough
          time, it answers the question in the site&rsquo;s name — your first
          rounds beside your latest, whether you&rsquo;re actually getting
          better. Reading notes capture what specific
          books did to my thinking.
          Everything cross-references, and everything is searchable (press{" "}
          <kbd className="px-1 py-0.5 text-xs rounded border border-[var(--border)] bg-[var(--card)]">
            /
          </kbd>{" "}
          anywhere).
        </p>
        <div className="flex flex-wrap gap-6">
          <Link
            href="/models"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Mental models →
          </Link>
          <Link
            href="/playbook"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The playbook →
          </Link>
          <Link
            href="/decide"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Decision journal →
          </Link>
          <Link
            href="/premortem"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Run a pre-mortem →
          </Link>
          <Link
            href="/weigh"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Find the flip point →
          </Link>
          <Link
            href="/cool"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Cool a hot decision →
          </Link>
          <Link
            href="/trace"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Trace the consequences →
          </Link>
          <Link
            href="/practice"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Practice your judgement →
          </Link>
          <Link
            href="/notes"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Reading notes →
          </Link>
          <Link
            href="/search"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Search the site →
          </Link>
        </div>
      </section>

      {/* Now Snapshot */}
      <section className="py-14">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-8">
          Currently
        </h2>
        <div className="space-y-4">
          {currentFocus.map(({ label, value }) => (
            <div key={label} className="flex gap-6">
              <span className="text-sm font-medium text-[var(--foreground)] w-20 shrink-0">
                {label}
              </span>
              <span className="text-sm text-[var(--muted)] leading-relaxed">
                {value}
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/now"
          className="inline-block mt-10 text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
        >
          Full /now page →
        </Link>
      </section>
    </div>
  );
}
