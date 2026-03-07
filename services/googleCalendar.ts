import { SurfSession } from '@/types/session';

const GCAL_BASE = 'https://www.googleapis.com/calendar/v3';

async function getToken(): Promise<string | null> {
  const { useAuthStore } = require('@/stores/useAuthStore');
  return useAuthStore.getState().getGoogleAccessToken();
}

async function gcalFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  if (!token) throw new Error('Not authenticated with Google');

  const res = await fetch(`${GCAL_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // If 401, try refreshing and retry once
  if (res.status === 401) {
    const { useAuthStore } = require('@/stores/useAuthStore');
    const freshToken = await useAuthStore.getState().getGoogleAccessToken();
    if (!freshToken) throw new Error('Google token refresh failed');

    return fetch(`${GCAL_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshToken}`,
        ...options.headers,
      },
    });
  }

  return res;
}

function buildDescription(session: SurfSession): string {
  const lines: string[] = [];
  if (session.tide_start_ft != null && session.tide_end_ft != null) {
    lines.push(`Tide: ${session.tide_start_ft.toFixed(1)} \u2192 ${session.tide_end_ft.toFixed(1)} ft`);
  }
  if (session.avg_wind_mph != null) {
    lines.push(`Wind: ${session.avg_wind_mph} mph${session.avg_gusts_mph ? ` (gusts ${session.avg_gusts_mph})` : ''}`);
  }
  if (session.avg_swell_ft != null) {
    lines.push(`Swell: ${session.avg_swell_ft} ft`);
  }
  if (session.notes) lines.push(`\n${session.notes}`);
  return lines.join('\n');
}

function buildEventBody(session: SurfSession) {
  return {
    summary: `Surf: ${session.spot_name}`,
    location: session.spot_name,
    description: buildDescription(session),
    start: {
      dateTime: session.planned_start,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: session.planned_end,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };
}

export async function createGCalEvent(session: SurfSession): Promise<string> {
  const res = await gcalFetch('/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify(buildEventBody(session)),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Google Calendar error: ${err.error?.message ?? res.statusText}`);
  }
  const event = await res.json();
  return event.id as string;
}

export async function updateGCalEvent(eventId: string, session: SurfSession): Promise<void> {
  const res = await gcalFetch(`/calendars/primary/events/${eventId}`, {
    method: 'PUT',
    body: JSON.stringify(buildEventBody(session)),
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.json();
    throw new Error(`Google Calendar error: ${err.error?.message ?? res.statusText}`);
  }
}

export async function deleteGCalEvent(eventId: string): Promise<void> {
  const res = await gcalFetch(`/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
  });
  // 404/410 = already deleted, which is fine
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error('Failed to delete Google Calendar event');
  }
}

export async function isGCalAvailable(): Promise<boolean> {
  const token = await getToken();
  return token != null;
}
