---
name: test
description: Guidelines for running Playwright end-to-end (E2E) UI tests and testing PWA service worker caching on WatchHive Frontend.
---

# Testing Skill — WatchHive Frontend

## Test Suite Execution

### Running Playwright E2E UI Tests
```bash
npm run test:ui
```
Runs Playwright test runner covering:
- Authentication & login state
- Service Worker registration and offline behavior
- Web app manifest integrity
- Install prompt banner display

### Running Headless Playwright
```bash
npx playwright test
```

### TypeScript Type-Checking
Verify there are zero strict type-checking regressions across all components and contexts:
```bash
npx tsc --noEmit
```
