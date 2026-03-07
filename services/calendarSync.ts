import { Platform } from 'react-native';
import { SurfSession } from '@/types/session';

export interface CalendarSyncResult {
  eventId: string;
}

function buildEventDetails(session: SurfSession) {
  const lines: string[] = [];
  if (session.tide_start_ft != null && session.tide_end_ft != null) {
    lines.push(`Tide: ${session.tide_start_ft.toFixed(1)} → ${session.tide_end_ft.toFixed(1)} ft`);
  }
  if (session.avg_wind_mph != null) {
    lines.push(`Wind: ${session.avg_wind_mph} mph${session.avg_gusts_mph ? ` (gusts ${session.avg_gusts_mph})` : ''}`);
  }
  if (session.avg_swell_ft != null) {
    lines.push(`Swell: ${session.avg_swell_ft} ft`);
  }
  if (session.notes) {
    lines.push(`\n${session.notes}`);
  }
  return lines.join('\n');
}

async function syncToAppleCalendar(session: SurfSession): Promise<CalendarSyncResult> {
  const Calendar = await import('expo-calendar');

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Calendar permission denied');
  }

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  let calendarId = calendars.find((c) => c.title === 'Surf Sessions')?.id;

  if (!calendarId) {
    const defaultCalendar = calendars.find(
      (c) => c.allowsModifications && c.source?.type === 'local'
    ) ?? calendars.find((c) => c.allowsModifications);

    if (!defaultCalendar?.source) {
      throw new Error('No writable calendar found');
    }

    calendarId = await Calendar.createCalendarAsync({
      title: 'Surf Sessions',
      color: '#0ea5e9',
      entityType: Calendar.EntityTypes.EVENT,
      sourceId: defaultCalendar.source.id,
      source: defaultCalendar.source,
      name: 'Surf Sessions',
      ownerAccount: 'personal',
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
  }

  const eventId = await Calendar.createEventAsync(calendarId, {
    title: `Surf: ${session.spot_name}`,
    startDate: new Date(session.planned_start),
    endDate: new Date(session.planned_end),
    notes: buildEventDetails(session),
    location: session.spot_name,
  });

  return { eventId };
}

async function syncToWebCalendar(session: SurfSession): Promise<CalendarSyncResult> {
  // Generate an .ics download as a simple cross-platform web solution
  const start = new Date(session.planned_start);
  const end = new Date(session.planned_end);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const toICS = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const uid = `${session.id}@surfscheduler`;
  const description = buildEventDetails(session).replace(/\n/g, '\\n');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SurfScheduler//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${toICS(start)}`,
    `DTEND:${toICS(end)}`,
    `SUMMARY:Surf: ${session.spot_name}`,
    `LOCATION:${session.spot_name}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `surf-${session.spot_name.replace(/\s+/g, '-').toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);

  return { eventId: uid };
}

export async function syncSessionToCalendar(session: SurfSession): Promise<CalendarSyncResult> {
  if (Platform.OS === 'web') {
    return syncToWebCalendar(session);
  }
  return syncToAppleCalendar(session);
}

export async function removeCalendarEvent(eventId: string): Promise<void> {
  if (Platform.OS === 'web') return; // ICS downloads can't be recalled

  const Calendar = await import('expo-calendar');
  try {
    await Calendar.deleteEventAsync(eventId);
  } catch {
    // Event may have been manually deleted
  }
}
