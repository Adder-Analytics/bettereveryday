import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Now — Better Every Day",
  description: "What I'm focused on right now.",
};

type NowItem = {
  label: string;
  items: string[];
};

const sections: NowItem[] = [
  {
    label: "Reading",
    items: [
      "Poor Charlie's Almanack — Charlie Munger. Second read. The mental models are more useful now that I know which ones I've actually internalized vs. which ones I just thought I had.",
      "Designing Data-Intensive Applications — Martin Kleppmann. A third of the way through, finally doing it properly instead of skimming.",
    ],
  },
  {
    label: "Writing",
    items: [
      "Trying to publish something weekly. This site is that commitment made public — knowing something will be read forces a different kind of clarity than writing just for myself.",
      "Working on writing more honestly and less impressively. Clarity first. Craft second.",
    ],
  },
  {
    label: "Building",
    items: [
      "This site. It started as a boilerplate and I'm building it into something I'm proud to share. Added a Mental Models reference page today — the kind of thing I wish had existed when I was trying to learn how to think.",
      "Some internal tooling I can't talk about yet — but it's the most interesting technical problem I've worked on in a while.",
    ],
  },
  {
    label: "Physical",
    items: [
      "Training for a half marathon. Currently at 18 miles per week. Race is in September.",
      "Recovering from a minor shoulder strain — doing PT exercises. Learning that patience is part of the training.",
    ],
  },
  {
    label: "Learning",
    items: [
      "Spanish. B1 plateau is real. Started a conversation exchange with someone in Madrid — three sessions in, it's helping more than any app has.",
      "Systems design. Reading papers from infrastructure teams at companies I admire. The field rewards long, patient study.",
    ],
  },
  {
    label: "Not doing",
    items: [
      "Social media — down to one deliberate 20-minute check per week. It's been six months. I miss almost none of it.",
      "Meetings before 10am. The first two hours of the day are protected.",
    ],
  },
];

export default function Now() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-14">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-2">
          Now
        </h1>
        <p className="text-sm text-[var(--muted)]">Updated June 10, 2026</p>
      </div>

      <div className="space-y-12">
        {sections.map(({ label, items }) => (
          <section key={label}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
              {label}
            </h2>
            <ul className="space-y-3">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--foreground)] leading-relaxed pl-4 border-l-2 border-[var(--border)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-16 text-xs text-[var(--muted)]">
        Inspired by{" "}
        <span className="underline underline-offset-2">
          Derek Sivers&rsquo; /now pages
        </span>
        .
      </p>
    </div>
  );
}
