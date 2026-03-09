import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CoachRequest {
  mode: 'week_brief' | 'pre_session' | 'post_debrief' | 'ask_coach';
  profile: ProfileContext;
  quiver: BoardContext[];
  upcomingSessions?: SessionContext[];
  targetSession?: SessionContext;
  forecast?: ForecastContext;
  similarSessions?: SimilarContext[];
  recentHistory?: SessionContext[];
  userMessage?: string;
}

interface ProfileContext {
  level: string;
  years_experience: number;
  stance: string;
  goals: string[];
  strengths: string[];
  weaknesses: string[];
  session_focus: string | null;
}

interface BoardContext {
  name: string;
  length_ft: number;
  width_in: number;
  thickness_in: number;
  volume_l: number | null;
  nose_shape: string;
  tail_shape: string;
  fin_setup: string;
  nose_rocker: string;
  tail_rocker: string;
}

interface SessionContext {
  spot_name: string;
  planned_start: string;
  planned_end: string;
  rating: number | null;
  board_name: string | null;
  wave_type: string | null;
  result_notes: string | null;
  conditions: {
    tide: string | null;
    wind: string | null;
    swell: string | null;
  } | null;
  feedback: {
    waveCountEstimate: number | null;
    boardFeelRating: number | null;
    focusGoalsWorked: string[];
    whatClicked: string | null;
    whatDidnt: string | null;
  } | null;
}

interface ForecastContext {
  tide: string | null;
  wind: string | null;
  swell: string | null;
}

interface SimilarContext {
  session: SessionContext;
  matchReasons: string[];
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------

const SYSTEM_BASE = `You are an expert surf coach embedded in a surf scheduling app. You have deep knowledge of:
- How tide height, tide phase (rising/falling), swell height, swell period, swell direction, wind speed, and wind direction interact to create wave quality
- Board selection: how length, volume, rocker, fin setup, and tail shape affect performance in different conditions
- Surfer progression: what skills to develop at each level, how to sequence learning, when to push into stretch conditions
- Lineup reading: where to sit, how to identify sets, how wave shape changes with tide

Your tone is encouraging but direct. You speak like a knowledgeable local coach — concise, practical, no fluff. Use surfing terminology naturally but explain anything that might be above the surfer's level.

Keep responses concise and structured. Use short paragraphs and dashes (-) for bullet points.

IMPORTANT: Do NOT use markdown formatting. No ## headers, no **bold**, no *italic*, no numbered lists with periods. Use CAPS for section titles, dashes for bullets, and plain text throughout. The response is displayed in a plain text view.

Never use more than ~300 words unless the surfer asks for detail.`;

const MODE_INSTRUCTIONS: Record<string, string> = {
  week_brief: `Provide:
1. Board pick for each upcoming session with 1-sentence reasoning based on the conditions
2. 1-2 weekly focus drills based on their weaknesses and the conditions they'll face
3. One coaching note tying the week together`,

  pre_session: `Provide:
1. Board recommendation from their quiver with reasoning for these specific conditions
2. Lineup read — where to sit and what to look for given the tide, swell direction, and wind
3. 1-2 session priorities based on their goals and weaknesses
4. One heads-up about a potential challenge given their level and the conditions`,

  post_debrief: `Analyze:
1. What the conditions + board + feedback combination reveals about the surfer's current edge
2. One specific thing to change or try differently next session in similar conditions
3. How this session connects to their stated goals and progression`,

  ask_coach: `Answer the surfer's question conversationally. Draw on their profile, recent sessions, and goals. If they ask something vague, steer toward actionable advice.`,
};

function buildSystemPrompt(mode: string): string {
  return `${SYSTEM_BASE}\n\n${MODE_INSTRUCTIONS[mode] ?? ''}`;
}

function buildUserMessage(req: CoachRequest): string {
  const sections: string[] = [];

  // Profile
  const p = req.profile;
  sections.push(`## Your Profile
Level: ${p.level} | ${p.years_experience} years | ${p.stance} stance
Goals: ${p.goals.join(', ') || 'none set'}
Strengths: ${p.strengths.join(', ') || 'none set'}
Weaknesses: ${p.weaknesses.join(', ') || 'none set'}${p.session_focus ? `\nCurrent focus: ${p.session_focus}` : ''}`);

  // Quiver
  if (req.quiver.length > 0) {
    const boardLines = req.quiver.map(
      (b, i) =>
        `${i + 1}. "${b.name}" — ${b.length_ft}' x ${b.width_in}" x ${b.thickness_in}"${b.volume_l ? ` (${b.volume_l}L)` : ''}, ${b.fin_setup}, ${b.tail_shape} tail, ${b.nose_rocker}/${b.tail_rocker} rocker`
    );
    sections.push(`## Your Quiver\n${boardLines.join('\n')}`);
  } else {
    sections.push('## Your Quiver\nNo boards registered.');
  }

  // Mode-specific context
  // Note: planned_start and planned_end are pre-formatted on the client
  // (e.g. "Wed, Mar 11 7:24 AM" / "9:54 AM") to avoid timezone issues.
  if (req.mode === 'week_brief' && req.upcomingSessions?.length) {
    const lines = req.upcomingSessions.map((s) => {
      const cond = s.conditions
        ? `| ${[s.conditions.tide, s.conditions.wind, s.conditions.swell].filter(Boolean).join(' | ')}`
        : '';
      return `- ${s.spot_name} | ${s.planned_start} – ${s.planned_end} ${cond}`;
    });
    sections.push(`## Upcoming Sessions This Week\n${lines.join('\n')}`);
  }

  if (
    (req.mode === 'pre_session' || req.mode === 'post_debrief') &&
    req.targetSession
  ) {
    const s = req.targetSession;
    sections.push(
      `## ${req.mode === 'pre_session' ? 'Upcoming' : 'Completed'} Session\nSpot: ${s.spot_name} | ${s.planned_start} – ${s.planned_end}`
    );

    if (req.mode === 'pre_session' && req.forecast) {
      const parts = [req.forecast.tide, req.forecast.wind, req.forecast.swell]
        .filter(Boolean)
        .join('\n');
      sections.push(`## Forecast\n${parts}`);
    }

    if (req.mode === 'post_debrief') {
      if (s.conditions) {
        const parts = [s.conditions.tide, s.conditions.wind, s.conditions.swell]
          .filter(Boolean)
          .join('\n');
        sections.push(`## Conditions\n${parts}`);
      }
      if (s.rating != null) sections.push(`Rating: ${s.rating}/10`);
      if (s.board_name) sections.push(`Board used: ${s.board_name}`);
      if (s.wave_type) sections.push(`Wave type: ${s.wave_type}`);
      if (s.feedback) {
        const fb = s.feedback;
        const fbLines: string[] = [];
        if (fb.waveCountEstimate != null)
          fbLines.push(`Waves caught: ~${fb.waveCountEstimate}`);
        if (fb.boardFeelRating != null)
          fbLines.push(`Board feel: ${fb.boardFeelRating}/10`);
        if (fb.focusGoalsWorked.length)
          fbLines.push(`Worked on: ${fb.focusGoalsWorked.join(', ')}`);
        if (fb.whatClicked) fbLines.push(`What clicked: ${fb.whatClicked}`);
        if (fb.whatDidnt) fbLines.push(`What didn't work: ${fb.whatDidnt}`);
        if (fbLines.length)
          sections.push(`## Session Feedback\n${fbLines.join('\n')}`);
      }
      if (s.result_notes) sections.push(`Notes: ${s.result_notes}`);
    }
  }

  if (req.mode === 'pre_session' && req.similarSessions?.length) {
    const lines = req.similarSessions.map((sm) => {
      const s = sm.session;
      return `- ${s.planned_start}, ${s.spot_name}: ${s.rating ?? '?'}/10${s.board_name ? ` on "${s.board_name}"` : ''}. ${s.feedback?.whatClicked ?? s.result_notes ?? ''} (Match: ${sm.matchReasons.join(', ')})`;
    });
    sections.push(`## Similar Past Sessions\n${lines.join('\n')}`);
  }

  if (req.mode === 'ask_coach') {
    if (req.recentHistory?.length) {
      const lines = req.recentHistory.map(
        (s) =>
          `- ${s.planned_start} ${s.spot_name}: ${s.rating ?? '?'}/10${s.board_name ? ` on "${s.board_name}"` : ''}${s.wave_type ? ` (${s.wave_type})` : ''}`
      );
      sections.push(`## Recent Sessions\n${lines.join('\n')}`);
    }
    if (req.userMessage) {
      sections.push(`## Question\n${req.userMessage}`);
    }
  }

  return sections.join('\n\n');
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: CoachRequest = await req.json();

    if (!body.profile) {
      return new Response(
        JSON.stringify({ error: 'Profile required for coaching' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Anthropic API not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemPrompt = buildSystemPrompt(body.mode);
    const userMessage = buildUserMessage(body);

    // Call Anthropic with streaming enabled
    const anthropicRes = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          stream: true,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
      }
    );

    if (!anthropicRes.ok) {
      const err = await anthropicRes.json();
      return new Response(
        JSON.stringify({
          error: err.error?.message ?? 'Anthropic API error',
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Pipe the SSE stream back to the client
    return new Response(anthropicRes.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
