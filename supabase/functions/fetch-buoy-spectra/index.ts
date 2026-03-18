import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const NDBC_BASE = 'https://www.ndbc.noaa.gov/data/realtime2';
const BATCH_SIZE = 500;
const MAX_OBSERVATIONS = 48; // ~24-48 hours of data
const MAX_COMPONENTS = 4;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpectralObservation {
  timestamp: Date;
  frequencies: number[];
  densities: number[];
  directions: number[];
}

interface SwellComponent {
  height: number;
  period: number;
  direction: number;
  energyDensity: number;
  freqPeak: number;
  freqLow: number;
  freqHigh: number;
}

interface ComponentRow {
  source_type: 'buoy_spectral';
  station_id: string;
  valid_at: string;
  component_index: number;
  height_m: number;
  period_s: number;
  direction_deg: number;
  energy_density: number;
  frequency_peak_hz: number;
  frequency_low_hz: number;
  frequency_high_hz: number;
}

// ---------------------------------------------------------------------------
// NDBC Spectral Data Parsers
// ---------------------------------------------------------------------------

/**
 * Parse NDBC `.data_spec` file.
 * Format: header row with frequency bins, then timestamp + density values.
 * Some files use parenthesized separators between groups.
 */
/**
 * Parse NDBC `.data_spec` file.
 * Format per data row: YY MM DD hh mm sep_freq density (freq) density (freq) ...
 * Densities and frequencies are interleaved: value (freq) pairs after col 5 (sep_freq).
 * Frequencies are extracted from the parenthesized values in the first data row.
 */
function parseSpectralDensityFile(text: string): {
  frequencies: number[];
  observations: { timestamp: Date; densities: number[] }[];
} {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { frequencies: [], observations: [] };

  // Find first data line (skip header lines starting with #)
  let dataStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].trim().startsWith('#')) { dataStart = i; break; }
  }

  if (dataStart >= lines.length) return { frequencies: [], observations: [] };

  // Extract frequencies from parenthesized values in first data row
  const freqMatches = lines[dataStart].match(/\(([0-9.]+)\)/g);
  if (!freqMatches || freqMatches.length === 0) return { frequencies: [], observations: [] };
  const frequencies = freqMatches.map((m) => parseFloat(m.replace(/[()]/g, '')));

  const observations: { timestamp: Date; densities: number[] }[] = [];
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 48);

  for (let i = dataStart; i < lines.length && observations.length < MAX_OBSERVATIONS; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#')) continue;
    const cols = line.split(/\s+/);
    if (cols.length < 6) continue;

    const yr = parseInt(cols[0]);
    const mo = parseInt(cols[1]);
    const dy = parseInt(cols[2]);
    const hr = parseInt(cols[3]);
    const mn = parseInt(cols[4]);
    if (isNaN(yr) || isNaN(mo)) continue;

    const timestamp = new Date(Date.UTC(yr, mo - 1, dy, hr, mn));
    if (timestamp < cutoff) continue;

    // Extract density values (non-parenthesized numbers after sep_freq)
    // Format: sep_freq density1 (freq1) density2 (freq2) ...
    // Skip col[5] (sep_freq), then every other token is a density
    const afterTimestamp = cols.slice(6); // skip 5 timestamp cols + sep_freq
    const densities: number[] = [];
    for (let j = 0; j < afterTimestamp.length; j++) {
      const val = afterTimestamp[j];
      if (val.startsWith('(')) continue; // skip frequency in parens
      const num = parseFloat(val);
      if (!isNaN(num)) densities.push(num);
    }

    if (densities.length === frequencies.length) {
      observations.push({ timestamp, densities });
    }
  }

  return { frequencies, observations };
}

function parseDirectionFile(text: string): Map<string, number[]> {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const dirMap = new Map<string, number[]>();

  for (const line of lines) {
    if (line.trim().startsWith('#')) continue;
    const cols = line.trim().split(/\s+/);
    if (cols.length < 6) continue;

    const key = cols.slice(0, 5).join('-');
    // Same interleaved format: direction (freq) direction (freq) ...
    const afterTimestamp = cols.slice(5);
    const directions: number[] = [];
    for (const val of afterTimestamp) {
      if (val.startsWith('(')) continue; // skip frequency in parens
      const num = parseFloat(val);
      if (!isNaN(num)) directions.push(num);
    }

    dirMap.set(key, directions);
  }

  return dirMap;
}

function mergeSpectralData(
  specText: string,
  dirText: string,
): SpectralObservation[] {
  const { frequencies, observations } = parseSpectralDensityFile(specText);
  if (frequencies.length === 0) return [];

  const dirMap = parseDirectionFile(dirText);
  const result: SpectralObservation[] = [];

  for (const obs of observations) {
    // Key must match raw column format with leading zeros (e.g. "2026-03-18-21-00")
    const pad = (n: number) => n.toString().padStart(2, '0');
    const key = [
      obs.timestamp.getUTCFullYear(),
      pad(obs.timestamp.getUTCMonth() + 1),
      pad(obs.timestamp.getUTCDate()),
      pad(obs.timestamp.getUTCHours()),
      pad(obs.timestamp.getUTCMinutes()),
    ].join('-');

    const directions = dirMap.get(key) ?? new Array(frequencies.length).fill(0);

    result.push({
      timestamp: obs.timestamp,
      frequencies,
      densities: obs.densities,
      directions: directions.length === frequencies.length
        ? directions
        : new Array(frequencies.length).fill(0),
    });
  }

  return result;
}

// ---------------------------------------------------------------------------
// Spectral Decomposition Algorithm
// ---------------------------------------------------------------------------

function smoothSpectrum(densities: number[], windowSize: number): number[] {
  const result = [...densities];
  const half = Math.floor(windowSize / 2);
  for (let i = half; i < densities.length - half; i++) {
    let sum = 0;
    for (let j = -half; j <= half; j++) sum += densities[i + j];
    result[i] = sum / windowSize;
  }
  return result;
}

function findValley(data: number[], leftPeak: number, rightPeak: number): number {
  let minVal = Infinity;
  let minIdx = Math.floor((leftPeak + rightPeak) / 2);
  for (let i = leftPeak + 1; i < rightPeak; i++) {
    if (data[i] < minVal) {
      minVal = data[i];
      minIdx = i;
    }
  }
  return minIdx;
}

function computeCircularMeanDirection(
  densities: number[],
  directions: number[],
  lowIdx: number,
  highIdx: number,
): number {
  let sinSum = 0;
  let cosSum = 0;
  let totalWeight = 0;

  for (let i = lowIdx; i <= highIdx; i++) {
    const w = densities[i];
    if (w <= 0) continue;
    const rad = (directions[i] * Math.PI) / 180;
    sinSum += w * Math.sin(rad);
    cosSum += w * Math.cos(rad);
    totalWeight += w;
  }

  if (totalWeight === 0) return 0;
  let mean = (Math.atan2(sinSum / totalWeight, cosSum / totalWeight) * 180) / Math.PI;
  if (mean < 0) mean += 360;
  return mean;
}

function computeComponent(
  frequencies: number[],
  densities: number[],
  directions: number[],
  lowIdx: number,
  highIdx: number,
): SwellComponent {
  let m0 = 0;
  let peakDensity = 0;
  let peakIdx = lowIdx;

  for (let i = lowIdx; i <= highIdx; i++) {
    const df =
      i === 0
        ? frequencies[1] - frequencies[0]
        : frequencies[i] - frequencies[i - 1];
    m0 += densities[i] * df;

    if (densities[i] > peakDensity) {
      peakDensity = densities[i];
      peakIdx = i;
    }
  }

  const height = 4 * Math.sqrt(Math.max(0, m0));
  const period = frequencies[peakIdx] > 0 ? 1 / frequencies[peakIdx] : 0;
  const direction = computeCircularMeanDirection(
    densities,
    directions,
    lowIdx,
    highIdx,
  );

  return {
    height: +height.toFixed(2),
    period: +period.toFixed(1),
    direction: Math.round(direction),
    energyDensity: +peakDensity.toFixed(4),
    freqPeak: frequencies[peakIdx],
    freqLow: frequencies[lowIdx],
    freqHigh: frequencies[highIdx],
  };
}

/**
 * Decompose a wave energy spectrum into distinct swell components.
 *
 * Algorithm:
 * 1. Smooth spectrum (3-point window) to reduce noise
 * 2. Find local maxima above 5% of max density
 * 3. Sort peaks by energy, take top N
 * 4. Find valleys between peaks → partition boundaries
 * 5. For each partition: compute Hs, peak period, direction
 * 6. Filter negligible components, sort by height
 */
function decomposeSpectrum(
  frequencies: number[],
  densities: number[],
  directions: number[],
): SwellComponent[] {
  const n = frequencies.length;
  if (n === 0) return [];

  const smoothed = smoothSpectrum(densities, 3);

  const maxDensity = Math.max(...smoothed);
  if (maxDensity <= 0) return [];

  const threshold = maxDensity * 0.05;

  // Find peaks
  const peaks: number[] = [];
  for (let i = 1; i < n - 1; i++) {
    if (
      smoothed[i] > smoothed[i - 1] &&
      smoothed[i] > smoothed[i + 1] &&
      smoothed[i] > threshold
    ) {
      peaks.push(i);
    }
  }

  if (peaks.length === 0) {
    // No peaks found — treat entire spectrum as one component
    const comp = computeComponent(frequencies, densities, directions, 0, n - 1);
    return comp.height > 0.05 ? [comp] : [];
  }

  // Sort by energy descending, take top MAX_COMPONENTS
  const sortedPeaks = [...peaks].sort((a, b) => smoothed[b] - smoothed[a]);
  const selectedPeaks = sortedPeaks.slice(0, MAX_COMPONENTS);
  // Re-sort by frequency for partitioning
  selectedPeaks.sort((a, b) => a - b);

  // Partition spectrum around peaks
  const partitions: { low: number; high: number }[] = [];
  for (let p = 0; p < selectedPeaks.length; p++) {
    const low =
      p === 0 ? 0 : findValley(smoothed, selectedPeaks[p - 1], selectedPeaks[p]);
    const high =
      p === selectedPeaks.length - 1
        ? n - 1
        : findValley(smoothed, selectedPeaks[p], selectedPeaks[p + 1]);
    partitions.push({ low, high });
  }

  // Compute component for each partition
  const components = partitions
    .map((part) =>
      computeComponent(frequencies, densities, directions, part.low, part.high),
    )
    .filter((c) => c.height > 0.05) // filter negligible
    .sort((a, b) => b.height - a.height); // primary = tallest

  return components.slice(0, MAX_COMPONENTS);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const stats = {
    stations: 0,
    observations: 0,
    components: 0,
    errors: [] as string[],
  };

  try {
    // 1. Get distinct NDBC station IDs
    const { data: spots, error: spotsErr } = await supabase
      .from('spots')
      .select('ndbc_station_id')
      .not('ndbc_station_id', 'is', null);

    if (spotsErr) throw spotsErr;

    const uniqueStations = [
      ...new Set((spots ?? []).map((s: { ndbc_station_id: string }) => s.ndbc_station_id)),
    ];
    stats.stations = uniqueStations.length;

    const allComponents: ComponentRow[] = [];

    for (const stationId of uniqueStations) {
      try {
        // 2. Fetch spectral density + direction files in parallel
        const [specRes, dirRes] = await Promise.all([
          fetch(`${NDBC_BASE}/${stationId}.data_spec`),
          fetch(`${NDBC_BASE}/${stationId}.swdir`),
        ]);

        if (!specRes.ok) {
          stats.errors.push(`${stationId} .data_spec: HTTP ${specRes.status}`);
          continue;
        }
        if (!dirRes.ok) {
          stats.errors.push(`${stationId} .swdir: HTTP ${dirRes.status}`);
          continue;
        }

        const specText = await specRes.text();
        const dirText = await dirRes.text();

        // 3. Parse and merge spectral data
        const observations = mergeSpectralData(specText, dirText);
        stats.observations += observations.length;

        // 4. Decompose each observation
        for (const obs of observations) {
          const components = decomposeSpectrum(
            obs.frequencies,
            obs.densities,
            obs.directions,
          );

          for (let idx = 0; idx < components.length; idx++) {
            allComponents.push({
              source_type: 'buoy_spectral',
              station_id: stationId,
              valid_at: obs.timestamp.toISOString(),
              component_index: idx,
              height_m: components[idx].height,
              period_s: components[idx].period,
              direction_deg: components[idx].direction,
              energy_density: components[idx].energyDensity,
              frequency_peak_hz: components[idx].freqPeak,
              frequency_low_hz: components[idx].freqLow,
              frequency_high_hz: components[idx].freqHigh,
            });
          }
        }
      } catch (err) {
        stats.errors.push(`${stationId}: ${(err as Error).message}`);
      }

      await delay(200);
    }

    stats.components = allComponents.length;

    // 5. Delete old spectral components, then batch insert new
    for (const stationId of uniqueStations) {
      const { error } = await supabase
        .from('swell_components')
        .delete()
        .eq('source_type', 'buoy_spectral')
        .eq('station_id', stationId);
      if (error) stats.errors.push(`Delete ${stationId}: ${error.message}`);
    }

    for (let i = 0; i < allComponents.length; i += BATCH_SIZE) {
      const { error } = await supabase
        .from('swell_components')
        .insert(allComponents.slice(i, i + BATCH_SIZE));
      if (error) stats.errors.push(`Insert batch: ${error.message}`);
    }

    return new Response(JSON.stringify({ ok: true, ...stats }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message, stats }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
