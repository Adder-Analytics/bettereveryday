"use client";

/**
 * The through-line, made legible.
 *
 * When a tool hands you off to another — the reversibility triage sending a
 * one-way door to the pre-mortem, the flip point handing a close call to the
 * journal — the destination pre-fills its "what are you deciding?" field from
 * the decision you already typed (see `app/data/carry.ts`). That pre-fill was
 * silent: the field simply appeared populated. For a person mid-decision that
 * reads as slightly magic — *did I type this? can I change it?* — and the worst
 * case is they distrust a field they should just edit, or leave a carried line
 * in place because they didn't realize it was a starting point, not a fixture.
 *
 * This is the muted line that sits above a seeded field and says so plainly:
 * the text was carried over from your last step, and you can edit it in place or
 * clear it outright. It's a hint, not a wall — it never blocks the field, and it
 * disappears the moment the value stops matching what was carried (because then
 * it's your text, not the handoff's). Same throw-nothing discipline as the rest
 * of the through-line: it renders from state the receiver already holds and
 * persists nothing of its own.
 */
export default function CarriedNote({
  show,
  onClear,
}: {
  /** True while the field still holds exactly what was carried in, untouched. */
  show: boolean;
  /** Empty the field and dismiss the note. */
  onClear: () => void;
}) {
  if (!show) return null;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 pl-3 border-l-2 border-[var(--accent)] text-xs text-[var(--muted)] leading-relaxed">
      <span>Carried over from your last step — edit it above, or</span>
      <button
        type="button"
        onClick={onClear}
        className="font-medium text-[var(--accent)] hover:opacity-70 transition-opacity underline underline-offset-2"
      >
        clear it
      </button>
    </p>
  );
}
