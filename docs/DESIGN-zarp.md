# Design System: Zarp Studio — Frontend Pages

**Project:** `frontend_pages_zarpstudio-br`
**Stack:** React 19 · TanStack Router · Tailwind CSS v4 · Radix UI · Framer Motion
**Design reference:** Wise-inspired SaaS landing page — clean, confident, conversion-focused

---

## 1. Visual Theme & Atmosphere

The overall aesthetic is **bright, energetic, and trustworthy** — a SaaS marketing site that earns credibility through clarity rather than complexity. The primary experience is a **light theme**: warm off-white backgrounds, near-black ink typography, and a signature electric lime-green as the single dominant brand accent. The result feels airy but purposeful — lots of breathing room, generous rounded forms, and restrained use of color so that lime pops with full impact wherever it appears.

**Dual-mode awareness:** The site is primarily light, but several key sections deliberately invert to dark — Testimonials and the Feature Suite section use the brand's deep near-black as a full-bleed background, creating contrast-rich "punctuation" between light content zones. These are **not** governed by a system-level `.dark` class; they are hard-coded dark islands within the light page. The `--brand-ink` color (`#0E1009`) acts as the dark surface, paired with `--background` (the off-white) as the reverse foreground.

The mood is best described as: **confident minimalism with organic warmth**. The lime-green avoids being aggressive because it always lands against either ink-black or warm white, never against competing hues.

---

## 2. Color Palette & Roles

### Light Theme (Default)

| Descriptive Name | Hex Approx. | CSS Token | Role |
|---|---|---|---|
| Warm Parchment White | `#F8FAF4` | `--background` | Page background; also used as reversed foreground text inside dark sections |
| Luminous Electric Lime | `#9FE870` | `--primary` / `--brand-green` | Primary brand accent; CTA buttons, keyword highlights in headings, icon backgrounds, comparison column emphasis, badge fills |
| Deep Forest Ink | `#163300` | `--primary-foreground` / `--brand-green-deep` | Text placed on top of lime; also used for hover states on nav links and accent foreground text |
| Pale Celery Mint | `#E2F6D5` | `--secondary` / `--brand-mint` | Soft backgrounds for alternating sections (SEO Strategy strip), pill-tag backgrounds, card surface variants |
| Cool Stone Surface | `#E8EBE6` | `--muted` | Subtle container backgrounds, table headers, mobile nav pill backgrounds |
| Graphite Mist | `#868685` | `--muted-foreground` | Secondary labels, footer metadata, section eyebrow uppercase tags |
| Near-Black Ink | `#0E1009` | `--foreground` / `--brand-ink` | Primary body and heading text; also the dark section background (SuiteSoon, Testimonial strip, product subnav) |
| Smoke Charcoal | `#484B44` | `--brand-ink-soft` | Supporting body copy, paragraph text, card descriptions |
| Pastel Meadow Green | `#CDFFAD` | `--accent` | Hover tint on nav, accent surface, rarely used directly |
| Pure White | `#FFFFFF` | `--card` / `--popover` | Card and container surface in light mode |
| Alert Red | `#D03238` | `--destructive` | Destructive actions, error states, the three-dot "traffic light" close indicator in mock browser frames |

### Dark Section Palette (Inline Dark Islands)

These values apply inside sections that explicitly set `bg-[var(--brand-ink)]`:

| Descriptive Name | Hex Approx. | Usage |
|---|---|---|
| Ink Void Black | `#0E1009` | Dark section background (Testimonial, SuiteSoon, product subnav) |
| Reversed Parchment | `#F8FAF4` | Body text on dark backgrounds (`var(--background)`) |
| Lime on Dark | `#9FE870` | Icon fills, badge fills, "Saiba mais" links, heading accent text (`text-[var(--brand-green)]`) |
| Frosted Border | `rgba(255,255,255,0.10–0.15)` | Card borders in dark sections |
| Soft White Overlay | `rgba(255,255,255,0.70–0.80)` | Secondary labels on dark (e.g., "Funcionalidades" eyebrow) |

### Full Dark Mode (`.dark` class — defined, currently not used site-wide)

The Tailwind config defines a complete dark mode palette anchored in a deep desaturated navy-blue (distinct from the ink-black used inline). This palette would activate if a global dark mode toggle were implemented.

| Descriptive Name | Hex Approx. | Role |
|---|---|---|
| Abyss Navy | `#0F1423` | Dark mode page background |
| Elevated Slate | `#1A2236` | Card/popover surfaces in dark mode |
| Ice Blue | `#ECEEF5` | Primary foreground text |

---

## 3. Typography Rules

**Two-font system with strict role separation:**

### Display: Bricolage Grotesque
Used exclusively for all headings (`h1`–`h4`) and the `.display-mega` utility class. Loaded at optical sizes 12–96, with weights 500, 600, 700, and 800.

- **Hero / section titles**: Weight 700. Tracking extremely tight (`letter-spacing: -0.035em`). Line-height compressed (`line-height: 0.9`). Sizes scale fluidly: `clamp(2.05rem, 4.7vw, 5.05rem)` for the main hero, `text-4xl md:text-6xl` for section headings.
- **Card titles / feature names**: Weight 700, `tracking-tight`, slightly larger body rhythm.
- **Character**: Wide optical range means the typeface reads as editorial at large sizes and sturdy at small ones. The tight tracking and sub-1.0 line-height create a stacked, block-poster quality for main headings.

### Body: Inter
Used for all paragraph copy, navigation links, labels, captions, and UI micro-text.

- **Paragraph copy**: Weight 500 (medium), `leading-relaxed`, `font-size` 14–18px depending on context.
- **Navigation**: Weight 600 (semibold), `text-sm`.
- **Labels / eyebrows / metadata**: Weight 600–700, `uppercase`, `tracking-wider`, `text-xs`.
- **Anti-aliasing**: `-webkit-font-smoothing: antialiased` applied globally.
- **OpenType features**: `calt` and `ss01` enabled for cleaner rendering.

---

## 4. Component Stylings

### Navbar (Header) — Three-Layer Architecture

The header is the most compositionally complex element on the page. It has three distinct horizontal bands, all sticky and stacked:

**Layer 1 — Main Bar** (`h-15` mobile / `h-16` desktop):
- Background: Translucent parchment with aggressive blur — `bg-[var(--background)]/88 backdrop-blur-md`. When scrolled, content shows through frosted.
- Left: Logo SVG + horizontal nav links (desktop only). Nav links are `text-sm font-semibold` in `--brand-ink`, transitioning to `--brand-green-deep` on hover.
- Right: Two action buttons — a ghost "Entrar" (hidden on mobile) and a primary lime pill "Começar grátis" / "Teste grátis" (responsive label swap).
- Bottom border: `border-b border-[var(--border)]` — a hairline `rgba` separator.

**Layer 2 — Mobile Secondary Nav** (hidden on `md:` and above):
- A horizontally scrollable row of `rounded-full` pill chips with `bg-[var(--muted)]` and `text-xs font-semibold`. On hover, chips shift to `bg-[var(--accent)]/55` (soft pastel green).
- Scrollbar hidden via `.scrollbar-none`.

**Layer 3 — Product Feature Subnav Strip**:
- Full-width dark band: `bg-[var(--brand-ink)]` — a deliberate contrast flip from the light bars above.
- Left label: "Funcionalidades" in `text-xs uppercase tracking-wider text-white/70`.
- Feature links: `rounded-full px-3 py-1.5` ghost chips in `text-[var(--background)]` (reversed white). Hover: `bg-white/10`.
- Product icons: `text-[var(--brand-green)]` — lime on dark, high contrast.
- "Soon" badges: Lime-filled micro-pills (`bg-[var(--brand-green)] text-[var(--brand-green-deep)]`), `text-[10px] font-bold uppercase tracking-wider`.

### Buttons

All buttons use the `.btn-pill` base class — **fully pill-shaped** (`border-radius: 9999px`), `font-weight: 600`, with a subtle spring animation: `scale(1.05)` on hover, `scale(0.95)` on active press. Transition: `0.18s ease`.

- **Primary (`.btn-primary`)**: Luminous lime background (`--brand-green`) with deep forest ink text (`--brand-green-deep`). On hover, lime lightens slightly.
- **Ghost (`.btn-ghost`)**: Near-invisible — `oklch(0.28 0.09 145 / 0.08)` tinted bg (barely visible green tint) with ink text. Hover darkens the tint to `/0.14`. Used for secondary CTAs alongside primary.
- **Dark (`.btn-dark`)**: Ink-black background with parchment white text. Used when primary sits on a light or lime background (e.g., inside a green CTA block).
- **Sizing**: Responsive — `px-5 py-3` mobile, `px-6 py-3.5` desktop.

### Cards & Containers

Two interchangeable card utilities (`.card-zarp` and `.card-flat`) sharing the same visual recipe:
- **Shape**: Generously rounded at `border-radius: 30px` — notably rounder than the `--radius` base of 10px, creating a "pillow" silhouette.
- **Background**: Pure white (`--card`), occasionally overridden to brand colors contextually.
- **Border**: 1px solid `oklch(0.18 0.01 130 / 0.12)` — an ink-tinted near-invisible hairline.
- **Shadow**: Two-layer whisper-soft shadow — `0 1px 0 oklch(...0.06)` plus a `0 0 0 1px oklch(...0.08)` ring — adds subtle lift without drama.
- **Padding**: Fluid — `clamp(1.2rem, 2.3vw, 2rem)`.

### Pill Tags / Eyebrow Labels (`.pill-tag`)

Small category identifiers that open most sections. Pill-shaped (`border-radius: 9999px`), `bg-[var(--brand-mint)]` (pale celery), `text-[var(--brand-green-deep)]` (deep forest), `text-[0.78rem] font-600`. Often include a small icon at the left. On dark backgrounds, overridden to `bg-[var(--brand-green)]`.

### Feature Icon Containers

Squircle-shaped icon hosts: `h-12 w-12 rounded-2xl bg-[var(--brand-mint)]` with the icon itself in `text-[var(--brand-green-deep)]`. Inside dark sections, background shifts to `bg-[var(--brand-green)]` with ink-colored icons.

### Inputs / Forms

Defined in the token system but minimal UI presence in the current pages. Input surfaces use `--input` (`oklch(0.88 0.01 130)` — a light warm gray), with `--border` ring. Focus states: `outline: 2px solid oklch(0.28 0.09 145 / 0.45)` with `outline-offset: 2px` and `border-radius: 0.9rem` — the focus ring is notably rounded, matching the pill design language.

### Dark Section Cards (SuiteSoon)

Inside dark (`--brand-ink`) backgrounds, cards become borderless frosted containers: `rounded-[28px] border border-white/15`, transparent fill, hover → `border-[var(--brand-green)]`. Text uses parchment white with `opacity-75` for supporting copy.

---

## 5. Layout Principles

**Constraint:** All content is capped at `max-w-7xl` (1280px) with horizontal padding `px-5 lg:px-8`, keeping lines readable and layouts breathing.

**Grid system:** Two-column `lg:grid-cols-2` (or asymmetric `[1.1fr_0.9fr]`) on large screens, single column on mobile. Grid gaps are generous: `gap-10 lg:gap-12`.

**Section rhythm:** Vertical breathing room is consistent — `py-16 md:py-24` for all interior sections, creating a steady pulse. Sections that bleed full-width (SeoStrategy, SuiteSoon, Testimonial, Footer) override the container max-width at the section level but keep content constrained inside.

**Background texture:** The body has a subtle dual-radial gradient: a green-tinged bloom from `top-left (12%, -8%)` at 40% spread, and a soft warm wash from `top-right (90%, 10%)` at 48%. This adds organic warmth without adding visual weight.

**Imagery:** The hero image uses a `rounded-[30px] sm:rounded-[40px]` container with `bg-[var(--brand-mint)]` as a fallback/border, bleeding to the card's pillow form.

**Mock UI decorations:** Several cards contain "fake browser" or skeleton UI mockups using the design tokens directly — `bg-[var(--brand-mint)]`, `bg-[var(--muted)]`, `bg-[var(--brand-green)]` blocks — as visual metaphors, not real screenshots.

**Scrollbar hiding:** Horizontal scroll tracks on the mobile nav and product subnav are hidden via `.scrollbar-none` for a native, frameless feel.

**Animation:** Framer Motion drives entrance animations — staggered fade-up for hero children (`staggerChildren: 0.14`, `delayChildren: 0.08`), `y: 26 → 0` with a custom ease `[0.2, 0.9, 0.2, 1]`. The animated word highlight in the hero uses `AnimatePresence mode="wait"` with blur-fade transitions (`filter: blur(6px)` → `blur(0px)`).

---

## 6. Dark Content Zones — When and How

The design has three flavors of "dark" content, each with a distinct intent:

| Zone | Method | Background | Text | Use Case |
|---|---|---|---|---|
| Testimonial block | `rounded-[40px] bg-[var(--brand-ink)]` | Ink black `#0E1009` | Parchment white | Single pull quote, avatar, citation |
| SuiteSoon section | Full-section `bg-[var(--brand-ink)]` | Ink black `#0E1009` | Parchment + lime | Product feature grid with coming-soon cards |
| Product subnav strip | `bg-[var(--brand-ink)]` | Ink black `#0E1009` | White/70 + lime icons | Always-visible feature navigation below main bar |
| Lime CTA block | `bg-[var(--brand-green)]` | Electric lime `#9FE870` | Deep forest `#163300` | Bottom-of-page conversion section |

None of these use a `.dark` class toggle — they are **always-dark structural zones** within a light-first layout. This pattern allows controlled inversion without theming complexity.
