import type { Metadata } from "next";
import Link from "next/link";
import { getWorksheetSituations } from "../data/situations";
import DecideClient from "./DecideClient";

export const metadata: Metadata = {
  title: "Work a Decision Through — Better Every Day",
  description:
    "An interactive worksheet for thinking through a real decision. Pick the situation you're in, write your reasoning against the few models that actually apply, and walk away with a decision memo you can check against later.",
  openGraph: {
    title: "Work a Decision Through — Better Every Day",
    description:
      "Pick the situation you're in, work your reasoning through the models that apply, and keep the memo. The playbook, made usable in the moment.",
    type: "website",
  },
};

const situations = getWorksheetSituations();

export default function DecidePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Work a decision through
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The{" "}
          <Link
            href="/models"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            models
          </Link>{" "}
          tell you the ideas; the{" "}
          <Link
            href="/playbook"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            playbook
          </Link>{" "}
          tells you which ones a moment calls for. This is the last step: actually
          using them. Pick the situation you&rsquo;re in, write your thinking
          against each model&rsquo;s prompt, and end with the call and the one reason
          behind it. Writing a decision down before you know how it turned out is
          the single cheapest way to get better at deciding — it&rsquo;s the only
          record that isn&rsquo;t rewritten by the result.
        </p>
      </header>

      <DecideClient situations={situations} />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you write here leaves your browser. Prefer to just read about
          the tools? Browse the{" "}
          <Link
            href="/models"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            mental models
          </Link>{" "}
          or find them by moment in the{" "}
          <Link
            href="/playbook"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            playbook
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
