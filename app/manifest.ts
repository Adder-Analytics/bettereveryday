import type { MetadataRoute } from "next";
import { toolCountWord } from "./data/tools";

/**
 * The web app manifest — what makes the toolkit installable to a phone home
 * screen or a desktop dock, where it opens in its own window with no browser
 * chrome. This is the natural end of the site's whole thesis. Every tool already
 * keeps its work in your browser and sends nothing anywhere; installing puts the
 * *instrument itself* on your device too, so it's one tap away in the moment you
 * actually face a decision — on a phone, on a plane, in a waiting room — and,
 * with the service worker (public/sw.js), it keeps working with no signal at all.
 * A private, local-first decision toolkit that lives on your device, not on a
 * server you have to reach.
 *
 * Icons are generated from the one shared brand mark (data/brandIcon.tsx) at the
 * two sizes installers ask for, declared both plain and `maskable` so Android's
 * icon mask crops cleanly. `id` is set explicitly so the installed app has a
 * stable identity across manifest revisions.
 *
 * Next prerenders this as a static route and injects the `<link rel="manifest">`
 * automatically because the file exists.
 */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Better Every Day",
    short_name: "Better Every Day",
    description: `A private toolkit of ${toolCountWord} working instruments for thinking through a real decision. Nothing you enter ever leaves your browser.`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAF8",
    theme_color: "#FAFAF8",
    categories: ["productivity", "utilities", "lifestyle"],
    icons: [
      {
        src: "/manifest-icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/manifest-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/manifest-icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/manifest-icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
