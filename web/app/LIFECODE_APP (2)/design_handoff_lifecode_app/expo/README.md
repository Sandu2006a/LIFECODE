# LIFECODE — Expo React Native app

Production-ready Expo + React Native + TypeScript codebase that recreates the
LIFECODE design prototype, with working Supabase auth and a real AI assistant.

## Quick start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Fill in EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY,
# and EXPO_PUBLIC_AI_PROXY_URL.

# 3. Database
# In Supabase, run supabase/schema.sql in the SQL editor.

# 4. AI proxy
# Deploy server/ai-proxy.ts to Vercel (or Cloudflare Workers).
# Set ANTHROPIC_API_KEY as a server-only env var.
# Put the deployed URL in EXPO_PUBLIC_AI_PROXY_URL.

# 5. Run
npx expo start
# Scan the QR with the "Expo Go" app on your phone.
```

## Folder map
```
app/
  _layout.tsx              auth gate + font loader
  (auth)/login.tsx         email + password sign-in / sign-up
  (tabs)/_layout.tsx       bottom tab bar
  (tabs)/index.tsx         Today
  (tabs)/track.tsx         Track (segmented + ingredient list + composer)
  (tabs)/ask.tsx           AI chat (real)
  (tabs)/you.tsx           Profile + sign out
components/
  Ring.tsx                 animated SVG ring with brand gradient
  Bar.tsx                  animated gradient progress bar
  GradientText.tsx         masked-view + linear gradient
  Eyebrow.tsx              uppercase label
lib/
  supabase.ts              Supabase client (AsyncStorage session)
  ai.ts                    fetches your AI proxy
  data.ts                  Morning + Recovery ingredient lists
server/
  ai-proxy.ts              edge function holding the Anthropic key
supabase/
  schema.sql               profiles · intake_logs · food_logs · conversations + RLS
theme.ts                   colors / fonts / radii — synced with web
```

## Connecting to your existing web (lifecode-web)
Both apps share the same Supabase project. Use the same `SUPABASE_URL` and
`SUPABASE_ANON_KEY` on both. A user signs up on web → can log in here with the
same credentials → sees the same data.

## Production builds
```bash
npm install -g eas-cli
eas login
eas build --platform ios       # TestFlight
eas build --platform android   # internal testing
```
