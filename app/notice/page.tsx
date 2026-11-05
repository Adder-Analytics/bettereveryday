import type { Metadata } from "next";
import Link from "next/link";
import NoticeClient from "./NoticeClient";

export const metadata: Metadata = {
  title: "A Notice to Leave: Do You Have to Go? — Better Every Day",
  description:
    "Your landlord in England has served a notice to leave. Check it against the May 2026 rules (Form 3A, the ground, the notice period), see the earliest you could really have to leave, and get the letters to the landlord and the council.",
  openGraph: {
    title: "A Notice to Leave: Do You Have to Go? — Better Every Day",
    description:
      "The date on a notice is the earliest your landlord can ask a court, not the day you have to be out. Check the notice, then the timeline.",
    type: "website",
  },
};

export default function NoticePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          A notice to leave: do you have to go?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          The landlord wants the home back, and there&rsquo;s a date on the
          letter. Most people read that date as the day they have to be out.
          Some start packing, some stop paying because it feels over anyway,
          and some move out early and lose the council&rsquo;s help on the
          way.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The date on a notice is the earliest the landlord can{" "}
          <em>ask a court</em>. Only a court order, and then bailiffs, can make
          a tenant leave. Since 1 May 2026, no-fault notices have gone in
          England, and a landlord needs Form 3A, a legal ground and the right
          notice for it. This tool checks the notice, shows the earliest each
          step could come, works out the arrears figure that matters if
          it&rsquo;s about rent, and writes the letters.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For private renters in England; Wales, Scotland, Northern Ireland,
          social housing and lodgers get a pointer. It isn&rsquo;t legal
          advice, and nothing you enter is sent anywhere; it stays in your
          browser. Rent going up instead? Try{" "}
          <Link
            href="/rent"
            className="text-[var(--accent)] hover:opacity-70 transition-opacity"
          >
            pay it or challenge it
          </Link>
          .
        </p>
      </header>
      <NoticeClient />
    </div>
  );
}
