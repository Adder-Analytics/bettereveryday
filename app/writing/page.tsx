import { posts } from "../data/posts";
import WritingList from "./WritingList";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Writing — Better Every Day",
  description:
    "Essays on finance, decisions, learning, and craft — focused on understanding how things actually work.",
};

export default function Writing() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-2">
        Writing
      </h1>
      <p className="text-sm text-[var(--muted)] mb-10">
        Essays on finance, decisions, learning, and craft — focused on
        understanding how things actually work.
      </p>

      <WritingList posts={posts} />
    </div>
  );
}
