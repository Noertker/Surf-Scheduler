import { supabase } from './supabase';
import { SurfSession } from '@/types/session';
import { LiveForecast, degToCompass } from '@/hooks/useSessionForecasts';
import { SimilarSession } from '@/utils/conditionsMatcher';

export type CoachMode = 'week_brief' | 'pre_session' | 'post_debrief' | 'ask_coach';

// ---------------------------------------------------------------------------
// Context assembly helpers
// ---------------------------------------------------------------------------

function getStoreData() {
  const { useProfileStore } = require('@/stores/useProfileStore');
  const { useSurfboardStore } = require('@/stores/useSurfboardStore');
  const { useSessionStore } = require('@/stores/useSessionStore');

  return {
    profile: useProfileStore.getState().profile,
    boards: useSurfboardStore.getState().boards,
    sessions: useSessionStore.getState().sessions,
  };
}

function boardName(boardId: string | null, boards: { id: string; name: string }[]): string | null {
  if (!boardId) return null;
  return boards.find((b) => b.id === boardId)?.name ?? null;
}

function fmtTide(tide: { startFt: number; endFt: number } | null): string | null {
  if (!tide) return null;
  const phase = tide.endFt > tide.startFt ? 'rising' : 'falling';
  return `Tide: ${tide.startFt}→${tide.endFt}ft (${phase})`;
}

function fmtWind(wind: { avgMph: number; avgGustsMph: number; directionDeg: number } | null): string | null {
  if (!wind) return null;
  return `Wind: ${wind.avgMph}mph ${degToCompass(wind.directionDeg)} g${wind.avgGustsMph}`;
}

function fmtSwell(swell: { primaryHeightFt: number; primaryDirectionDeg: number; primaryPeriodS: number; combinedHeightFt: number; energyKj: number } | null): string | null {
  if (!swell) return null;
  return `Swell: ${swell.primaryHeightFt}ft@${swell.primaryPeriodS}s ${degToCompass(swell.primaryDirectionDeg)} | combined ${swell.combinedHeightFt}ft | ${swell.energyKj}kJ`;
}

function fmtLocalDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function fmtLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function sessionToContext(
  s: SurfSession,
  boards: { id: string; name: string }[]
): Record<string, unknown> {
  const snap = s.conditions_snapshot;
  return {
    spot_name: s.spot_name,
    planned_start: fmtLocalDateTime(s.planned_start),
    planned_end: fmtLocalTime(s.planned_end),
    rating: s.rating,
    board_name: boardName(s.board_id, boards),
    wave_type: s.wave_type,
    result_notes: s.result_notes,
    conditions: snap
      ? {
          tide: fmtTide(snap.tide),
          wind: fmtWind(snap.wind),
          swell: fmtSwell(snap.swell),
        }
      : null,
    feedback: s.feedback,
  };
}

function forecastToContext(f: LiveForecast): Record<string, unknown> {
  return {
    tide: fmtTide(f.tide),
    wind: fmtWind(f.wind),
    swell: fmtSwell(f.swell),
  };
}

// ---------------------------------------------------------------------------
// Build request body per mode
// ---------------------------------------------------------------------------

function buildRequestBody(params: {
  mode: CoachMode;
  targetSession?: SurfSession;
  forecast?: LiveForecast;
  weekForecasts?: Map<string, LiveForecast>;
  similarSessions?: SimilarSession[];
  userMessage?: string;
}): Record<string, unknown> {
  const { profile, boards, sessions } = getStoreData();

  if (!profile) throw new Error('Profile required for coaching');

  const body: Record<string, unknown> = {
    mode: params.mode,
    profile: {
      level: profile.level,
      years_experience: profile.years_experience,
      stance: profile.stance,
      goals: profile.goals,
      strengths: profile.strengths,
      weaknesses: profile.weaknesses,
      session_focus: profile.session_focus,
    },
    quiver: boards.map((b: Record<string, unknown>) => ({
      name: b.name,
      length_ft: b.length_ft,
      width_in: b.width_in,
      thickness_in: b.thickness_in,
      volume_l: b.volume_l,
      nose_shape: b.nose_shape,
      tail_shape: b.tail_shape,
      fin_setup: b.fin_setup,
      nose_rocker: b.nose_rocker,
      tail_rocker: b.tail_rocker,
    })),
  };

  const now = new Date();

  switch (params.mode) {
    case 'week_brief': {
      const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const upcoming = sessions
        .filter(
          (s: SurfSession) =>
            new Date(s.planned_start) >= now &&
            new Date(s.planned_start) <= weekAhead
        )
        .map((s: SurfSession) => {
          const ctx = sessionToContext(s, boards);
          // Merge live forecast into session context if available
          const lf = params.weekForecasts?.get(s.id);
          if (lf) {
            ctx.conditions = {
              tide: fmtTide(lf.tide),
              wind: fmtWind(lf.wind),
              swell: fmtSwell(lf.swell),
            };
          }
          return ctx;
        });
      body.upcomingSessions = upcoming;
      break;
    }
    case 'pre_session': {
      if (params.targetSession)
        body.targetSession = sessionToContext(params.targetSession, boards);
      if (params.forecast)
        body.forecast = forecastToContext(params.forecast);
      if (params.similarSessions?.length) {
        body.similarSessions = params.similarSessions.map((sm) => ({
          session: sessionToContext(sm.session, boards),
          matchReasons: sm.matchReasons,
        }));
      }
      break;
    }
    case 'post_debrief': {
      if (params.targetSession)
        body.targetSession = sessionToContext(params.targetSession, boards);
      break;
    }
    case 'ask_coach': {
      const completed = sessions
        .filter((s: SurfSession) => s.completed)
        .sort(
          (a: SurfSession, b: SurfSession) =>
            new Date(b.planned_start).getTime() -
            new Date(a.planned_start).getTime()
        )
        .slice(0, 10)
        .map((s: SurfSession) => sessionToContext(s, boards));
      body.recentHistory = completed;
      body.userMessage = params.userMessage;
      break;
    }
  }

  return body;
}

// ---------------------------------------------------------------------------
// Streaming fetch
// ---------------------------------------------------------------------------

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Stream coaching from the surf-coach edge function.
 * Calls onChunk with text fragments as they arrive.
 * Returns the full accumulated text when done.
 */
export async function streamCoaching(
  params: {
    mode: CoachMode;
    targetSession?: SurfSession;
    forecast?: LiveForecast;
    weekForecasts?: Map<string, LiveForecast>;
    similarSessions?: SimilarSession[];
    userMessage?: string;
  },
  onChunk: (text: string) => void
): Promise<string> {
  const body = buildRequestBody(params);

  // Get auth token for the request
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? SUPABASE_ANON_KEY;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/surf-coach`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Coach unavailable' }));
    throw new Error(err.error ?? `Coach error (${res.status})`);
  }

  // Parse SSE stream from Anthropic (piped through edge function)
  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;

      try {
        const event = JSON.parse(data);
        if (
          event.type === 'content_block_delta' &&
          event.delta?.type === 'text_delta'
        ) {
          const text = event.delta.text;
          fullText += text;
          onChunk(text);
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  return fullText;
}
