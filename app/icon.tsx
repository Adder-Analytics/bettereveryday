import { ImageResponse } from "next/og";
import { brandIcon } from "./data/brandIcon";

// The browser-tab icon. The repo shipped with the default create-next-app
// favicon (the Next.js mark) — off-brand for a site that has otherwise worked
// hard to present as the instrument it is, not a generic app. This replaces it
// with the site's own rising-bars mark, generated from the one shared source so
// the tab, the home screen, and the installed app all agree.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(brandIcon(size.width), { ...size });
}
