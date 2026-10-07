import type { Metadata } from "next";
import Link from "next/link";
import RoundClient from "./RoundClient";

export const metadata: Metadata = {
  title: "Before Anyone Speaks — Better Every Day",
  description:
    "Your group has to settle on one number — how long, how much, how likely — and whoever says a number first will set it for everyone. Run a blind round instead: everyone answers privately, all the numbers are revealed at once, the two ends speak first, then everyone answers again. Works passing one phone round the table or by message, and nothing is sent to any server.",
  openGraph: {
    title: "Before Anyone Speaks — Better Every Day",
    description:
      "Planning poker for any group decision: private estimates, one reveal, and the spread as the finding. Estimate, talk, estimate.",
    type: "website",
  },
};

export default function RoundPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Before anyone speaks
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A group has to agree on a number: when the project will be done, what to
          budget, what to offer for the house, how likely the launch is to work.
          So you talk it through, and someone says a number first. From then on
          everyone adjusts from it. The most senior or most confident voice pulls
          hardest, the quiet person with the crucial fact nods along, and the
          group leaves with one person&rsquo;s guess and everyone&rsquo;s
          agreement.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The fix is a procedure, not more willpower. Everyone writes a number
          down privately. All the numbers are shown at once. If they agree, you
          take the middle and stop. If they don&rsquo;t, the spread is the
          finding: the people at the two ends explain what they were counting,
          and then everyone answers again, privately. The group&rsquo;s number is
          the middle of that second round.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          It&rsquo;s the estimate&ndash;talk&ndash;estimate method from Kahneman,
          Sibony and Sunstein&rsquo;s <em>Noise</em>, the same idea software teams
          know as planning poker. Pass one phone round the table, or send an
          invite and collect replies by message. Why private answers beat a
          discussion is in the{" "}
          <Link
            href="/models#independent-judgments"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            independent judgments model
          </Link>
          ; for the first number that sets all the others, see{" "}
          <Link
            href="/models#anchoring"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            anchoring
          </Link>
          . If the argument isn&rsquo;t really about a number, the tool for that
          is{" "}
          <Link
            href="/crux"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            where do you actually disagree?
          </Link>{" "}
          Nothing you enter is sent anywhere; the invite and replies travel inside
          the links themselves.
        </p>
      </header>
      <RoundClient />
    </div>
  );
}
