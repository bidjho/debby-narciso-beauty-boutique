import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_CONTENT,
  mergeSiteContent,
  normalizeStorePhone,
  siteContentSchema,
  sitePhotoPaths,
} from "./site-content";

describe("site content editor", () => {
  it("accepts the default content used to initialize the editor", () => {
    expect(siteContentSchema.safeParse(DEFAULT_SITE_CONTENT).success).toBe(true);
  });

  it("normalizes Mozambican phone numbers before saving", () => {
    expect(normalizeStorePhone("+258 87 550 5550")).toBe("258875505550");
    expect(normalizeStorePhone("87 550 5550")).toBe("258875505550");
    expect(normalizeStorePhone("123")).toBeNull();
  });

  it("falls back to defaults when stored sections are invalid", () => {
    const content = mergeSiteContent({
      hero: { titleLine1: "" },
      benefits: [{ title: "Only one", text: "Incomplete" }],
      contact: { whatsappNumber: "invalid" },
    });

    expect(content.hero).toEqual(DEFAULT_SITE_CONTENT.hero);
    expect(content.benefits).toEqual(DEFAULT_SITE_CONTENT.benefits);
    expect(content.contact).toEqual(DEFAULT_SITE_CONTENT.contact);
  });

  it("keeps valid edited sections while filling missing sections with defaults", () => {
    const content = mergeSiteContent({
      hero: { ...DEFAULT_SITE_CONTENT.hero, titleLine1: "Nova coleção" },
    });

    expect(content.hero.titleLine1).toBe("Nova coleção");
    expect(content.contact).toEqual(DEFAULT_SITE_CONTENT.contact);
    expect(content.benefits).toEqual(DEFAULT_SITE_CONTENT.benefits);
  });

  it("lists only uploaded image paths currently referenced by the site", () => {
    const content = {
      ...DEFAULT_SITE_CONTENT,
      hero: { ...DEFAULT_SITE_CONTENT.hero, imagePath: "site/hero.webp" },
      editorial: { ...DEFAULT_SITE_CONTENT.editorial, image1Path: "site/model.webp" },
      contact: { ...DEFAULT_SITE_CONTENT.contact, storeImagePath: "site/store.webp" },
    };

    expect(sitePhotoPaths(content)).toEqual(["site/hero.webp", "site/model.webp", "site/store.webp"]);
  });
});
