import type { Metadata } from "next";
import Link from "next/link";
import RegretClient from "./RegretClient";

export const metadata: Metadata = {
  title: "Ask Your Older Self — Better Every Day",
  description:
    "You keep leaning one way, but can't tell if it's the real call or just how you feel right now. Play the decision forward to ten minutes, ten months, ten years — Suzy Welch's 10-10-10 and Bezos's regret minimization — and weigh the regret of doing against the one that grows quietly: the road not taken.",
  openGraph: {
    title: "Ask Your Older Self — Better Every Day",
    description:
      "A present-moment pull is loud and often lies about how long it lasts. Play it forward across three horizons, read the trajectory, and weigh it against the regret you can't feel now — the road not taken.",
    type: "website",
  },
};

export default function RegretPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Ask your older self
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          You keep leaning one way, and you can&rsquo;t tell whether that&rsquo;s
          the real call or just the version of you sitting here right now.
          You&rsquo;re not <em>hot</em> — no anger, no clock — it&rsquo;s the
          quieter distortion: the pull of comfort, of avoidance, of a new thing&rsquo;s
          shine, of the fear of trying. All of them are <strong>present-weighted</strong>,
          and present weight is exactly what you can&rsquo;t feel from inside the
          present. A strong pull collapses the horizons into one loud{" "}
          <em>now</em>. This tool pulls them back apart.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          It borrows two well-worn moves. Suzy Welch&rsquo;s{" "}
          <strong>10-10-10</strong>{" "}asks how the call will look in ten minutes,
          ten months, ten years — so a pull that evaporates can&rsquo;t out-shout
          one that lasts. Jeff Bezos&rsquo;s{" "}
          <strong>regret minimization</strong>{" "}asks the same from the end: project
          to your older self and choose what they&rsquo;d least regret. They meet
          on one fact the present hides — the regret you&rsquo;ll feel most in the
          long run is usually for the road you <em>didn&rsquo;t</em> take, and that
          regret is silent today. So this reads two things: how the pull changes
          across the horizons, and how the road not taken sits — then it crosses
          them.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          Deciding while genuinely hot — angry, panicked, rushed — is a different
          problem;{" "}
          <Link
            href="/cool"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            cool the call
          </Link>{" "}
          first, then come back to this. Nothing you enter is sent anywhere; it
          stays in your browser.
        </p>
      </header>
      <RegretClient />
    </div>
  );
}
