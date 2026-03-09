# Kairo Surf Roadmap

## What's Done (MVP)
- Spots + tide preferences with region grouping
- 7-day calendar with tide windows + swell/wind forecasts per window
- Session scheduling with Google Calendar sync
- Surfboard quiver manager with full specs
- Session result logging (rating, board, wave type, notes)
- Google OAuth + anonymous-to-authenticated migration
- Dark/light theme, responsive layout (mobile + web)

## What's Done (Phase 1–3)
- **Auth gate + onboarding**: 3-page swipeable onboarding with marketing copy, email/password + Google sign-in, entire app behind auth
- **RLS tightened**: reads allow own + anonymous rows, writes require authenticated user_id
- **Schema expansion**: `conditions_snapshot` JSONB, `feedback` JSONB, rating 1–10, `surfer_profiles` table with enums
- **Surfer Profile UI**: ProfileEditor modal (level, stance, experience, goals/strengths/weaknesses multi-select, session focus), ProfileSection display in Surfer tab
- **Expanded Session Feedback form**: 1–10 rating chips, wave count, board picker + board feel, focus goals multi-select, what clicked/didn't, conditions snapshot frozen at feedback time
- **Surfer tab as default route**, Account section cleaned up (sign-out only)
- **Feedback auto-prompt**: auto-opens feedback modal on Sessions tab when un-logged past sessions detected, dismissible per visit, resets on app foreground
- **Historical pattern matching**: upcoming session cards show "Similar Past Sessions" panel matching on swell height (±1ft), tide phase (rising/falling), and wind character (offshore/onshore/cross relative to spot's swell window)

## What's Done (Phase 4)
- **AI Coach**: Anthropic API via Supabase Edge Function with SSE streaming
  - Four modes: Week Brief, Pre-Session, Post-Session Debrief, Ask Coach
  - System prompt with surf expertise, board selection, progression knowledge
  - Context assembly: profile, quiver, sessions, forecasts, similar sessions
  - Streaming UI in Coaching section + Coach Debrief button on completed sessions

## What's Done (Phase 5a — Progression Framework)
- **Progression data model**: 16 sub-levels across 5 levels (1a–5b) with skill descriptions, ideal conditions, board recommendations, drills, progression signals
- **Progression UI**: Vertical roadmap with bubbles + lines, expandable detail cards, "Set as Current Level" button
- **Profile integration**: `skill_stage` column on `surfer_profiles`, flows through to coach context
- **Coach integration**: Edge function system prompt includes full progression stage map, tailors advice to current stage

---

## Phase 5b — Onboarding Redesign

Streamline onboarding into a single guided flow that feeds directly into the progression framework. Replace the standalone profile editor with an integrated first-run experience.

**Flow:** Sign up → Basic surfer info → Suggested progression level → Set surf spots → Find a session

### Steps
1. **Sign up** — email/password or Google (existing)
2. **Basic surfer info** — stance, experience level, how often you surf (minimal questions, no duplication)
3. **Set progression level** — auto-suggest a starting stage based on onboarding answers, user can adjust up/down on the roadmap UI
4. **Set surf spots** — pick from spot list or add custom (existing spot picker, surfaced earlier in flow)
5. **Find a session** — land on calendar with first surf window highlighted, ready to book

### Notes
- Old ProfileEditor becomes an edit-only screen (not part of first-run)
- Progression ladder is the primary way to set/view skill level
- Onboarding answers map to progression suggestions (e.g. "I can catch green waves" → 2a, "I ride a shortboard" → 3b+)
- Minimize duplicate data entry — derive what you can from progression stage selection

---

## Phase 6 — Forecast Visualization

### 6a. Swell & Wind Compass
- Circular compass graphic showing swell direction + power and wind direction + power as arrows
- Arrows point inward toward center (e.g. west coast: WNW swell arrow from left, offshore = easterly wind arrow from right)
- Arrow size/thickness scales with power (swell height × period energy, wind speed)
- Color-coded: swell in chart cyan, wind in chart red
- Surfaces on session cards and calendar windows

### 6b. Enhanced Forecast Cards
- Replace raw numbers with visual indicators
- Tide phase icon (rising/falling arrow), swell quality badge, wind quality badge
- "Conditions score" summary per window

---

## Phase 7 — Global Spots & Custom Spots

### 7a. Spot Discovery
- Expandable spot database beyond West Coast
- Region-based browsing (US East Coast, Hawaii, Central America, Europe, etc.)
- Spot metadata: break type, bottom, best swell direction, best tide, best wind, difficulty level

### 7b. Custom Spots
- User-created spots with location pin (lat/lng)
- Swell window direction, preferred tide range, break type
- Forecast data sourced from nearest NOAA/open-source buoy + tide station
- Share spots with other users (optional, future)

### 7c. Spot-Level Fit Score
- Per-spot conditions matching based on surfer's progression stage
- "This spot works for your level today" indicators

---

## Phase 8 — Adaptive Calendar & Board Recs

### 8a. Adaptive Calendar
- Compute `fit_score` for each tide window based on skill stage
- High-fit windows highlighted / ranked higher
- Low-fit windows dimmed with contextual note ("shore dump risk at this tide phase")
- "Stretch" windows flagged as growth opportunities

### 8b. Board Recommendations
- For a given window + skill stage + quiver → recommend specific board with reasoning
- Progression nudge: suggest stepping down volume/forgiveness when conditions allow
- Surfaces in pre-session brief and inline on calendar windows

### 8c. Progression Tracking & Auto-advancement
- Aggregate feedback patterns over time
- Auto-suggest stage advancement when consistent success at upper edge of current stage
- Dashboard: progression timeline, stage history, unlock milestones

---

## Dependency Graph

```
Phase 1 (Schema)
  ├── Phase 2a (Profile)  ──┐
  └── Phase 2b (Feedback) ──┤
                             ├── Phase 3 (Pattern Matching)
                             │      │
                             │      v
                             └── Phase 4 (AI Coach)
                                    │
                                    v
                              Phase 5a (Progression Framework)
                                    │
                              ┌─────┼─────┐
                              v     v     v
                        Phase 6  Phase 5b  Phase 7
                     (Forecast) (Onboard) (Spots)
                              │     │     │
                              └─────┼─────┘
                                    v
                              Phase 8
                        (Adaptive Calendar)
```
