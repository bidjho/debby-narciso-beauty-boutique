import { createServerFn } from "@tanstack/react-start";
import { createPublicClient } from "./public-db.server";
import { DEFAULT_SITE_CONTENT, mergeSiteContent, type SiteContent } from "./site-content";

/** Public site texts/photos/contacts. Never throws: falls back to the default content. */
export const getSiteContent = createServerFn({ method: "GET" }).handler(async (): Promise<SiteContent> => {
  try {
    const db = createPublicClient();
    const { data, error } = await db.from("site_content").select("content").eq("id", "main").maybeSingle();
    if (error || !data) return DEFAULT_SITE_CONTENT;
    return mergeSiteContent(data.content);
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
});
