import { useLoaderData } from "@tanstack/react-router";
import { DEFAULT_SITE_CONTENT, type SiteContent } from "./site-content";

/** Editable site content, loaded once by the root route. */
export function useSite(): SiteContent {
  const data = useLoaderData({ from: "__root__", strict: false }) as SiteContent | undefined;
  return data ?? DEFAULT_SITE_CONTENT;
}
