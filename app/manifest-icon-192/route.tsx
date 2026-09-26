import { ImageResponse } from "next/og";
import { brandIcon } from "../data/brandIcon";

// A 192×192 PNG for the web app manifest (see app/manifest.ts). Manifest icons
// need stable URLs the manifest can name, so each size is a tiny route handler
// over the one shared mark rather than a committed binary. Prerendered as a
// static asset — it never depends on the request.
export const dynamic = "force-static";

const size = { width: 192, height: 192 };

export function GET() {
  return new ImageResponse(brandIcon(size.width), { ...size });
}
