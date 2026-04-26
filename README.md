# LIFECODE

AI-powered sports nutrition and supplement tracking platform.

## Structure

```
LIFECODE/
├── web/          Next.js 15 website + dashboard
└── app/          Expo React Native mobile app (iOS + Android)
```

## Web (Next.js)

```bash
cd web
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

**Environment variables needed:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
JWT_SECRET=
```

## App (Expo)

```bash
cd app
npm install
# Edit .env with your Supabase URL and anon key
npx expo start
```

Scan the QR code with **Expo Go** on your iPhone.

**Environment variables needed:**
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_AI_PROXY_URL=
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Website | Next.js 15, Tailwind CSS, GSAP |
| Mobile | Expo (React Native), TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI | Google Gemini 2.0 Flash |
| Hosting | Vercel (web) + Expo Go / EAS (app) |
