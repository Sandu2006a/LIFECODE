# LIFECODE App — prototype source (v3, with workout calendar)

Drop this folder into Claude Code (VS Code) and continue iterating, or hand it to Claude Code to convert into a real React Native / Expo app.

## What's inside

| File | Purpose |
|---|---|
| `LIFECODE App.html` | Entry point. Loads React + Babel + the four JSX files + CSS. Open in any browser. |
| `app.css` | All styling. Brand colors (Morning orange #c43d1f→#f5a623, Recovery violet #2a2a8e→#7a8fd9), Instrument Serif + Inter Tight. |
| `app-primitives.jsx` | Shared components: `Phone`, `Ring`, `MultiRing`, `Bar`, `Icon`, `StatusBar`, `TabBar`. |
| `app-home.jsx` | Today screen: multi-ring nutrient summary, Scan a Meal CTA, Morning + Recovery pack cards. |
| `app-workouts.jsx` | **NEW.** `WorkoutCalendar` + `WorkoutRow` + `WorkoutSheet` — weekly training calendar with add/edit bottom sheet. |
| `app-screens.jsx` | Track, Ask (chat), You (profile + subscription + workout calendar + 7-day score), Notifications, Lockscreen, Login. |

## How to run

Just open `LIFECODE App.html` in any browser — no build step.

```bash
python3 -m http.server 8000
# http://localhost:8000/LIFECODE%20App.html
```

## What's new in this version

The **You / Profile** screen now includes a **Training week** card with:

- 7-day pill strip (M–S), today underlined, selected day filled ink-black, up to 3 colored dots per day showing scheduled workout types
- ‹ › chevrons to nav weeks; header shows month + workout count + total hours
- Day detail: time-stamped workout rows with a colored accent stripe matching the type
- Dashed "+ Add workout" target — no chunky button
- Bottom-sheet (React portal mounted on `.lc-device`) for add/edit with:
  - Type picker (Strength / Cardio / Mobility / Class)
  - Italic name input
  - ± time stepper (hours + 5-min minute increments)
  - Duration pill chips (20/30/45/60/75/90/120 min)
  - Save + Delete

Workout type → brand color mapping:

| Type | Color |
|---|---|
| Strength | Morning orange gradient (#c43d1f → #f5a623) |
| Cardio | Recovery violet gradient (#2a2a8e → #7a8fd9) |
| Mobility | Ink (#0d0d0f) |
| Class | Orange → violet (#c43d1f → #4a3aa8) |

## Convert to React Native (Claude Code prompt)

> Convert the prototype in `LIFECODE App.html` into a real Expo React Native app:
> - Translate `app.css` to React Native StyleSheets / a theme file
> - Each top-level screen becomes an `app/(tabs)/...tsx` route
> - Replace `<Ring>` / `<MultiRing>` SVG with `react-native-svg`
> - The workout calendar in `app-workouts.jsx` becomes its own route or section inside the Profile tab; replace the portal-bottom-sheet with `@gorhom/bottom-sheet`
> - Persist workouts to Supabase (table `workouts` with columns: id, user_id, date, type, name, time, duration_min)
> - Add Supabase auth (use the original schema)
> - Wire the Ask tab to OpenAI through a small proxy

## Brand notes

- Logo: DNA helix mark (mono curves + 5 colored rungs alternating orange/violet). Lives in `app-screens.jsx` as `DNAHelix`. **No wordmark** — the helix is the mark.
- Type: **Instrument Serif** (italic display) + **Inter Tight** (UI body)
- Three nutrient categories: **Morning**, **Essentials**, **Recovery**
- Workout types map to those same three pillars so the design language stays coherent.
