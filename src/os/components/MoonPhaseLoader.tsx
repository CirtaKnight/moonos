"use client";

import { useEffect, useState } from "react";
import { MoonGlyph } from "./MoonGlyph";

/** A loader that cycles through the eight moon phases. */
export function MoonPhaseLoader({ size = 18 }: { size?: number }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 8), 160);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-2" aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <MoonGlyph
          key={i}
          phase={i / 8}
          size={size}
          className={`transition-opacity duration-300 ${i === step ? "opacity-100" : "opacity-25"}`}
        />
      ))}
    </div>
  );
}
