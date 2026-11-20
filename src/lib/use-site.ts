import { useRouterState } from "@tanstack/react-router";
import { DEFAULT_SITE_CONTENT, type SiteContent } from "./site-content";

/** Editable site content, loaded once by the root route (first match). */
export function useSite(): SiteContent {
  const data = useRouterState({ select: (s) => s.matches[0]?.loaderData as SiteContent | undefined });
  return data ?? DEFAULT_SITE_CONTENT;
}
