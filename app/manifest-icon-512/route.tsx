import { ImageResponse } from "next/og";
import { brandIcon } from "../data/brandIcon";

// A 512×512 PNG for the web app manifest (see app/manifest.ts) — the size used
// for the Android install banner and the home-screen tile. Same one shared mark,
// prerendered as a static asset.
export const dynamic = "force-static";

const size = { width: 512, height: 512 };

export function GET() {
  return new ImageResponse(brandIcon(size.width), { ...size });
}
