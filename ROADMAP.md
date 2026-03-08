# TideCal Roadmap

## What's Done (MVP)
- Spots + tide preferences with region grouping
- 7-day calendar with tide windows + swell/wind forecasts per window
- Session scheduling with Google Calendar sync
- Surfboard quiver manager with full specs
- Session result logging (rating, board, wave type, notes)
- Google OAuth + anonymous-to-authenticated migration
- Dark/light theme, responsive layout (mobile + web)

---

## Phase 1 — Data Model Foundation

Everything downstream depends on these schema changes.

### 1a. Expand Session model
- Add `status` enum: `upcoming` | `completed` (replaces `completed` boolean)
- Add `conditions_snapshot` JSONB — frozen at feedback submission time (not at scheduling) so the snapshot reflects the most accurate forecast closest to the actual session
- Expand rating from 1–5 to 1–10
- Add `feedback` JSONB: `{ waveCountEstimate, boardFeelRating, focusGoalsWorked[], whatClicked, whatDidnt }`

### 1b. Surfer Profile table
- New `surfer_profiles` table: `user_id` (PK FK), `level` (enum: beginner→expert), `years_experience`, `stance` (regular/goofy), `goals` (text[]), `strengths` (text[]), `weaknesses` (text[]), `session_focus` (free text)
- RLS: user sees only their own
- New Zustand store: `useProfileStore`

---

## Phase 2 — Surfer Profile UI + Session Feedback

These are independent and can be built in parallel.

### 2a. Surfer Profile screen
- New section in the Surfer tab (replace "Coaching" placeholder)
- Form: level picker, years experience, stance toggle, goals multi-select (paddle power, pop-up speed, bottom turns, cutbacks, tube riding, reading lineups, wave selection, etc.), strengths/weaknesses multi-select, free-text session focus
- Persists to `surfer_profiles` via `useProfileStore`

### 2b. Session Feedback flow
- When a session's `planned_end` has passed and status is `upcoming`, prompt for feedback
- Feedback form (modal or inline on SessionCard):
  - Overall rating 1–10 slider
  - Wave count estimate (numeric input)
  - Board picker (from quiver)
  - Board feel rating 1–10
  - Focus goals worked (multi-select from profile goals)
  - Free-text: "what clicked" / "what didn't"
- On submit: freeze current conditions into `conditions_snapshot`, write feedback JSON, set status to `completed`
- Frozen conditions display alongside feedback as permanent record

---

## Phase 3 — Historical Pattern Matching

*Depends on: Phase 1 (conditions snapshots) + Phase 2b (feedback data)*

- When viewing an upcoming session, query past completed sessions at the same spot where:
  - Swell height within ±1ft
  - Same tide phase (rising/falling/high/low — derived from snapshot)
  - Similar wind character (offshore vs onshore vs cross)
- Display as "Similar Past Sessions" panel on session detail:
  - Date, rating, board used, key feedback note, conditions summary
- Client-side filtering via Supabase query — no AI needed
- Empty state: "No similar sessions yet — keep logging!"

---

## Phase 4 — AI Coach

*Depends on: Profile (2a), Feedback (2b), Pattern Matching (3)*

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
