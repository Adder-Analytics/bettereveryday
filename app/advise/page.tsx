import type { Metadata } from "next";
import Link from "next/link";
import AdviseClient from "./AdviseClient";

export const metadata: Metadata = {
  title: "Advise a Friend — Better Every Day",
  description:
    "You can see everyone's situation more clearly than your own — a measured effect (Solomon's paradox). So put your own decision in a friend's name, say what you'd tell them straight, and then face the harder half the reframe usually skips: would you take that advice yourself, and if not, what's actually stopping you?",
  openGraph: {
    title: "Advise a Friend — Better Every Day",
    description:
      "The advice you'd give a friend is usually clearer than the one you give yourself. Reframe your own call in their name, say it straight — then confront whether you'd take it, and name the real obstacle if you wouldn't.",
    type: "website",
  },
};

export default function AdvisePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Advise a friend
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          You are not <em>hot</em> — no anger, no closing clock. You&rsquo;re just
          stuck on your own call in a way you never would be on someone
          else&rsquo;s. A friend describes the same dilemma and the answer is
          obvious to you; your own version, identical in every respect, stays a
          fog. That isn&rsquo;t a failure of nerve. It&rsquo;s{" "}
          <strong>Solomon&rsquo;s paradox</strong> — named for the king whose
          wisdom ran his kingdom and wrecked his own house — and Igor Grossmann
          and Ethan Kross measured it: we reason more wisely about a friend&rsquo;s
          problem than our own, and the gap closes the moment we take the outside
          view.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          So this tool manufactures that view. Put your own decision in a
          friend&rsquo;s name, and say plainly what you&rsquo;d tell them. But it
          doesn&rsquo;t stop at the reframe, because most of the time the reframe
          isn&rsquo;t the news — you already <em>know</em>{" "}what you&rsquo;d
          advise. The news is the second question, the one this essay is named
          for: <em>would you take that advice yourself?</em>{" "}When the answer is
          no, the decision was never the unclear part. The obstacle was — fear of
          the downside, what people will think, the years already sunk, the
          comfort of not choosing — and naming which one is the whole work. When
          the answer is &ldquo;my case is different,&rdquo; it checks whether
          that&rsquo;s true or just the thing everyone says.
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
          first. And if the pull is really about how a feeling will age, not
          about advice you won&rsquo;t take,{" "}
          <Link
            href="/regret"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            ask your older self
          </Link>{" "}
          runs the across-time move instead. Nothing you enter is sent anywhere;
          it stays in your browser.
        </p>
      </header>
      <AdviseClient />
      <div className="mt-16 pt-8 border-t border-[var(--border)]">
        <p className="text-sm text-[var(--muted)] leading-relaxed">
          The thinking behind this — Solomon&rsquo;s paradox, the gap between the
          advice you give and the advice you take, and the honest test for
          &ldquo;my case is different&rdquo; — is in{" "}
          <Link
            href="/writing/advice-you-dont-take"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            You Give Better Advice Than You Take
          </Link>
          , with the one-screen version under{" "}
          <Link
            href="/models#self-distancing"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            Self-Distancing
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
