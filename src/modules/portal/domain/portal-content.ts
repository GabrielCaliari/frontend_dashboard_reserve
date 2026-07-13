/**
 * §3.5 — Calendário de Conteúdo + Feed de Atividades.
 *
 * BLOCKED (backend): `GET /portal/content/calendar` reads `content_posts`
 * (master doc §4.2/§3.5), not built. §3.5's Meta scheduled-posts-vs-own-
 * system spike is a backend/product decision, not resolved here — this UI
 * works against either source since it only consumes the `ContentPost`
 * shape, not the origin.
 */
export type ContentPostStatus = "draft" | "scheduled" | "published";
export type ContentPlatform = "instagram" | "facebook";

export interface ContentPost {
  id: string;
  platform: ContentPlatform;
  scheduled_for: string;
  published_at: string | null;
  status: ContentPostStatus;
  caption_preview: string;
  thumbnail_url: string;
  permalink: string | null;
}

/**
 * BLOCKED (backend): `GET /portal/activity` reads `activity_log` (master
 * doc §4.2), not built.
 */
export type ActivityCategory = "post" | "campaign" | "report" | "bot" | "meeting" | "other";

export interface ActivityLogEntry {
  id: string;
  type: "auto" | "manual";
  category: ActivityCategory;
  title: string;
  description: string | null;
  occurred_at: string;
}
