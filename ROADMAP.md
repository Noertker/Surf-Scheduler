# TideCal Roadmap

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

---

## Phase 4 — AI Coach (next)

*Depends on: Profile (2a), Feedback (2b), Pattern Matching (3) — all complete*

### Infrastructure
- Anthropic API integration (`services/anthropicCoach.ts`)
- System prompt builder: assembles profile, quiver, session history, conditions
- Response streaming for conversational feel

### Four modes

| Mode | Trigger | Context Sent | Output |
|------|---------|-------------|--------|
| **Week Brief** | Manual / calendar load | Upcoming sessions + quiver + profile | Board picks per session, weekly focus drills, one coaching note |
| **Pre-Session** | Tap upcoming session | Session + conditions + quiver + profile + similar past sessions | Board pick, lineup read, 1–2 priorities, weakness heads-up |
| **Post-Session Debrief** | After feedback submitted | Completed session + feedback + conditions + profile | What conditions/board combo reveals, what to change next |
| **Ask Coach** | Freeform chat | Full profile context + recent history | Conversational Q&A |

---

## Phase 5 (v3) — Skill Pipeline & Adaptive Windows

*Depends on: Profile + Feedback history + Coach infrastructure*

### 5a. Skill Pipeline model
- 5–6 stages with parameters per stage: tide range, swell range, period preference, wind tolerance, spot type weighting
  - **Foamie/Beginner** — high tide, 1–2ft clean, beach break, foam/longboard
  - **Developing** — mid tide, 2–3ft, some wind tolerance, mid-length/fish
  - **Intermediate** — low-mid tide, 2–4ft, can read lined-up swell, shortboard viable
  - **Progressing Intermediate** — lower tides, bigger swell, backside/tube work, step-ups
  - **Advanced** — full tide range, conditions-specific board selection, seeks challenge
  - **Expert** — self-directed, app is pure logistics
- Store current stage in `surfer_profiles.skill_stage`
- Each stage has a JSON config defining acceptable/optimal/stretch ranges

### 5b. Adaptive Calendar
- Compute `fit_score` for each tide window based on skill stage
- High-fit windows highlighted / ranked higher
- Low-fit windows dimmed with contextual note ("shore dump risk at this tide phase")
- "Stretch" windows flagged as growth opportunities

### 5c. Board Recommendations
- For a given window + skill stage + quiver → recommend specific board with reasoning
- Progression nudge: suggest stepping down volume/forgiveness when conditions allow
- Surfaces in pre-session brief and inline on calendar windows

### 5d. Progression Tracking & Auto-advancement
- Aggregate feedback patterns over time
- Auto-suggest stage advancement when consistent success at upper edge of current stage
- Dashboard: progression timeline, stage history, unlock milestones

### 5e. Coach integration with pipeline
- Coach prompt gains skill stage + pipeline history
- Shifts from tips to curriculum: "you're mid-intermediate — next unlock is low-tide beach break"

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
                              Phase 5 (v3 Skill Pipeline)
```
