import { describe, expect, it } from "vitest";
import { prettyUrl, toEmbedUrl } from "./embed";

describe("toEmbedUrl", () => {
  it.each([
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ?t=3", "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"],
    ["https://m.youtube.com/shorts/abc_123", "https://www.youtube-nocookie.com/embed/abc_123"],
    ["https://vimeo.com/76979871", "https://player.vimeo.com/video/76979871?dnt=1"],
    ["https://player.vimeo.com/video/76979871", "https://player.vimeo.com/video/76979871?dnt=1"],
  ])("%s", (input, expected) => {
    expect(toEmbedUrl(input)).toBe(expected);
  });

  it("rejects other URLs and garbage", () => {
    expect(toEmbedUrl("https://example.com/video.mp4")).toBeNull();
    expect(toEmbedUrl("not a url")).toBeNull();
    expect(toEmbedUrl(undefined)).toBeNull();
  });
});

describe("prettyUrl", () => {
  it("strips protocol, www and trailing slash", () => {
    expect(prettyUrl("https://www.github.com/CirtaKnight/")).toBe("github.com/CirtaKnight");
  });
});
