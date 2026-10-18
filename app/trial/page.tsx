import type { Metadata } from "next";
import Link from "next/link";
import TrialClient from "./TrialClient";

export const metadata: Metadata = {
  title: "Before the Trial Ends — Better Every Day",
  description:
    "Signing up for a free trial? Find out whether cancelling today keeps the free time, work out the date to cancel by, put it on your calendar, and get the question back on the day: would you pay for this?",
  openGraph: {
    title: "Before the Trial Ends — Better Every Day",
    description:
      "A free trial turns into a payment unless you act. Change that default at sign-up, the one moment it's cheap to change.",
    type: "website",
  },
};

export default function TrialPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          Before the trial ends
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A free trial is a subscription with the default already chosen: do
          nothing, and it becomes a payment. Most people who get charged for a
          trial they didn&rsquo;t want weren&rsquo;t careless. They meant to
          cancel, and the day came and went.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          The cheap moment to fix that is now, while you&rsquo;re signing up. If
          cancelling keeps the free time, cancel today and the default flips:
          the trial ends unless you choose it. If it doesn&rsquo;t, this works
          out the{" "}
          <strong>date to cancel by</strong>, puts it on your calendar, and on
          the day asks you one question: would you sign up for this today, at
          this price?
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For the ones that are already charging you, use{" "}
          <Link href="/keep" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            keep or cancel
          </Link>
          . Nothing you enter is sent anywhere; it stays in your browser.
        </p>
      </header>
      <TrialClient />
    </div>
  );
}
