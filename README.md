# WatchHive Frontend

WatchHive is a premium, high-fidelity, and offline-resilient social movie tracking application tailored for true cinephiles. It enables movie tracking, psychological cataloging via MindLens Analytics, custom list-stack rankings, and real-time interaction through the Swarm Social Feed.

The project is built on **React 18**, **Vite**, **TypeScript**, and **Tailwind CSS**, optimized for both desktop browsers and standalone native Progressive Web App (PWA) environments.

---

## 🌟 Key Features & Ecosystem

### 1. Interactive Landing Page Sandbox
- **MindLens Sandbox**: A responsive mood simulator dynamically computing and showing atmosphere resonance, dopamine focus, and existential depth.
- **Swarm Feed Live Buzzing**: Clickable micro-feed card components demonstrating real-time social feedback and interactive "buzzing" likes.
- **Cinematic Stacks Ranker**: Dragless ranking widgets enabling direct clicking of re-ordering keys (`▲`/`▼`) to re-arrange custom collections.

### 2. MindLens Analytics Dashboard
- Sifts through logged entries to compute and visualize custom psychological genre vectors.
- Highlights atmospheric density, mood correlations, and matches your profile with tailored movie recommendations.

### 3. Swarm Social Feed & Visibility Tiers
- Real-time social feed with comment boards, profiles, and follower moderation.
- Three privacy tiers to control your visibility footprint:
  - **Public**: Anyone in the hive can search, read, and buzz your entries.
  - **Followers Only**: Visibility is locked to approved follower accounts.
  - **Strict Private**: Social modules are locked; logs are only visible to you.

### 4. Cinematic Stacks & Collections
- Drag-and-rank arrays allowing users to build and order their ultimate cinema sagas, franchise orders, or director timelines.

### 5. Progressive Web App (PWA) Offline Sync
- **Service Worker Caching**: Fully offline-capable caching layer using local indexed storage.
- **Theater Resilience**: Syncs logged entries offline when internet is dead inside cinemas, automatically pushes queued logs once reconnected.
- **Multi-Device Installation**: Embedded standalone installation alerts with setup instructions tailored for iOS Safari, Chrome, and Android.

### 6. Mobile Adaptability
- Comprehensive layout safety wrappers designed for PWA mobile viewport sizes.
- **Mobile Central Eye Overlay**: Entry cards and watchlist cards in mobile mode feature a tap-triggered center-overlay actions display (eye-icon visibility, quick edit, dismiss controls) for elegant touch-screen use.

---

## 🛠️ Technology Stack

- **Framework**: React 18 + TypeScript (strict compilation checks)
- **Tooling**: Vite (fast builds, hot-module replacement)
- **Navigation**: React Router v6 (SPA routing with vercel redirections)
- **Styling**: Tailwind CSS + Custom Vanilla CSS (fluid glassmorphism grids)
- **Animations**: Framer Motion
- **API Client**: Axios + JWT authentication & Google OAuth integrations

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js (v18+)** installed.

### 2. Installation
Clone the repository and install npm packages:
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:5001
VITE_API_URL=http://localhost:5001/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. Running Locally
Run the local Vite development server:
```bash
npm run dev
```

### 5. Production Build & Validation
Validate strict TypeScript checks and compile the production bundle:
```bash
# Type check code
npx tsc --noEmit

# Compile assets
npm run build
```

---

## 🌐 Deployment & Architecture

- **Frontend**: Automatically deployed on [Vercel](https://vercel.com) on push to the `main` branch. The `vercel.json` file handles single-page app rewrites to `index.html`.
- **Backend API**: Hosted on [Railway](https://railway.app).
- **Service Worker**: PWA logic is registered inside `serviceWorkerRegistration.ts` to manage install state hooks and background asset caching.
