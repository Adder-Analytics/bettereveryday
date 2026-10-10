import type { Metadata } from "next";
import Link from "next/link";
import LaterClient from "./LaterClient";

export const metadata: Metadata = {
  title: "If It Were Next Week — Better Every Day",
  description:
    "Someone's asked you to do something weeks or months away: a talk, a committee, a favour, a trip. Yes is easy because that week looks empty from here. Count the real hours, picture it landing next week, and find out whether it's a yes, a no, a smaller yes, or just hard to refuse. Then send the reply.",
  openGraph: {
    title: "If It Were Next Week — Better Every Day",
    description:
      "Future weeks look empty and never are. Before you say yes to something far off, picture it landing next week, out of the week you actually have.",
    type: "website",
  },
};

export default function LaterPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          If it were next week
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          Someone asks you to give a talk in March, sit on a committee from the
          autumn, help them move next month. From here, that week looks
          wide open, so yes costs nothing. Then the week arrives, as full as
          this one, and you spend it wondering why you agreed.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          That isn&rsquo;t a character flaw. People reliably expect to have{" "}
          <strong>more spare time in the future</strong>{" "}than they have now, and
          they judge far-off plans by how good they&rsquo;d be rather than how
          they&rsquo;d fit. This tool moves the ask up close: count the real
          hours, picture it landing <strong>next week</strong>, and see what your
          answer is then. It ends with a reply you can send.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          If it&rsquo;s the same kind of ask every time (every committee, every
          coffee), decide it once with{" "}
          <Link
            href="/rule"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            a personal rule
          </Link>{" "}
          instead. Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <LaterClient />
    </div>
  );
}
