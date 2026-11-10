import { ImageResponse } from "next/og";

export const alt = "MoonOS — a portfolio that boots like an operating system";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview: the eclipse wallpaper, the crescent mark and the wordmark. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: 90,
          background: "radial-gradient(circle at 78% 22%, #1d2846 0%, #0a0e1a 45%, #04060c 100%)",
          color: "#e9ecf3",
          fontFamily: "serif",
        }}
      >
        <svg width="220" height="220" viewBox="0 0 100 100">
          <path d="M 66 18 A 40 40 0 1 0 66 82 A 32 32 0 1 1 66 18 Z" fill="#dfe5f2" />
          <path d="M 49 50 L 53 41 L 57 50 L 53 59 Z M 44 50 L 53 46.5 L 62 50 L 53 53.5 Z" fill="#c8a96f" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 60 }}>
          <div style={{ fontSize: 76, letterSpacing: 18, display: "flex" }}>
            MOON<span style={{ color: "#bccbeb" }}>OS</span>
          </div>
          <div style={{ fontSize: 30, color: "#8c94a8", marginTop: 18, fontFamily: "monospace" }}>
            $ boot portfolio --os
          </div>
          <div style={{ fontSize: 30, color: "#bccbeb", marginTop: 10, fontFamily: "sans-serif" }}>
            by CirtaKnight · Computer Science Engineering Student
          </div>
        </div>
      </div>
    ),
    size,
  );
}
