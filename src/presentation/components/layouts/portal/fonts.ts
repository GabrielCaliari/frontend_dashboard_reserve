// TODO(design): PP Hatton license/files not yet in the repo (plan Assumption 7).
// `next/font/local` requires at least one `src` entry to build ("At least one font
// is required" — confirmed by attempting the next/font/local version first, per the
// plan's own documented fallback path). Once PP Hatton's .woff2 files are delivered,
// switch back to next/font/local with a real `src` array pointing at them, dropped
// into src/presentation/components/layouts/portal/fonts/. Until then, the CSS
// variable --font-portal-display is defined directly in globals.css's fallback chain
// (var(--font-portal-display, var(--portal-font-display))), so no portal page is
// blocked on the asset.
export const portalDisplayFontVariable = "--font-portal-display";
export const portalDisplayFontClassName = "font-portal-display";
