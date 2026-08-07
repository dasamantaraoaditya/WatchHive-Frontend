# WatchHive Frontend

WatchHive is a modern, premium, and offline-capable single-page application built for social movie tracking and cinematic analytics. 

This repository houses the client-side code, built with React, TypeScript, and Tailwind CSS. It is structured to be simple, modular, and easy for new developers to pick up and build on immediately.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Core** | React 18 + TypeScript | UI library using hooks and static type validation. |
| **Build Tool** | Vite | Ultra-fast development server and production bundler. |
| **Routing** | React Router v6 | Declarative client-side routing. |
| **Styling** | Tailwind CSS + Vanilla CSS | Utility classes and custom glassmorphic layout system. |
| **HTTP Client** | Axios | Configured client with JWT header interceptors. |
| **Offline Sync** | Vite PWA Plugin | Service worker support for offline caching and native app installation. |

---

## 📂 Project Architecture

The core codebase is located under `src/watchhive/` and organized into five simple directories to separate concerns:

- **`📂 components/`**: Reusable UI blocks and layouts (e.g. `entries/`, `profile/`, `common/`).
- **`📂 contexts/`**: Global state providers (e.g., `AuthContext`, `WatchlistContext`).
- **`📂 pages/`**: High-level page views (e.g., `LandingPage`, `EntriesPage`, `FeedPage`, `SearchUsersPage`).
- **`📂 services/`**: Logic files for API requests and endpoints query through `api.ts`.
- **`📂 types/`**: Global TypeScript interfaces.

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

### 3. Run Locally (Web)
Start the local Vite development server:
```bash
npm run dev
```

---

## 🤖 CI/CD & Build Pipelines

WatchHive features automated build verification pipelines:

### Web Deployment (Vercel)
- **Deployment**: Integrated directly with [Vercel](https://vercel.com).
- **Trigger**: Automatically builds and deploys to production on every push to the `main` branch.
- **Rewrites**: Handled via `vercel.json` to route client-side URLs seamlessly through the SPA router.

---

## 📖 Additional Resources
- **Detailed Diagrams**: To inspect sequence flows and full architecture maps, view [architecture.md](file:///Users/adityadasamantharao/Documents/Repos/WatchHive-Frontend/architecture.md).

