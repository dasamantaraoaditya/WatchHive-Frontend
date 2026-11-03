# WatchersHive Web UI/UX Standards & Design System 🐝💻

> **The Definitive Source of Truth for WatchersHive Web & PWA Design**  
> *Targeted for Web Designers, Frontend Engineers, and AI Pair Programming Agents.*  
> *Covers design rationale, CSS tokens, Tailwind classes, typography hierarchy, accessibility, web component blueprints, and platform parity with Flutter Mobile.*

---

## 🍯 1. Design Rationale & Brand Identity

### The WatchersHive Ethos
Most movie tracking and cataloging platforms (Letterboxd, Trakt, IMDb) default to cold, sterile dark themes (`#000000` or `#121212`) with clinical blue accents or muted monochrome grays. They often feel utilitarian, isolated, or algorithmic.

**WatchersHive is designed around the concept of a living, warm community — "The Hive".**
- **Warm Honey & Cream Aesthetic**: Warm amber gold (`--primary-500: #ffb700`), soothing cream backgrounds (`#FFF9F0`), elevated pure-white cards (`#ffffff`), and crisp charcoal typography (`#2D2926` / `#262626`).
- **Emotional Association**: Evokes golden cinema projector beams, buttery theater popcorn, warm vintage cinema lobbies, honeycombs, and friendly recommendations.
- **Cinematic Backdrop Overlay**: While web navigation and discovery embrace the warm cream palette, full-screen media modals (e.g., `MovieDetailsModal`, trailer lightboxes, backdrop headers) utilize ambient cinematic darkness (`#0a0a0a` / `#171717`) with golden accents so TMDb backdrop artwork pops vibrantly.

---

## 🎨 2. Core Color Palette & Design Tokens

Defined in `src/watchhive/index.css`:

### Primary & Brand Colors (Honey Gold)
| Token Name | Hex Code | CSS Variable | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Honey Gold 500 (Primary)** | `#ffb700` | `var(--primary-500)` | Brand identity, primary CTA buttons, active tab indicators, star ratings |
| **Honey Gold 600 (Dark)** | `#e59700` | `var(--primary-600)` | Hover & active button states, active navigation pill background |
| **Honey Gold 300 (Light)** | `#ffda40` | `var(--primary-300)` | Secondary highlights, rating progress rings, streak badges |
| **Honey Tint (Soft Wash)** | `rgba(255,183,0,0.12)` | `var(--primary-50)` | Tag chip fills, active sidebar background, unread notification badges |

### Backgrounds & Surfaces
| Token Name | Hex Code | CSS Variable | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Warm Cream (Scaffold)** | `#FFF9F0` | `--bg-primary` | Main web page background (desktop & mobile viewport) |
| **Pure White (Surface)** | `#ffffff` | `var(--neutral-0)` | Elevated cards, dropdown menus, modal dialog containers |
| **Surface Subdued** | `#f5f5f5` | `var(--neutral-100)` | Search bar fills, inactive tab chips, input backgrounds |
| **Surface Highest** | `#e5e5e5` | `var(--neutral-200)` | Poster skeleton placeholders, subtle dividers, borders |
| **Cinematic Dark (Backdrop)**| `#0a0a0a` | `var(--neutral-950)` | Media lightbox overlays, movie hero backdrop scrims |

### Typography & Neutrals
| Token Name | Hex Code | CSS Variable | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Charcoal Black (Primary)**| `#262626` / `#2D2926` | `var(--neutral-800)` | Primary page headings, button text on gold, body review copy |
| **Secondary Charcoal** | `#525252` | `var(--neutral-600)` | Subtitles, user handles, filter labels, tab counts |
| **Muted Slate Grey** | `#737373` | `var(--neutral-500)` | Timestamps, placeholder text, inactive icons |
| **Subtle Border** | `#e5e5e5` | `var(--neutral-200)` | Card outlines, modal dividers, inactive inputs |
| **Focused Border** | `#ffb700` | `var(--primary-500)` | Active input focus ring (`focus-visible:ring-2`) |

### Semantic System Colors
| Semantic | Hex Code | CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Success** | `#22c55e` | `var(--success-500)` | Toast alert successes, completed watch sync, friend request accepted |
| **Error** | `#ef4444` | `var(--error-500)` | Form validation errors, delete confirmations, API failure toasts |
| **Warning** | `#f59e0b` | `var(--warning-500)` | Rewatch indicators, offline mode warning banner |
| **Info** | `#3b82f6` | `var(--info-500)` | PWA install prompt, series season tags, guide tours |

---

## ♿ 3. Accessibility & Contrast Standards

> [!IMPORTANT]
> ### The Golden Contrast Rule
> All text and icons placed over **Honey Gold (`#ffb700`)**, **Warm Cream (`#FFF9F0`)**, or **Pure White (`#ffffff`)** must be **Charcoal Black (`#262626` / `#2D2926`)** or pure black (`#000000`).  
> **NEVER use white (`#ffffff`), yellow (`#ffeb89`), or light grey text over light or gold backgrounds.**

### Web Accessibility Requirements (WCAG 2.1 AA)
1. **Interactive Buttons**:
   - Primary button (`bg-[#ffb700]`): Label text must be `text-[#262626]` with `font-weight: 700` (WCAG AA ratio $\ge 4.8:1$).
   - Focus outline: Every interactive button, link, and input must have a clear `focus-visible` ring (`outline: 2px solid var(--primary-500)`).
2. **Click & Tap Targets**:
   - Minimum interactive area: `44 x 44 px` across all desktop buttons, mobile navigation icons, and modal close buttons (`p-2.5` to `p-3`).
3. **Keyboard Navigation**:
   - All modals (`Modal.tsx`, `MovieDetailsModal.tsx`) must trap keyboard focus, support `Escape` key dismissal, and autofocus the primary action or search input.
4. **Form Controls**:
   - Form inputs (`<input>`, `<textarea>`) must include associated `<label>` tags or `aria-label` attributes.
   - Placeholder text must achieve at least 4.5:1 contrast against surface backgrounds.

---

## 🔤 4. Typography Scale & Fluid Sizing

**Primary Typeface**: `'Manrope', 'Inter', -apple-system, sans-serif`  
Utilizes CSS `clamp()` for fluid responsive scaling across mobile, tablet, and desktop viewports:

```
Display Hero        clamp(1.875rem, 1.65rem + 1.125vw, 2.25rem)   ExtraBold (800)  (Landing Hero, Profile Names)
Heading 1 (H1)      clamp(1.5rem, 1.35rem + 0.75vw, 1.875rem)     Bold (700)       (Page Titles, Feed Headers)
Heading 2 (H2)      clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)       Bold (700)       (Card Titles, Modal Headers)
Heading 3 (H3)      clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem)   SemiBold (600)   (Section titles, User display names)
Body Regular        clamp(0.875rem, 0.8rem + 0.375vw, 1rem)       Regular (400)    (Reviews, bios, movie synopses)
Caption / Meta      clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)     Medium (500)     (Release dates, suggester handles)
Micro Badges        0.6875rem (11px)                              ExtraBold (800)  (GENRE, STATUS, RATING chips)
```

---

## 🧱 5. Web Component Blueprints

### 1. Primary Button (`Button.tsx`)
```tsx
// Solid Honey Gold Button
<button className="btn btn-primary font-bold text-[#262626] bg-[#ffb700] hover:bg-[#e59700] rounded-xl px-5 py-2.5 transition-all shadow-sm active:scale-95">
  {label}
</button>
```

### 2. Rating Picker (`WHRatingPicker.tsx`)
- Standardized on a **10-point scale** represented by 5 dual-halved honey gold stars (`#ffb700`).
- Interactive hover preview displaying decimal or half-star increments with large tap/click hit areas.

### 3. Glassmorphic Modal Dialog (`Modal.tsx`)
- Scrim backdrop: `bg-black/60 backdrop-blur-sm z-[3400]`.
- Dialog container: `bg-white dark:bg-[#1a1714] rounded-2xl border border-neutral-200/80 shadow-2xl p-6`.
- Header: Bold H2 title in `#262626`, right-aligned 44×44px close icon button.

### 4. Feed Card (`FeedCard.tsx`)
- Surface: `#ffffff` with subtle border `1px solid #e5e5e5` and soft drop-shadow (`var(--shadow-sm)`).
- Rounded radius: `16px` (`rounded-2xl`).
- Hover state on desktop: subtle lift (`translateY(-2px)`) and amber border highlight (`border-[#ffb700]/40`).

### 5. Floating Quick-Add Action (`QuickAddFAB.tsx`)
- Fixed bottom-right trigger (mobile: above bottom nav bar, desktop: bottom right corner).
- Circular 56×56px honey gold FAB (`#ffb700`) with smooth rotational transform on open.

---

## 📱 6. Responsive Breakpoints & Grid System

WatchersHive Web uses a 3-tier responsive layout system:

| Breakpoint | Target Device | Layout Structure |
| :--- | :--- | :--- |
| `< 768px` | Mobile (PWA & Mobile Web) | Single column feed, sticky top header with search, fixed bottom nav bar |
| `768px - 1024px` | Tablets & Foldables | 2-column layout (collapsible sidebar + primary feed content) |
| `> 1024px` | Desktop Laptops & Monitors | 3-column layout (Left Sticky Nav, Central Feed 640px max, Right Trending/Stacks sidebar) |

### Container Spacing Scale
- Page Padding Mobile: `px-4 py-3`
- Page Padding Desktop: `max-w-7xl mx-auto px-6 py-8`
- Grid Gap: `gap-4` (mobile) to `gap-6` (desktop)
- Border Radii: `rounded-xl` (12px for inputs/chips), `rounded-2xl` (16px for cards/dialogs)

---

## ✨ 7. Motion & Micro-Interactions (Framer Motion)

- **Feed Item Stagger**:
  ```tsx
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  ```
- **Modal Enter/Exit**:
  ```tsx
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 10 }}
    transition={{ duration: 0.2, ease: "easeOut" }}
  />
  ```
- **Button Tactile Press**: `whileTap={{ scale: 0.96 }}` on interactive CTA pills.

---

## 📋 8. Future Agent & Designer Checklist

Before submitting PRs touching Web UI/UX, verify:
- [ ] **Contrast**: Are all text labels on `#ffb700` or cream backgrounds `#262626` or `#000000`? (No white text on gold!).
- [ ] **Focus Rings**: Do all interactive elements show a visible focus outline when navigating via keyboard Tab?
- [ ] **Touch/Click Targets**: Are all buttons and icons at least 44×44px interactive bounding box?
- [ ] **Responsiveness**: Does the layout gracefully degrade between desktop 3-column and mobile single-column?
- [ ] **Modals**: Does pressing `Escape` close the modal and restore focus cleanly?
- [ ] **Rating Parity**: Does rating input align with the 10-point / 5-star half-step system used on mobile?
- [ ] **PWA Offline**: Does the page show the appropriate warm offline indicator when disconnected?
