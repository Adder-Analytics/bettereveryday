import type { ReactElement } from "react";

/**
 * The one brand mark, drawn once and reused everywhere an app icon is needed —
 * the browser tab (`app/icon.tsx`), the iOS home screen (`app/apple-icon.tsx`),
 * and the installable app's manifest icons (`app/manifest-icon-*`). Keeping the
 * mark in a single function is the same discipline the rest of the site uses for
 * anything that must not drift: the tab, the home-screen tile, and the installed
 * app can't disagree about what the instrument looks like.
 *
 * The mark itself is three rising bars in the site's cream on the accent brown —
 * the "better every day" idea rendered as a shape: a small, steady climb. It
 * echoes the accent bar on the Open Graph card, and it reads at 32px in a tab
 * and at 512px on a phone home screen alike. Drawn with `next/og`'s flexbox
 * subset (Satori), the same engine `opengraph-image.tsx` already uses, so there
 * is no binary icon to hand-maintain and every size is generated from this one
 * source.
 *
 * `padding` is the maskable safe zone: Android may crop an installed icon to a
 * circle or squircle, so the bars sit within the central ~76% and the accent
 * fills to every edge, which keeps the mark whole under any mask.
 */
export function brandIcon(px: number): ReactElement {
  const pad = Math.round(px * 0.24);
  const gap = Math.round(px * 0.08);
  const barW = Math.round(px * 0.13);
  const radius = Math.max(1, Math.round(barW / 2));
  const full = px - pad * 2;
  const heights = [
    Math.round(full * 0.46),
    Math.round(full * 0.72),
    Math.round(full * 1.0),
  ];

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap,
        padding: pad,
        background: "#92400E",
      }}
    >
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            width: barW,
            height: h,
            borderRadius: radius,
            background: "#FAFAF8",
          }}
        />
      ))}
    </div>
  );
}
