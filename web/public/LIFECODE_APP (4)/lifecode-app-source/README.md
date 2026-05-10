# LIFECODE App — current prototype source

This folder contains the live HTML prototype you can drop into Claude Code (VS Code) and continue iterating on, or hand to Claude Code to convert into a real React Native / Expo app.

## What's inside

| File | Purpose |
|---|---|
| `LIFECODE App.html` | Entry point. Loads React + Babel + the four JSX/CSS files below. Open this to see the app. |
| `app.css` | All styling. Colors, fonts (Instrument Serif + Inter Tight), DNA helix accents, light-mode brand colors (orange #c43d1f → amber #f5a623, navy #2a2a8e → violet #7a8fd9). |
| `app-primitives.jsx` | Shared components: `Phone` (device frame), `Ring`, `MultiRing`, `Bar`, `Icon`, etc. |
| `app-home.jsx` | The Today screen: multi-ring nutrient summary, Scan a Meal CTA, Morning Pack + Recovery Pack cards. |
| `app-screens.jsx` | Track (Morning / Essentials / Recovery toggle), Ask (chat), You (subscription card), Notifications, Lockscreen, Login. |

## How to run locally

Just open `LIFECODE App.html` in any browser — there's no build step. It uses React 18 from a CDN with in-browser Babel.

If you want hot reload while editing:

```bash
# from this folder
python3 -m http.server 8000
# then open http://localhost:8000/LIFECODE%20App.html
```

## How to ask Claude Code to convert it

Paste this into Claude Code:

> Convert the prototype in `LIFECODE App.html` into a real Expo React Native app:
> - Read `app.css` and translate to React Native StyleSheets / a theme file
> - Each `<screen>` JSX becomes an `app/(tabs)/...tsx` route
> - Replace `<Ring>` SVG with `react-native-svg`
> - Add Supabase auth (use the schema in the original handoff package)
> - Wire the Ask tab to OpenAI through a small proxy

## Brand notes (so it stays on-brand)

- Logo: DNA helix mark (mono curves + 5 colored rungs alternating orange/violet). Lives in `app-screens.jsx` as the `DNAHelix` component. **No "LIFECODE" wordmark next to it** — the helix is the mark.
- Type: **Instrument Serif** (italic display) + **Inter Tight** (UI body)
- Colors:
  - Morning gradient: `#c43d1f` → `#e26a1f` → `#f5a623`
  - Recovery gradient: `#2a2a8e` → `#4a3aa8` → `#7a8fd9`
  - Ink: `#0d0d0f`
  - Paper: `#fff`
- Three nutrient categories: **Morning** (vitamins, focus), **Essentials** (general daily — iron, calcium, omega-3, etc.), **Recovery** (rest compounds).
