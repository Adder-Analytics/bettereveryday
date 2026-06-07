export type SkillLevel = "beginner" | "intermediate" | "advanced" | "mastery";
export type SkillStatus = "active" | "paused" | "maintaining";

export type Skill = {
  name: string;
  category: string;
  description: string;
  level: SkillLevel;
  yearStarted: number;
  status: SkillStatus;
  notes: string;
};

export const skills: Skill[] = [
  {
    name: "Writing",
    category: "Communication",
    description: "Clear thinking made visible — essays, documentation, argument",
    level: "intermediate",
    yearStarted: 2023,
    status: "active",
    notes: "Focused on clarity over cleverness. Publishing weekly to stay honest.",
  },
  {
    name: "TypeScript & Next.js",
    category: "Engineering",
    description: "Building web applications and thinking in systems",
    level: "advanced",
    yearStarted: 2021,
    status: "active",
    notes: "Daily use. Deepening understanding of the runtime, compiler, and tooling layer.",
  },
  {
    name: "Systems Design",
    category: "Engineering",
    description: "Distributed systems, architecture, and scalability trade-offs",
    level: "intermediate",
    yearStarted: 2024,
    status: "active",
    notes: "Working through DDIA. Reading infrastructure papers. This one is a long road.",
  },
  {
    name: "Spanish",
    category: "Language",
    description: "Conversational and written — aiming for C1",
    level: "intermediate",
    yearStarted: 2022,
    status: "active",
    notes: "Daily Anki. 30 min conversation exchange. Stuck at the B1 plateau — grinding through it.",
  },
  {
    name: "Strength Training",
    category: "Physical",
    description: "Compound lifts, progressive overload, recovery",
    level: "intermediate",
    yearStarted: 2021,
    status: "active",
    notes: "Three sessions a week. Recovering from a shoulder strain — learning patience.",
  },
  {
    name: "Photography",
    category: "Creative",
    description: "Composition, light, and learning to see before lifting the camera",
    level: "beginner",
    yearStarted: 2025,
    status: "active",
    notes: "Shooting on a Fuji X-T30. One roll per week. The discipline is slowing down.",
  },
];

export const levelToSegments: Record<SkillLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  mastery: 4,
};
