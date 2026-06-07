import { skills, levelToSegments } from "../data/skills";
import type { Skill, SkillLevel } from "../data/skills";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills — Better Every Day",
  description:
    "Skills I'm actively developing. Honest about levels, honest about the work.",
};

function LevelDots({ level }: { level: SkillLevel }) {
  const filled = levelToSegments[level];
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= filled
              ? "bg-[var(--accent)]"
              : "bg-[var(--border)]"
          }`}
        />
      ))}
    </div>
  );
}

function SkillCard({ skill }: { skill: Skill }) {
  return (
    <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-[var(--foreground)] text-sm">
            {skill.name}
          </h3>
          <p className="text-xs text-[var(--muted)] mt-0.5">{skill.category}</p>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full border ${
            skill.status === "active"
              ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-950/30"
              : skill.status === "paused"
              ? "border-[var(--border)] text-[var(--muted)] bg-[var(--background)]"
              : "border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:bg-blue-950/30"
          }`}
        >
          {skill.status}
        </span>
      </div>

      <p className="text-xs text-[var(--muted)] leading-relaxed mb-4">
        {skill.description}
      </p>

      <div className="flex items-center justify-between">
        <LevelDots level={skill.level} />
        <span className="text-xs text-[var(--muted)]">since {skill.yearStarted}</span>
      </div>

      <p className="text-xs text-[var(--muted)] mt-3 pt-3 border-t border-[var(--border)] leading-relaxed italic">
        {skill.notes}
      </p>
    </div>
  );
}

export default function Skills() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-2">
        Skills in Progress
      </h1>
      <p className="text-sm text-[var(--muted)] mb-4">
        Honest about where things actually stand. Four dots = mastery. One dot = still figuring it out.
      </p>
      <div className="flex items-center gap-3 mb-14">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[var(--accent)] opacity-25"
              style={{ opacity: i * 0.25 }}
            />
          ))}
        </div>
        <span className="text-xs text-[var(--muted)]">
          beginner · intermediate · advanced · mastery
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {skills.map((skill) => (
          <SkillCard key={skill.name} skill={skill} />
        ))}
      </div>
    </div>
  );
}
