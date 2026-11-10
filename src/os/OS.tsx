"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { Boot } from "./components/Boot";
import { LogoMark } from "./components/Logo";
import { ContentProvider } from "./content/ContentProvider";
import type { OSContent } from "./content/types";
import { Desktop } from "./Desktop";
import { usePower } from "./store/power";
import { useSettings } from "./store/settings";

function subscribeHydration(cb: () => void) {
  return useSettings.persist.onFinishHydration(cb);
}

/** Root of the OS: boot → desktop, plus the shut-down / powered-off screens. */
export function OS({ content }: { content: OSContent }) {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => useSettings.persist.hasHydrated(),
    () => false,
  );
  const hasBooted = useSettings((s) => s.hasBooted);
  const markBooted = useSettings((s) => s.markBooted);
  const power = usePower((s) => s.state);
  const fullBoot = usePower((s) => s.fullBoot);

  const onBootDone = () => {
    markBooted();
    usePower.getState().bootDone();
  };

  return (
    <ContentProvider content={content}>
      {power === "booting" &&
        (hydrated ? (
          <Boot
            lines={content.settings.bootLines}
            short={hasBooted && !fullBoot}
            onDone={onBootDone}
          />
        ) : (
          <div className="fixed inset-0 bg-[#030409]" />
        ))}
      {power === "on" && <Desktop />}
      <AnimatePresence>
        {(power === "shutting-down" || power === "off") && <PowerOff key="off" off={power === "off"} />}
      </AnimatePresence>
    </ContentProvider>
  );
}

const SHUTDOWN_LINES = [
  "Saving unsaved ideas…",
  "Closing 47 Stack Overflow tabs…",
  "The moon keeps watch. Goodnight.",
];

function PowerOff({ off }: { off: boolean }) {
  const powerOn = usePower((s) => s.powerOn);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] grid cursor-pointer place-items-center bg-[#030409] text-[#8c94a8]"
      onClick={() => off && powerOn()}
      onKeyDown={() => off && powerOn()}
      role="button"
      tabIndex={0}
      aria-label={off ? "Power on" : "Shutting down"}
    >
      {off ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.25, 0.7, 0.25] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <LogoMark size={44} />
          <p className="font-mono text-xs tracking-widest uppercase">Click anywhere to power on</p>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center gap-2 font-mono text-sm">
          {SHUTDOWN_LINES.map((l, i) => (
            <motion.p key={l} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.6 }}>
              {l}
            </motion.p>
          ))}
        </div>
      )}
    </motion.div>
  );
}
