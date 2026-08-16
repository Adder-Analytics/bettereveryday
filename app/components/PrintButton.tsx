"use client";

/**
 * "Save this as a record" — the discoverable half of the print story.
 *
 * The site got a print stylesheet: Cmd-P on any worked decision now yields a
 * clean, light, chrome-free page — a record you can keep in a folder or hand to
 * the one other person the decision is about (see the `@media print` block in
 * `globals.css`, and the essay "A Record You Can Hold"). But that stylesheet is
 * silent. Nothing on the page tells you the record *can* be held; you'd only
 * find it by thinking to print a web tool, which almost nobody does. So the
 * finished work — a pre-mortem, a logged decision, a scored comparison, a
 * debrief — sat one keystroke from paper with no sign the keystroke existed.
 *
 * This is the affordance that says so out loud: a plain button that sits with
 * the other things you can already do with a finished result (copy it as a
 * memo, hand it to someone by link, add its checks to your calendar) and opens
 * the browser's own print / save-as-PDF dialog. Each tool decides *when* to
 * render it — only once there's a result worth keeping — so it never invites you
 * to print a blank form.
 *
 * It prints nothing of itself: `data-print-hide` drops it from the page it
 * makes. On the record, the button that made the record has no business being
 * there. The click is guarded for the server render — `window` only exists once
 * this client component has mounted in the browser — so it's inert until it can
 * actually do the thing it offers.
 */
export default function PrintButton({
  label = "Print / Save as PDF",
  className = "text-sm font-medium px-4 py-2 rounded-lg border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--background)] transition-colors",
}: {
  /** The button's label. Defaults to the plainest true description of what it does. */
  label?: string;
  /** Override the styling to match the row it joins; defaults to the secondary-action look. */
  className?: string;
}) {
  return (
    <button
      type="button"
      data-print-hide
      onClick={() => {
        if (typeof window !== "undefined") window.print();
      }}
      className={className}
    >
      {label}
    </button>
  );
}
