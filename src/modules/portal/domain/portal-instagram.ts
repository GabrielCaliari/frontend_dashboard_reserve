/**
 * §3.4 Instagram Orgânico. Field names mirror the three endpoints listed in
 * master doc §3.4 (`followers_count`, `reach`, `accounts_engaged`,
 * `total_interactions`).
 *
 * BLOCKED (backend): `GET /portal/instagram/overview` depends on the
 * Instagram Graph API OAuth sync (master doc §4.1 "CONSTRUIR"), not built.
 */
export interface InstagramQuery {
  from: string;
  to: string;
}

export interface InstagramPost {
  id: string;
  caption: string | null;
  media_url: string;
  permalink: string;
  like_count: number;
  comments_count: number;
  timestamp: string;
}

export interface InstagramOverview {
  followers_count: number;
  followers_growth: number;
  reach: number;
  engagement: number; // curtidas + comentários + salvamentos + compartilhamentos
  engagement_rate_pct: number;
  daily_reach: { date: string; alcance_organico: number }[];
  top_posts: InstagramPost[];
}
