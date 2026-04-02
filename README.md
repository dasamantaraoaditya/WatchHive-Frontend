# WatchHive Frontend

A modern React + Vite single-page application for the WatchHive social movie tracking platform. Deployed on **Vercel** (frontend) and **Railway** (backend).

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast builds and HMR
- **Axios** for API communication
- **Framer Motion** for animations
- **React Router v6** for routing

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Variables

Create a `.env` file in the root:

```env
VITE_API_BASE_URL=http://localhost:5001
VITE_API_URL=http://localhost:5001/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Deployment

- **Frontend**: Deployed automatically on [Vercel](https://vercel.com) on push to `main`.
- **Backend**: Deployed on [Railway](https://railway.app).

The `vercel.json` handles SPA rewrites so all routes serve `index.html`.
