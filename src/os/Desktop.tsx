"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { Cursor } from "./components/Cursor";
import { DesktopIcons } from "./components/DesktopIcons";
import { NotificationLayer, useStartupNotifications } from "./components/Notifications";
import { SkyWidget } from "./components/SkyWidget";
import { Spotlight } from "./components/Spotlight";
import { DOCK_RESERVED, Dock, MENUBAR_H, MenuBar, TASKBAR_H, Taskbar } from "./components/Shell";
import { StartMenu } from "./components/StartMenu";
import { Wallpaper } from "./components/Wallpaper";
import { Window } from "./components/Window";
import { useMediaQuery, useViewport } from "./hooks";
import { useSettings } from "./store/settings";
import { useUI } from "./store/ui";
import { useWindows } from "./store/windows";
import { useDeepLinks } from "./useDeepLinks";

export function Desktop() {
  const layout = useSettings((s) => s.layout);
  const customCursor = useSettings((s) => s.customCursor);
  const finePointer = useMediaQuery("(pointer: fine)");
  const viewport = useViewport();
  const windows = useWindows((s) => s.windows);
  const setBounds = useWindows((s) => s.setBounds);
  const panel = useUI((s) => s.panel);
  const closePanel = useUI((s) => s.closePanel);
  const togglePanel = useUI((s) => s.togglePanel);
  const selectIcon = useUI((s) => s.selectIcon);
  const snapPreview = useUI((s) => s.snapPreview);
  useStartupNotifications();
  useDeepLinks();

  // Usable area for windows depends on the shell layout.
  useEffect(() => {
    if (!viewport) return;
    if (layout === "dock") {
      setBounds({ x: 0, y: MENUBAR_H, w: viewport.w, h: viewport.h - MENUBAR_H - DOCK_RESERVED });
    } else {
      setBounds({ x: 0, y: 0, w: viewport.w, h: viewport.h - TASKBAR_H });
    }
  }, [viewport, layout, setBounds]);

  // Global shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        togglePanel("search");
      } else if (e.key === "Escape" && useUI.getState().panel) {
        closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePanel, closePanel]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-0 overflow-hidden"
      onClick={() => {
        closePanel();
        selectIcon(null);
      }}
    >
      <Wallpaper />
      <DesktopIcons />
      <SkyWidget />

      <AnimatePresence>
        {snapPreview && (
          <motion.div
            key="snap"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute z-[55] rounded-xl border border-accent/50 bg-accent/10 backdrop-blur-sm"
            style={{
              left: snapPreview.x + 6,
              top: snapPreview.y + 6,
              width: snapPreview.w - 12,
              height: snapPreview.h - 12,
            }}
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 isolate">
        <AnimatePresence>
          {windows.map((w) => (
            <Window key={w.id} win={w} />
          ))}
        </AnimatePresence>
      </div>

      {layout === "dock" ? (
        <>
          <MenuBar />
          <Dock />
        </>
      ) : (
        <Taskbar />
      )}

      <AnimatePresence>{panel === "start" && <StartMenu key="start" />}</AnimatePresence>
      <NotificationLayer />
      <AnimatePresence>{panel === "search" && <Spotlight key="search" />}</AnimatePresence>
      {customCursor && finePointer && <Cursor />}
    </motion.div>
  );
}
