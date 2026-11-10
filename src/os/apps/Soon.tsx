import type { AppProps } from "./types";
import { EmptyState } from "./ui";

/** Temporary body for apps that are still being built. */
export function Soon(_props: AppProps) {
  void _props;
  return <EmptyState title="Rising soon">This app is on its way.</EmptyState>;
}
