"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { ContextMenuLayer } from "./components/ContextMenu";
import { Cursor } from "./components/Cursor";
import { KeyboardLayer } from "./components/Keyboard";
import { useIdleScreensaver } from "./components/LockScreen";
import { DesktopIcons } from "./components/DesktopIcons";
import { KonshuCorner } from "./components/KonshuCorner";
import { NotificationLayer, useStartupNotifications } from "./components/Notifications";
import { Spotlight } from "./components/Spotlight";
import { DOCK_RESERVED, Dock, MENUBAR_H, MenuBar, TASKBAR_H, Taskbar } from "./components/Shell";
import { StartMenu } from "./components/StartMenu";
import { Wallpaper } from "./components/Wallpaper";
import { Window } from "./components/Window";
import { useMediaQuery, useViewport } from "./hooks";
import { unlock } from "./store/achievements";
import { useSettings } from "./store/settings";
import { useUI } from "./store/ui";
import { useWindows } from "./store/windows";
import { useDeepLinks } from "./useDeepLinks";
import { useSkyAchievements } from "./useSkyAchievements";

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
  const snapPreview = useUI((s) => s.snapPreview);
  useStartupNotifications();
  useDeepLinks();
  useIdleScreensaver();
  useSkyAchievements();

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
    const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let progress = 0;
    const onKey = (e: KeyboardEvent) => {
      progress = e.key === konami[progress] ? progress + 1 : e.key === konami[0] ? 1 : 0;
      if (progress === konami.length) {
        progress = 0;
        unlock("konami");
      }
      if (e.key === "F5" && !e.ctrlKey) {
        e.preventDefault();
        useUI.getState().refresh();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
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
      onClick={closePanel}
    >
      <Wallpaper />
      <DesktopIcons />

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

      <KonshuCorner bottom={layout === "dock" ? 18 : TASKBAR_H + 14} />

      <AnimatePresence>{panel === "start" && <StartMenu key="start" />}</AnimatePresence>
      <NotificationLayer />
      <AnimatePresence>{panel === "search" && <Spotlight key="search" />}</AnimatePresence>
      <KeyboardLayer />
      <ContextMenuLayer />
      {customCursor && finePointer && <Cursor />}
    </motion.div>
  );
}
