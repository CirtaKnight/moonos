import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { WindowParams } from "../store/windows";

export interface AppProps {
  params: WindowParams;
  /** Present when rendered inside a desktop window; absent in the phone shell. */
  windowId?: string;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: LucideIcon;
  tint: string;
  component: ComponentType<AppProps>;
  size: { w: number; h: number };
  /** Shown in the start menu / phone home screen. */
  listed: boolean;
  /** Pinned in the dock / taskbar. */
  pinned: boolean;
  description?: string;
}
