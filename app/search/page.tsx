import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search — Better Every Day",
  description:
    "Search across every essay, mental model, and book annotation on the site.",
};

export default function SearchPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-3">
          Search
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed max-w-lg">
          Everything on the site — essays, mental models, and bookshelf
          annotations — searchable in one place.
        </p>
      </div>
      <SearchClient />
    </div>
  );
}
