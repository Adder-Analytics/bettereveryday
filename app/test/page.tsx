import type { Metadata } from "next";
import Link from "next/link";
import TestClient from "./TestClient";

export const metadata: Metadata = {
  title: "Could You Be Wrong? — Better Every Day",
  description:
    "Once you're leaning toward a call, research quietly turns into building the case for what you already wanted — that's confirmation bias, and it feels exactly like diligence. Name the assumption it rests on, force out what would prove it false, and check whether you've looked. Then, where you can, run the cheapest real test instead of trusting the prediction.",
  openGraph: {
    title: "Could You Be Wrong? — Better Every Day",
    description:
      "The antidote to confirmation bias: state what would change your mind, go looking for it, and — where you can — test instead of predict. The 'R' in the Heaths' WRAP.",
    type: "website",
  },
};

export default function TestPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Could you be wrong?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Here is what happens the moment you start to lean. You&rsquo;ve half-decided
          &mdash; take the job, ship the feature, make the move &mdash; and now you go
          do your research. Except the research isn&rsquo;t neutral anymore. You
          notice the facts that fit, and the ones that don&rsquo;t slide past; you
          read the review that agrees and skim the one that doesn&rsquo;t; the
          question quietly shifts from <em>is this right?</em> to <em>why is this
          right?</em>{" "}The diligence is real. It&rsquo;s just been quietly turned
          into building the case for what you already wanted.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          That&rsquo;s <strong>confirmation bias</strong>, and it&rsquo;s the most
          pervasive decision trap there is &mdash; not because it&rsquo;s subtle but
          because from the inside it is <em>indistinguishable from being thorough</em>.
          You can&rsquo;t feel it working. The only defense is structural: instead of
          asking whether you&rsquo;re right, go looking for the specific evidence that
          you&rsquo;re wrong &mdash; and then, where you can, stop arguing about what
          will happen and run a small test that tells you.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This is the <strong>R</strong> in Chip and Dan Heath&rsquo;s{" "}
          <strong>WRAP</strong> process from <em>Decisive</em> &mdash;{" "}
          <em>reality-test your assumptions</em>. The site already{" "}
          <Link
            href="/widen"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            widens the frame
          </Link>{" "}
          (the W) and{" "}
          <Link
            href="/regret"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            attains distance
          </Link>{" "}
          (the A) and{" "}
          <Link
            href="/premortem"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            prepares to be wrong
          </Link>{" "}
          (the P). This is the missing letter: the move you make between having a
          leaning and committing to it.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          The idea in full is in the{" "}
          <Link
            href="/models#reality-testing"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            reality-testing model
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <TestClient />
    </div>
  );
}
