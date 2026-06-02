# WatchHive Frontend

WatchHive is a modern, premium, and offline-capable single-page application built for social movie tracking and cinematic analytics. 

This repository houses the client-side code, built with React, TypeScript, and Tailwind CSS. It is structured to be simple, modular, and easy for new developers to pick up and build on immediately.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Core** | React 18 + TypeScript | UI library using hooks and strict static typing. |
| **Build Tool** | Vite | Ultra-fast development server and production bundler. |
| **Routing** | React Router v6 | Declarative client-side routing. |
| **Styling** | Tailwind CSS + Vanilla CSS | Utility classes and custom glassmorphic layout system. |
| **HTTP Client** | Axios | Configured client with JWT header interceptors. |
| **Offline Sync** | Vite PWA Plugin | Service worker support for offline caching and native app installation. |

---

## 📂 Project Architecture

The core codebase is located under `src/watchhive/` and organized into five simple directories to separate concerns:

- **`📂 components/`**: Reusable UI blocks and layouts.
  - `auth/`: Login/signup UI layers.
  - `common/`: Core elements (modals, datepickers, buttons, loading animations).
  - `entries/`: Entry lists, item grids, and card components.
  - `profile/`: User profile widgets and watchlist grids.
- **`📂 contexts/`**: Global state providers (e.g., `AuthContext` for user sessions, `WatchlistContext` for user lists).
- **`📂 pages/`**: High-level page views (e.g., `LandingPage`, `EntriesPage`, `FeedPage`, `SearchUsersPage`).
- **`📂 services/`**: Logic files for API requests. All endpoints (Auth, Feed, Entries, Suggestions) query the API through `api.ts`.
- **`📂 types/`**: Global TypeScript interfaces (user schema, API payloads).

---

## 🚀 Sourcing & Development

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=http://localhost:5001
VITE_API_URL=http://localhost:5001/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 3. Run Locally
Start the local Vite development server:
```bash
npm run dev
```

### 4. Build & Verify
Before submitting any changes, verify strict TypeScript checks and compile the app:
```bash
# Type check code
npx tsc --noEmit

# Bundle production assets
npm run build
```

---

## 📖 Additional Resources
- **Detailed Diagrams**: To inspect sequence flows and full architecture maps, view [architecture.md](file:///Users/adityadasamantharao/Documents/Repos/WatchHive-Frontend/architecture.md).
