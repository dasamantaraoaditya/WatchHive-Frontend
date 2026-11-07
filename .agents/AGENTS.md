# WatchHive Frontend — Agent Context & Architectural Guidelines

> **Repository Master Reference**  
> Runtime: Browser / PWA (Service Worker with Workbox)  
> Framework: React 18 + TypeScript + Vite 5 + React Router v6  
> Styling: Vanilla CSS Tokens (`src/watchhive/index.css`) + Tailwind utility classes (`clsx`, `tailwind-merge`)  
> Animations: Framer Motion  
> API Client: Custom Axios client with JWT refresh queue & TMDb in-memory SWR cache (`src/watchhive/services/api.ts`)

---

## 🏛️ 1. Architecture & Key Directories

```
src/
├── main.tsx                         # Entry point (PWA registration)
├── serviceWorkerRegistration.ts     # Workbox PWA service worker handler
└── watchhive/
    ├── WatchHiveApp.tsx             # Root router, shell layout, modal manager
    ├── index.css                    # Master design tokens & component CSS
    ├── components/
    │   ├── layout/                  # Sidebar, TopBar, BottomNav, QuickAddFAB
    │   ├── common/                  # Skeletons, Modal, OfflineBanner, DonationButton
    │   ├── entries/                 # EntryForm, LogWatch, Watchlist cards
    │   ├── feed/                    # Feed cards, SmartSuggest, trending carousel
    │   ├── mindlens/                # Radar charts, taste profile visualizations
    │   └── onboarding/              # WatchPreferencesModal
    ├── contexts/                    # Global React Contexts
    │   ├── AuthContext.tsx          # JWT session, user hydration, passwordless login
    │   ├── WatchlistContext.tsx     # Optimistic watchlist mutation & toast alerts
    │   ├── NotificationContext.tsx  # Unread counts & SSE / polling
    │   ├── UIContext.tsx            # Modals, drawer state, mobile responsiveness
    │   └── CustomAlertContext.tsx   # Custom themed alerts/dialogs
    ├── services/                    # Typed API endpoints (Axios singleton)
    │   ├── api.ts                   # Axios interceptor, auto-refresh, TMDb SWR cache
    │   ├── authService.ts, userService.ts, entries.service.ts
    │   ├── feed.service.ts, mindlens.service.ts, suggestions.service.ts
    │   └── data.service.ts, pushNotification.service.ts
    └── types/                       # API contracts & component prop types
```

---

## 🎨 2. UI/UX Rules & Visual Standards

1. **Brand Colors**:
   - Primary: `#FFB700` (`--primary-500`)
   - Hover / Active: `#E59700` (`--primary-600`)
   - Background: `#FFF9F0` (`--bg-primary`, Warm Cream)
   - Surface / Cards: `#FFFFFF` (Pure White with subtle border `rgba(0,0,0,0.06)`)
   - Text: `#262626` / `#2D2926` (Charcoal Black)
2. **The Golden Contrast Rule**:
   - NEVER put white text on Honey Gold (`#FFB700`) or Cream (`#FFF9F0`). Always use Charcoal Black (`#262626`).
3. **Loader Rules**:
   - **Primary**: Skeleton Loaders (`skeleton-box`, `animate-pulse`). Used on feed items, movie cards, carousels, profile tabs.
   - **Secondary**: Bee Loader (`AppLoadingScreen`). Used ONLY on initial cold start or blocking operations.
4. **Ratings**:
   - 10-point scale (0.5–10.0), rendered with 5 dual-halved golden stars.

---

## 🚀 3. Routing & Deep Link Rules

- Root path redirects: `/watch-hive` is the primary namespace.
- Public routes: `/watch-hive/login`, `/watch-hive/signup`, `/watch-hive/verify-email`, `/watch-hive/forgot-password`.
- Protected routes: `/watch-hive/feed`, `/watch-hive/entries`, `/watch-hive/profile`, `/watch-hive/mindlens`, `/watch-hive/rankings`, `/watch-hive/search`.
- Deep link redirects: Clean root paths like `/feed`, `/login`, `/profile/:id` automatically redirect to `/watch-hive/*`.

---

## ⚡ 4. API Client & Caching (`src/watchhive/services/api.ts`)

- **TMDb SWR In-Memory Cache**:
  - Automatically caches TMDb calls (`/tmdb/*`) for 10m to 24h depending on route.
  - In-flight request deduplication prevents duplicate queries.
  - User and feed data pass through directly to guarantee fresh updates.
- **Silent Token Refresh**:
  - Intercepts 401 errors, enqueues pending calls, requests new access token with refresh token, and replays requests.

---

## 🛠️ 5. Standard Commands

- Development: `npm run dev` (Vite dev server on port 3000)
- Staging mode: `npm run dev:staging`
- Build: `npm run build` (`tsc && vite build`)
- Staging build: `npm run build:staging`
- Preview: `npm run preview`
- E2E Tests: `npm run test:ui` (Playwright)
- Lint: `npm run lint`
