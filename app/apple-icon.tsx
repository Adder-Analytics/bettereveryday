import { ImageResponse } from "next/og";
import { brandIcon } from "./data/brandIcon";

// The iOS / iPadOS home-screen icon, used when someone adds the toolkit to their
// home screen (Share → Add to Home Screen). Apple applies its own rounding, so
// the mark is drawn full-bleed; 180×180 is the size current iOS asks for.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(brandIcon(size.width), { ...size });
}
