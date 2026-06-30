import type { Metadata } from "next";
import Link from "next/link";
import CalibrateClient from "./CalibrateClient";

export const metadata: Metadata = {
  title: "Calibration trainer — Better Every Day",
  description:
    "The decision journal asks how sure you are. This is where you find out whether your 'sure' is worth anything. Put 90% confidence intervals on facts with knowable answers, and learn — immediately — how overconfident you really are. One of the few thinking skills that's quickly, measurably trainable.",
  openGraph: {
    title: "Calibration trainer — Better Every Day",
    description:
      "Does your 90% actually mean 90%? Put numbers on your uncertainty against facts you can check, and recalibrate the feeling of being sure — the skill underneath every forecast.",
    type: "website",
  },
};

export default function CalibratePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Calibration trainer
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>{" "}
          asks you, on every forecast, how sure you are — 60%, 80%, 90%. But a
          probability is only worth something if it&rsquo;s true: if the things you
          call 90% likely actually happen about nine times in ten. Almost nobody&rsquo;s
          does. The gap between how sure people feel and how often they&rsquo;re right
          is one of the most reliable findings in the study of judgment, and it has
          a name — <span className="text-[var(--foreground)]">overconfidence</span>.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The good news is the unusual part. Most cognitive biases are sticky;
          knowing about them barely helps. Calibration is the exception — it&rsquo;s a
          skill, and a fast-moving one. In Douglas Hubbard&rsquo;s training data,
          most people go from badly overconfident to nearly perfect inside half a
          day, just by doing rounds like these and seeing the score. The
          superforecasters Philip Tetlock studied are, more than anything else,
          well-calibrated. The only thing that builds it is putting real numbers on
          your uncertainty and getting told, right away, how you did.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          So that&rsquo;s what this is. Pick a mode below. The trivia isn&rsquo;t the
          point — being right about the Nile is worthless. The point is to
          recalibrate the <em>feeling</em> of being sure, so that the next time it
          shows up over a decision that matters, the number you put on it is
          honest. Everything stays in your browser; your record builds up across
          rounds.
        </p>
      </header>

      <CalibrateClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Why this works, and where it stops:{" "}
          <Link
            href="/writing/your-ninety-percent"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Your 90% Isn&rsquo;t 90%
          </Link>
          . The model behind it:{" "}
          <Link
            href="/models#calibration"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Calibration
          </Link>
          . Then put it to work where it counts, in the{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>
          . This is one of three trainers for putting honest numbers on an
          uncertain world — see it beside the other two on the{" "}
          <Link
            href="/practice"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            practice page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
