import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "./components/nav";
import { Footer } from "./components/footer";
import SearchShortcut from "./components/SearchShortcut";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://bettereveryday.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Better Every Day",
  description:
    "Essays on finance, decisions, learning, and craft — built around the conviction that understanding a few ideas well beats knowing many things shallowly.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Better Every Day",
    description:
      "Essays on finance, decisions, learning, and craft — built around the conviction that understanding a few ideas well beats knowing many things shallowly.",
    siteName: "Better Every Day",
  },
  alternates: {
    types: {
      "application/rss+xml": `${SITE_URL}/feed.xml`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <Nav />
        <SearchShortcut />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
