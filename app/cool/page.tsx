import type { Metadata } from "next";
import Link from "next/link";
import CoolClient from "./CoolClient";

export const metadata: Metadata = {
  title: "Cool the Call — Better Every Day",
  description:
    "The decisions people most regret are made hot — the email fired in anger, the panic-sell, the leap made while infatuated. A tool for exactly that moment: when you're hot, the real choice isn't act-or-don't, it's decide-now-or-once-you're-cool. It settles that, then helps you manufacture the distance to see straight.",
  openGraph: {
    title: "Cool the Call — Better Every Day",
    description:
      "For the decision that feels urgent and obvious while your pulse is up. Reversibility and a real deadline settle whether to decide now at all; then the two research-backed moves for getting distance — answer it in someone else's name, and run the ten-minute / ten-month / ten-year horizons.",
    type: "website",
  },
};

export default function CoolPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Cool the call
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Every other tool on this site assumes a calm person at the keyboard.
          But the decisions people most regret aren&rsquo;t made calmly — they&rsquo;re
          made <em>hot</em>: the email fired off in anger, the panic-sell after
          bad news, the leap made while infatuated, the sunk cost you can&rsquo;t
          stand to write off. The call feels urgent and obvious, and your pulse
          is up. This is the tool for that exact moment.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          It won&rsquo;t talk you into or out of anything. It does one thing:
          when you&rsquo;re hot, the real decision isn&rsquo;t{" "}
          <em>act or don&rsquo;t</em> — it&rsquo;s <em>decide now, or once
          you&rsquo;re cool?</em> Two facts you can judge even now settle that —
          whether the door swings back, and whether anything outside you is
          actually forcing the clock. Then it helps you{" "}
          <Link
            href="/models#self-distancing"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            manufacture the distance
          </Link>{" "}
          to see the choice the way you&rsquo;d see a friend&rsquo;s.
        </p>
      </header>

      <CoolClient />

      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          Nothing you type here leaves your browser, and it stays put — so a
          decision you sleep on is still here when you come back cold. The
          thinking behind the tool — Solomon&rsquo;s paradox, the hot&ndash;cold
          empathy gap, 10/10/10, and the honest caveat that some feelings are
          data, not heat — is in{" "}
          <Link
            href="/writing/advice-you-dont-take"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            You Give Better Advice Than You Take
          </Link>
          , with the one-screen version in the reference under{" "}
          <Link
            href="/models#self-distancing"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Self-Distancing
          </Link>
          . Cooled off and the call still stands? Weigh it properly with the{" "}
          <Link
            href="/weigh"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            flip point
          </Link>{" "}
          or log it in the{" "}
          <Link
            href="/decide"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            decision journal
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
