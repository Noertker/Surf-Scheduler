# Kairo Surf

A surf session scheduling app built with Expo (React Native) and Supabase. Displays tide windows, wind, and swell forecasts to help you plan optimal surf sessions. Supports Google Calendar auto-sync.

## Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
- Docker (for Supabase local development)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start Supabase

```bash
supabase start
```

This runs PostgreSQL, Auth, and the REST API locally. Migrations in `supabase/migrations/` are applied automatically.

### 3. Configure environment

Create `.env.local` in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase start output>
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<your Google OAuth client ID>
GOOGLE_OAUTH_CLIENT_ID=<same Google OAuth client ID>
GOOGLE_OAUTH_CLIENT_SECRET=<your Google OAuth client secret>
```

The `EXPO_PUBLIC_` vars are bundled into the client. The `GOOGLE_OAUTH_*` vars (without the prefix) are used by the Supabase Auth server via `supabase/config.toml`.

### 4. Configure Edge Function secrets

Create `supabase/.env.local` with the Google OAuth credentials for the token refresh Edge Function:

```env
GOOGLE_OAUTH_CLIENT_ID=<your Google OAuth client ID>
GOOGLE_OAUTH_CLIENT_SECRET=<your Google OAuth client secret>
```

This file is gitignored. The Edge Function uses these server-side to refresh expired Google access tokens without exposing the client secret to the browser.

### 5. Start the Edge Function

```bash
supabase functions serve --env-file supabase/.env.local
```

This serves the `refresh-google-token` function locally at `http://127.0.0.1:54321/functions/v1/refresh-google-token`.

### 6. Start the app

```bash
npm start
```

Then press `w` for web, `i` for iOS simulator, or `a` for Android emulator.

## Google Calendar Setup

To enable Google Calendar auto-sync:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project
2. Enable the **Google Calendar API**
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorized redirect URIs:
   - `http://127.0.0.1:54321/auth/v1/callback`
5. Add authorized JavaScript origins:
   - `http://localhost:8081`
6. Copy the Client ID and Client Secret into both `.env.local` files (see steps 3 and 4 above)

## Deploying OTA Updates

Push an over-the-air update to devices on the `preview` channel:

```bash
npm run ota "your update message"
```

This runs `eas update --branch preview --message "..."`.

## Project Structure

```
app/                  Expo Router screens (tabs: Calendar, Schedule, Surfer)
components/           UI components organized by feature
  calendar/           Calendar grid, day detail, tide charts
  schedule/           Session cards, result editor
  surfer/             Spot preferences, quiver, account
  shared/             Themed Text/View wrappers
services/             API clients (Supabase, NOAA, Open-Meteo, Google Calendar)
stores/               Zustand state management
hooks/                Custom React hooks
types/                TypeScript type definitions
utils/                Utility functions (tide window calculation)
supabase/
  migrations/         Database schema migrations
  functions/          Edge Functions (Deno runtime)
constants/            Theme colors, config
```

## Tech Stack

- **Frontend**: React Native + Expo SDK 55, Expo Router
- **State**: Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Data Sources**: NOAA (tides), Open-Meteo (wind/swell), Google Calendar API
- **Auth**: Google OAuth via Supabase Auth
