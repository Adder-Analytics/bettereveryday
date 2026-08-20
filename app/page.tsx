import { Fragment } from "react";
import Link from "next/link";
import { posts, formatDate } from "./data/posts";
import { resolveToolGroups, toolCount } from "./data/tools";
import ReviewDueBadge from "./components/ReviewDueBadge";
import DecideHero from "./components/DecideHero";

const sortedPosts = [...posts].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);
const recentPosts = sortedPosts.slice(0, 3);
const lastUpdated = formatDate(sortedPosts[0].date);

const toolGroups = resolveToolGroups();

const currentFocus = [
  { label: "Reading", value: "Poor Charlie's Almanack (2nd read) + DDIA" },
  { label: "Writing", value: "Publishing weekly — this site is the commitment" },
  { label: "Learning", value: "Spanish B1 plateau, systems design" },
  { label: "Physical", value: "Half marathon training, ~18 mi/week" },
];

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto px-6">
      {/* Hero — lead with the useful thing: a private toolkit for a real decision. */}
      <section className="pt-20 pb-16 border-b border-[var(--border)]">
        <h1 className="text-4xl font-semibold tracking-tight leading-tight text-[var(--foreground)] mb-6">
          Better Every Day.
        </h1>
        <p className="text-lg text-[var(--muted)] leading-relaxed max-w-lg">
          A private toolkit for thinking through a real decision &mdash; the flip
          point, the pre-mortem, the consequence trace, and a dozen more &mdash;
          with the essays and mental models behind the thinking. Nothing you enter
          ever leaves your browser.
        </p>
        <DecideHero />
        <p className="mt-8 text-sm text-[var(--muted)]">Updated {lastUpdated}</p>
      </section>

      {/* The instruments, by the shape of the moment — the site's core utility,
          scannable at a glance instead of buried in prose. */}
      <section className="py-14 border-b border-[var(--border)]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-6">
          The Toolkit
        </h2>
        <ReviewDueBadge />
        <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md mb-8">
          {toolCount}{" "}working instruments, each built for a different kind of
          moment in a decision&rsquo;s life. Not a lecture &mdash; a worksheet you
          fill in, that keeps the record for you and can hand it back weeks later,
          when you find out whether you were right.
        </p>

        <div className="space-y-7">
          {toolGroups.map((group) => (
            <div key={group.id}>
              <Link
                href={`/tools#${group.id}`}
                className="text-sm font-semibold text-[var(--foreground)] leading-snug hover:text-[var(--accent)] transition-colors"
              >
                {group.title}
              </Link>
              <p className="mt-1.5 text-sm leading-relaxed">
                {group.tools.map((tool, i) => (
                  <Fragment key={tool.id}>
                    {i > 0 && (
                      <span className="text-[var(--border)]" aria-hidden>
                        {" · "}
                      </span>
                    )}
                    <Link
                      href={tool.href}
                      className="text-[var(--accent)] hover:opacity-70 transition-opacity"
                    >
                      {tool.name}
                    </Link>
                  </Fragment>
                ))}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/find"
            className="text-sm font-medium text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Find your tool in a question or two &rarr;
          </Link>
          <Link
            href="/example"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Or watch one decision go through the whole kit &rarr;
          </Link>
        </div>
      </section>

      {/* Recent Writing — the thinking the tools are built on. */}
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
          All writing &rarr;
        </Link>
      </section>

      {/* Reference — the ideas to think with, and where to find them. */}
      <section className="py-14 border-b border-[var(--border)]">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
          Reference
        </h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed max-w-md mb-4">
          A curated collection of mental models &mdash; ideas from finance,
          decisions, systems thinking, and psychology that change how you reason.
          The{" "}
          <Link
            href="/playbook"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            playbook
          </Link>{" "}
          flips them around so you can find the right idea by the moment
          you&rsquo;re in, and reading notes capture what specific books did to my
          thinking. The conviction underneath all of it: understanding a few
          fundamental ideas well beats knowing many things shallowly.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Link
            href="/models"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Mental models &rarr;
          </Link>
          <Link
            href="/playbook"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The playbook &rarr;
          </Link>
          <Link
            href="/notes"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Reading notes &rarr;
          </Link>
          <Link
            href="/bookshelf"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            The bookshelf &rarr;
          </Link>
          <Link
            href="/search"
            className="inline-block text-sm text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Search the site &rarr;
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
          Full /now page &rarr;
        </Link>
      </section>
    </div>
  );
}
