import type {KinokoConfig, Weather} from '../state/schema.js';

type Fetch = typeof fetch;

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: {
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
};

type GeocodingResponse = {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
  }>;
};

export type GeocodedLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

export const WEATHER_CACHE_MS = 30 * 60 * 1000;
export const OPEN_METEO_ATTRIBUTION = 'Weather data by Open-Meteo.com';

export function shouldRefreshWeather(weather: Weather, now = new Date()): boolean {
  if (weather.source !== 'open-meteo' || !weather.updatedAt) {
    return true;
  }

  return now.getTime() - new Date(weather.updatedAt).getTime() > WEATHER_CACHE_MS;
}

export async function fetchOpenMeteoWeather(
  config: KinokoConfig,
  fetchImpl: Fetch = fetch,
  now = new Date()
): Promise<Weather> {
  const {latitude, longitude, temperatureUnit, windSpeedUnit, locationName} = config.weather;
  if (latitude === null || longitude === null) {
    throw new Error('weather location is not configured');
  }

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: temperatureUnit,
    wind_speed_unit: windSpeedUnit,
    timezone: 'auto'
  });

  const response = await fetchImpl(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  const body = (await response.json()) as OpenMeteoResponse;
  const current = body.current;
  if (!current || current.temperature_2m === undefined || current.weather_code === undefined) {
    throw new Error('Open-Meteo response missing current weather');
  }

  return {
    ...describeWeatherCode(current.weather_code),
    temperature: formatTemperature(current.temperature_2m, temperatureUnit),
    apparentTemperature:
      current.apparent_temperature === undefined
        ? undefined
        : formatTemperature(current.apparent_temperature, temperatureUnit),
    windSpeed:
      current.wind_speed_10m === undefined
        ? undefined
        : `${Math.round(current.wind_speed_10m)} ${windSpeedUnit}`,
    highLow: formatHighLow(body, temperatureUnit),
    source: 'open-meteo',
    locationName,
    updatedAt: now.toISOString(),
    stale: false,
    attribution: OPEN_METEO_ATTRIBUTION
  };
}

export async function geocodeLocation(
  query: string,
  fetchImpl: Fetch = fetch
): Promise<GeocodedLocation> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) {
    throw new Error('location search must be at least 2 characters');
  }

  const params = new URLSearchParams({
    name: cleanQuery,
    count: '1',
    language: 'en',
    format: 'json'
  });

  const response = await fetchImpl(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Open-Meteo geocoding failed: ${response.status}`);
  }

  const body = (await response.json()) as GeocodingResponse;
  const match = body.results?.[0];
  if (!match) {
    throw new Error(`no location found for "${cleanQuery}"`);
  }

  return {
    name: formatLocationName(match),
    latitude: match.latitude,
    longitude: match.longitude
  };
}

export function markWeatherStale(weather: Weather): Weather {
  return {
    ...weather,
    stale: true
  };
}

function formatLocationName(location: NonNullable<GeocodingResponse['results']>[number]): string {
  return [location.name, location.admin1, location.country].filter(Boolean).join(', ');
}

function formatTemperature(value: number, unit: KinokoConfig['weather']['temperatureUnit']): string {
  return `${Math.round(value)}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

function formatHighLow(
  body: OpenMeteoResponse,
  unit: KinokoConfig['weather']['temperatureUnit']
): string | undefined {
  const max = body.daily?.temperature_2m_max?.[0];
  const min = body.daily?.temperature_2m_min?.[0];
  if (max === undefined || min === undefined) {
    return undefined;
  }

  return `H ${formatTemperature(max, unit)} · L ${formatTemperature(min, unit)}`;
}

function describeWeatherCode(code: number): Pick<Weather, 'conditionIcon' | 'label'> {
  if (code === 0) return {conditionIcon: '☀', label: 'clear sky'};
  if ([1, 2].includes(code)) return {conditionIcon: '🌤', label: 'mostly clear'};
  if (code === 3) return {conditionIcon: '☁', label: 'overcast'};
  if ([45, 48].includes(code)) return {conditionIcon: '🌫', label: 'foggy'};
  if ([51, 53, 55, 56, 57].includes(code)) return {conditionIcon: '🌦', label: 'drizzle'};
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return {conditionIcon: '🌧', label: 'rainy'};
  if ([71, 73, 75, 77, 85, 86].includes(code)) return {conditionIcon: '❄', label: 'snowy'};
  if ([95, 96, 99].includes(code)) return {conditionIcon: '⛈', label: 'stormy'};
  return {conditionIcon: '☁', label: 'weather outside'};
}
