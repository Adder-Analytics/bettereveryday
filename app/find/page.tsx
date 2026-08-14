import type { Metadata } from "next";
import Link from "next/link";
import FindClient from "./FindClient";
import { toolCountWord } from "../data/tools";

export const metadata: Metadata = {
  title: "Where do I start? — Better Every Day",
  description:
    "Facing a decision and not sure which tool it needs? Answer a question or two about the shape of it, and the toolkit hands you the one instrument for the moment you're in — with your decision carried in, and the next step named.",
  openGraph: {
    title: "Where do I start? — Better Every Day",
    description: `Answer a question or two about your decision, and be handed the one instrument for the moment you're in — not ${toolCountWord} to choose between.`,
    type: "website",
  },
};

export default function FindPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Where do I start?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The toolkit has {toolCountWord}{" "}instruments, and when
          you&rsquo;re actually in front of a hard decision, {toolCountWord}{" "}
          is too many to read through. So don&rsquo;t. Answer a question or two
          about the shape of the thing and
          it hands you the one instrument for the moment you&rsquo;re in &mdash;
          and, since real calls are rarely one tool, names the honest next step
          after it. Nothing you type is saved or sent anywhere.
        </p>
      </header>

      <FindClient />

      <div className="mt-14 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Want to see how the instruments fit together first? Watch one real
          decision go through the whole kit &mdash; a{" "}
          <Link
            href="/example"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            cold, deliberate one
          </Link>{" "}
          or a{" "}
          <Link
            href="/example/hot"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            hot one, cooled before it&rsquo;s decided
          </Link>
          . Or read the full{" "}
          <Link
            href="/tools"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            toolkit index
          </Link>
          , organized by the moment you&rsquo;re in.
        </p>
      </div>
    </div>
  );
}
