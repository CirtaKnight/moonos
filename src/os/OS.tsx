"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Boot } from "./components/Boot";
import { LockScreen } from "./components/LockScreen";
import { LogoMark } from "./components/Logo";
import { ContentProvider } from "./content/ContentProvider";
import type { OSContent } from "./content/types";
import { Desktop } from "./Desktop";
import { useMediaQuery } from "./hooks";
import { Phone } from "./mobile/Phone";
import { usePhone } from "./store/phone";
import { usePower } from "./store/power";
import { launchQuickView } from "./useDeepLinks";
import { useSettings } from "./store/settings";

export const PHONE_QUERY = "(max-width: 767px), (pointer: coarse) and (max-height: 500px)";

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
  // Phones (and phone-sized landscape screens) get the phone shell instead of a shrunken desktop.
  const isPhone = useMediaQuery(PHONE_QUERY);
  // Visitors arriving on a shared link get the short boot.
  const [deepLinked] = useState(
    () => typeof window !== "undefined" && /[?&](open|quick)/.test(window.location.search),
  );

  useEffect(() => {
    usePhone.getState().setActive(isPhone);
  }, [isPhone]);

  const onBootDone = () => {
    markBooted();
    usePower.getState().bootDone();
  };

  const onQuickView = () => {
    onBootDone();
    // Wait for the shell to measure itself before tiling windows.
    setTimeout(launchQuickView, 150);
  };

  return (
    <ContentProvider content={content}>
      {power === "booting" &&
        (hydrated ? (
          <Boot
            lines={content.settings.bootLines}
            short={(hasBooted || deepLinked) && !fullBoot}
            onDone={onBootDone}
            onQuickView={onQuickView}
          />
        ) : (
          <div className="fixed inset-0 bg-[#030409]" />
        ))}
      {(power === "on" || power === "locked") && (isPhone ? <Phone /> : <Desktop />)}
      <AnimatePresence>{power === "locked" && <LockScreen key="lock" />}</AnimatePresence>
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
