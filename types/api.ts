// NOAA CO-OPS tide predictions response
export interface NOAAPrediction {
  t: string; // "2026-03-06 05:46"
  v: string; // "0.619" — string, not number!
  type?: string; // "H" or "L" — only present for hilo interval
}

export interface NOAAResponse {
  predictions: NOAAPrediction[];
}

// Open-Meteo Marine API response (swell)
export interface OpenMeteoMarineResponse {
  latitude: number;
  longitude: number;
  hourly_units: {
    swell_wave_height: string;
    swell_wave_direction: string;
    swell_wave_period: string;
  };
  hourly: {
    time: string[];
    swell_wave_height: (number | null)[];
    swell_wave_direction: (number | null)[];
    swell_wave_period: (number | null)[];
  };
}

// Open-Meteo Weather API response (wind)
export interface OpenMeteoWindResponse {
  latitude: number;
  longitude: number;
  hourly_units: {
    wind_speed_10m: string;
    wind_direction_10m: string;
    wind_gusts_10m: string;
  };
  hourly: {
    time: string[];
    wind_speed_10m: (number | null)[];
    wind_direction_10m: (number | null)[];
    wind_gusts_10m: (number | null)[];
  };
}
