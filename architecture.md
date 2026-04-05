# WatchHive Frontend Architecture & Tech Stack

## Overview
This document outlines the technology stack and architectural design of the WatchHive frontend application. 

> **💡 Note for viewing diagrams:** Standard Markdown doesn't natively support zoom, pan, and fullscreen out of the box. 
> To view these diagrams interactively (with scroll to zoom, click & drag to pan, and a fullscreen toggle button), please open the `architecture-viewer.html` file in your web browser. 

## Technology Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Core Framework** | **React (v18)** | The primary library for building the user interface. Uses functional components and React Hooks heavily. |
| **Language** | **TypeScript** | Adds static typing to JavaScript to improve developer experience and catch errors early. |
| **Build Tool** | **Vite (v5)** | A fast frontend build tool used for serving the app during development and bundling for production. |
| **Routing** | **React Router (v6)**| Declarative routing for React applications to handle navigation between pages. |
| **HTTP Client** | **Axios** | Promise-based HTTP client for the browser to interact with the backend API. |
| **Animations** | **Framer Motion**| A production-ready motion library for React to handle UI animations smoothly. |
| **PWA Support** | **Vite PWA Plugin**| Enables Progressive Web App features such as offline support, service workers, and caching capabilities (`vite-plugin-pwa`). |
| **State Mgt.** | **React Context** | Used across the App for managing global states (e.g. `AuthContext`, `NotificationContext`, `WatchlistContext`). |
| **Testing** | **Playwright** | Used for End-to-End (E2E) testing (`@playwright/test`). |
| **Styling** | **Vanilla CSS** | Standard CSS used for component and page-level styling. |

---

## High-Level Architecture

The architecture follows a standard component-service design pattern. The application is segregated into distinct layers for modularity and scalability.

**Interactive Diagram**: *You can click on the colored nodes below to navigate directly to the corresponding source code definitions.*

```mermaid
graph LR
    %% Style Definitions for visual clarity
    classDef clientNode fill:#fcfcfc,stroke:#333,stroke-width:2px,color:#333;
    classDef reactNode fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#0d47a1;
    classDef stateNode fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px,color:#4a148c;
    classDef serviceNode fill:#fff8e1,stroke:#fbc02d,stroke-width:2px,color:#f57f17;
    classDef backendNode fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,color:#1b5e20;

    Client((Client Browser)):::clientNode

    subgraph "Frontend Application Core"
        Main["main.tsx (Entry)"]:::reactNode
        Router["WatchHiveApp.tsx (Router)"]:::reactNode
        
        subgraph "Global State"
            direction TB
            AuthCtx["AuthContext"]:::stateNode
            NotifCtx["NotificationContext"]:::stateNode
            WatchCtx["WatchlistContext"]:::stateNode
        end
        
        subgraph "UI Presentation Layer"
            direction TB
            Pages["Page Views (e.g. Feed, Profile)"]:::reactNode
            Comps["Shared UI Components"]:::reactNode
        end

        subgraph "Service Layer"
            direction TB
            AuthSvc["Auth Service"]:::serviceNode
            FeedSvc["Feed Service"]:::serviceNode
            AxiosClient["api.ts (Axios Config)"]:::serviceNode
        end
    end

    Backend[("Backend API<br/>http://localhost:5001")]:::backendNode
    SW{{"Service Worker<br/>(Vite PWA Offline Support)"}}:::serviceNode

    %% Core Data Flow Lines
    Client -->|Initial Load| Main
    Client -->|Intercepts Requests| SW
    SW -.->|Serves Cached Assets| Client

    Main --> Router
    Router --> AuthCtx
    Router --> NotifCtx
    Router --> WatchCtx

    AuthCtx & NotifCtx & WatchCtx --> Pages
    Pages --> Comps
    Pages --> FeedSvc
    Pages --> AuthSvc
    
    FeedSvc & AuthSvc --> AxiosClient
    AxiosClient -->|Authenticated REST Calls| Backend

    %% Adding Interactive Links
    click Main "src/main.tsx" "Open main.tsx"
    click Router "src/watchhive/WatchHiveApp.tsx" "Open Router Definition"
    click AuthCtx "src/watchhive/contexts/AuthContext.tsx" "Open Auth Context"
    click NotifCtx "src/watchhive/contexts/NotificationContext.tsx" "Open Notification Context"
    click AxiosClient "src/watchhive/services/api.ts" "Open Axios Setup"
    click AuthSvc "src/watchhive/services/authService.ts" "Open Auth Service"
    click FeedSvc "src/watchhive/services/feed.service.ts" "Open Feed Service"
```

---

## Directory Structure Representation

The repository structure inside `src/watchhive/` cleanly groups related responsibilities:

```mermaid
graph TD
    classDef folder fill:#ffeb3b,stroke:#f57f17,stroke-width:2px,color:#333;
    classDef file fill:#e0f7fa,stroke:#00838f,stroke-width:1px,color:#006064;

    Root["📂 src/watchhive"]:::folder
    Components["📂 components"]:::folder
    Contexts["📂 contexts"]:::folder
    Pages["📂 pages"]:::folder
    Services["📂 services"]:::folder
    Types["📂 types"]:::folder

    Root --> Components
    Root --> Contexts
    Root --> Pages
    Root --> Services
    Root --> Types
    
    Components --> AuthC["📂 auth"]:::folder
    Components --> CommonC["📂 common"]:::folder
    Components --> FeedC["📂 feed"]:::folder
    
    Contexts --> AuthContextC["📄 AuthContext.tsx"]:::file
    Contexts --> NotifContextC["📄 NotificationContext.tsx"]:::file
    
    Pages --> FeedP["📄 FeedPage.tsx"]:::file
    Pages --> LoginP["📄 LoginPage.tsx"]:::file
    
    Services --> ApiS["📄 api.ts"]:::file
    Services --> AuthS["📄 authService.ts"]:::file
    
    Types --> ApiT["📄 api.types.ts"]:::file

    %% Interactive Links
    click Components "src/watchhive/components"
    click Contexts "src/watchhive/contexts"
    click Pages "src/watchhive/pages"
    click Services "src/watchhive/services"
    click Types "src/watchhive/types"
```

---

## Data Flow (Example: Fetching the User's Feed)

This diagram visualizes how data requests flow through the React application structure — from user interaction down to the backend.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (User)
    participant Component as FeedPage (UI Component)
    participant Service as feed.service.ts (Logic)
    participant API as api.ts (Axios Interceptor)
    participant Backend as Express API Server
    
    User->>Component: Opens Feed Page
    
    Component->>Service: invoke getFeed()
    Service->>API: axios.get('/api/feed')
    
    Note over API: Axios automatically attaches <br/> JWT from localStorage
    
    API->>Backend: HTTP GET /api/feed
    
    Backend-->>API: 200 OK + JSON Results
    API-->>Service: AxiosResponse<Data>
    Service-->>Component: Returns Array of Feed Items
    
    Component->>Component: setFeedPosts(data)
    Component-->>User: Renders Feed Items dynamically
```

## Progressive Web App (PWA) Capabilities

- The app uses `vite-plugin-pwa` with `autoUpdate` registerType.
- Caching strategies are defined in `vite.config.ts` using `workbox`.
- **Google Fonts** rely on `CacheFirst`.
- **API calls** (`/api/.*`) use `NetworkFirst` to gracefully handle offline scenarios.
- **Images** use `StaleWhileRevalidate`.
- Intercepts navigation requests using `navigateFallback: 'index.html'` to avoid standard 404 behavior and allow React router to render appropriate catch-all layouts.
