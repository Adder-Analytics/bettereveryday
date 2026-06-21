import type { Metadata } from "next";
import Link from "next/link";
import { getWorksheetSituations } from "../data/situations";
import DecideClient from "./DecideClient";

export const metadata: Metadata = {
  title: "Decision Journal — Better Every Day",
  description:
    "An interactive decision journal. Pick the situation you're in, reason through the models that apply, record what you expect to happen — then come back when the outcome is in and compare. The cheapest known way to actually get better at deciding.",
  openGraph: {
    title: "Decision Journal — Better Every Day",
    description:
      "Work a real decision through the models that apply, log what you expect, and review it later against what actually happened. Hindsight bias can't rewrite a record you wrote first.",
    type: "website",
  },
};

const situations = getWorksheetSituations();

export default function DecidePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Decision journal
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
          tells you which ones a moment calls for. Here you actually use them. Pick
          the situation you&rsquo;re in, write your thinking against each
          model&rsquo;s prompt, make the call — then add the part most people skip:
          what you expect to happen, and how sure you are. Log it, set a review
          date, and add that review to your calendar so it actually comes back to
          you when the outcome is in.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          That second half is the whole point. Once you know how something turned
          out, your memory quietly rewrites what you thought beforehand (hindsight
          bias), and you start grading decisions by their results instead of their
          reasoning — so a good call that got unlucky gets filed as a mistake. A
          record you wrote <em>before</em> the result is the only thing the result
          can&rsquo;t edit. That&rsquo;s what makes a decision journal the cheapest
          known way to actually get better at deciding.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          It only works if you keep it, so the log is yours to keep: everything
          stays in your browser, you can export it as a file to back up or move to
          another device, and once you&rsquo;ve reviewed a few decisions it shows you
          two things memory can&rsquo;t: how well-calibrated your confidence is, and
          how often a good call got unlucky or a bad call got lucky — so you grade
          the decision, not the dice. New here?{" "}
          <span className="text-[var(--foreground)]">
            There&rsquo;s a worked example linked below the situations.
          </span>
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
