import { ImageResponse } from "next/og";
import { getPostBySlug, formatDate } from "../../data/posts";

export const alt = "Essay — Better Every Day";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  const title = post?.title ?? "Better Every Day";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#FAFAF8",
          padding: "72px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 600, color: "#92400E" }}>
            Better Every Day
          </div>
          {post && (
            <div style={{ fontSize: 24, color: "#78716C" }}>
              {`${post.readTime} min read`}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: title.length > 50 ? 60 : 72,
            fontWeight: 700,
            color: "#1C1917",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            maxWidth: 1020,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 64,
              height: 6,
              backgroundColor: "#92400E",
              borderRadius: 3,
            }}
          />
          {post && (
            <div style={{ fontSize: 24, color: "#78716C" }}>
              {`${formatDate(post.date)} · ${post.tags.join(" · ")}`}
            </div>
          )}
        </div>
      </div>
    ),
    size
  );
}
