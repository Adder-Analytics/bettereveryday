import { posts } from "../data/posts";
import { notes } from "../data/notes";

const SITE_URL = "https://bettereveryday.vercel.app";
const SITE_TITLE = "Better Every Day";
const SITE_DESCRIPTION =
  "Essays on finance, decisions, learning, and craft — built around the conviction that understanding a few fundamental ideas well beats knowing many things shallowly.";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type FeedItem = {
  title: string;
  link: string;
  description: string;
  date: string;
  content: string;
};

export async function GET() {
  const feedItems: FeedItem[] = [
    ...posts.map((post) => ({
      title: post.title,
      link: `${SITE_URL}/writing/${post.slug}`,
      description: post.excerpt,
      date: post.date,
      content: post.content,
    })),
    ...notes.map((note) => ({
      title: `Reading note: ${note.title}`,
      link: `${SITE_URL}/notes#${note.slug}`,
      description: `A reading note on ${note.bookTitle}.`,
      date: note.date,
      content: note.content,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const items = feedItems
    .map(
      (item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.link}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
      <content:encoded><![CDATA[${item.content}]]></content:encoded>
    </item>`
    )
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
