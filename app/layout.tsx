import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "./components/nav";
import { Footer } from "./components/footer";
import SearchShortcut from "./components/SearchShortcut";
import PrintStamp from "./components/PrintStamp";
import AnswerLogRecorder from "./components/AnswerLogRecorder";
import { toolCountWord } from "./data/tools";
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

const SITE_DESCRIPTION =
  `A private toolkit of ${toolCountWord} working instruments for thinking through a real decision — the flip point, the pre-mortem, the consequence trace, and more — plus the essays and mental models behind them. Nothing you enter ever leaves your browser.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Better Every Day",
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Better Every Day",
    description: SITE_DESCRIPTION,
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
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Nav />
        <SearchShortcut />
        <AnswerLogRecorder />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <PrintStamp />
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
