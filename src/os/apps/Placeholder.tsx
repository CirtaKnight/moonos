import { MoonGlyph } from "../components/MoonGlyph";
import type { AppProps } from "./types";

/** Temporary body for apps that are still being built. */
export function Placeholder(// eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props: AppProps,
) {
  return (
    <div className="grid h-full place-items-center p-8 text-center text-muted">
      <div className="flex flex-col items-center gap-3">
        <MoonGlyph phase={0.15} size={40} className="text-accent" />
        <p className="text-sm">This app is still rising. Check back soon.</p>
      </div>
    </div>
  );
}
