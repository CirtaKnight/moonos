"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { Boot } from "./components/Boot";
import { LogoMark, Wordmark } from "./components/Logo";
import { MoonPhaseLoader } from "./components/MoonPhaseLoader";
import { ContentProvider } from "./content/ContentProvider";
import type { OSContent } from "./content/types";
import { useSettings } from "./store/settings";

type Power = "booting" | "on" | "off";

function subscribeHydration(cb: () => void) {
  return useSettings.persist.onFinishHydration(cb);
}

/** Root of the OS: boot → desktop (or phone shell on small touch screens). */
export function OS({ content }: { content: OSContent }) {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => useSettings.persist.hasHydrated(),
    () => false,
  );
  const hasBooted = useSettings((s) => s.hasBooted);
  const markBooted = useSettings((s) => s.markBooted);
  const [power, setPower] = useState<Power>("booting");
  /** Restart / "replay boot" always plays the full sequence. */
  const [forceFullBoot, setForceFullBoot] = useState(false);
  const shortBoot = hasBooted && !forceFullBoot;

  const onBootDone = useCallback(() => {
    markBooted();
    setPower("on");
  }, [markBooted]);

  return (
    <ContentProvider content={content}>
      {power === "booting" && hydrated && (
        <Boot lines={content.settings.bootLines} short={shortBoot} onDone={onBootDone} />
      )}
      {power === "booting" && !hydrated && <div className="fixed inset-0 bg-[#030409]" />}
      {power === "on" && (
        <main className="grid h-dvh w-dvw place-items-center bg-bg">
          <div className="flex flex-col items-center gap-6">
            <LogoMark size={112} />
            <Wordmark className="text-2xl" />
            <MoonPhaseLoader />
          </div>
        </main>
      )}
    </ContentProvider>
  );
}
