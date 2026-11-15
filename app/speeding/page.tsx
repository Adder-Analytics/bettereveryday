import type { Metadata } from "next";
import Link from "next/link";
import SpeedingClient from "./SpeedingClient";

export const metadata: Metadata = {
  title: "A Speeding Letter: What Now, and By When? — Better Every Day",
  description:
    "A camera flashed, or a Notice of Intended Prosecution has come asking who was driving. See what this speed usually leads to (a course, £100 and 3 points, or court), check the 14 days, and date the 28-day driver form, because not answering it is 6 points on its own.",
  openGraph: {
    title: "A Speeding Letter: What Now, and By When? — Better Every Day",
    description:
      "The speed is usually a course or 3 points. Ignoring the form that came with it is 6 points and up to £1,000. What each answer costs, and the dates.",
    type: "website",
  },
};

export default function SpeedingPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <header className="mb-12">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
          A speeding letter: what now, and by when?
        </h1>
        <p className="text-base text-[var(--muted)] leading-relaxed">
          A camera flashed, or a letter has come with your number plate on it and a form asking who was driving. It
          goes on the side while you work out whether you were really speeding, or who had the car that day, or
          whether there&rsquo;s a technicality. Meanwhile a 28-day clock is running on the form, and not answering it
          is its own offence: 6 points and up to £1,000, more than the speeding itself almost ever carries.
        </p>
        <p className="mt-4 text-base text-[var(--muted)] leading-relaxed">
          This tool reads your speed against the lines police use (nothing, a course, a fixed penalty or court),
          prices each answer side by side, checks whether the notice came inside the 14 days, and counts your points
          against the two limits that matter: 6 for a new driver, 12 for everyone. It dates the form and the offer,
          and writes what to send if you don&rsquo;t know who was driving.
        </p>
        <p className="mt-4 text-sm text-[var(--muted)] leading-relaxed">
          For speeding caught by a camera or the police in England, Wales and Scotland (Northern Ireland&rsquo;s
          rules are similar but not the same). It isn&rsquo;t legal advice, and nothing you enter is sent anywhere;
          it stays in your browser. A council penalty charge from a bus lane or yellow box camera isn&rsquo;t
          speeding and carries no points; the council route in{" "}
          <Link href="/parking" className="text-[var(--accent)] hover:opacity-70 transition-opacity">
            the parking ticket tool
          </Link>
          {" "}is the closer fit.
        </p>
      </header>
      <SpeedingClient />
    </div>
  );
}
