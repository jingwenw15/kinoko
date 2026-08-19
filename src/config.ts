import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {defaultConfig} from './state/defaults.js';
import {KinokoConfigSchema, type KinokoConfig} from './state/schema.js';
import type {GeocodedLocation} from './weather/openMeteo.js';

const configPath = resolve(process.cwd(), 'data', 'config.json');

export function getConfigPath(): string {
  return configPath;
}

export function loadConfig(path = configPath): KinokoConfig {
  if (!existsSync(path)) {
    saveConfig(defaultConfig, path);
    return structuredClone(defaultConfig);
  }

  return parseConfig(JSON.parse(readFileSync(path, 'utf8')));
}

export function saveConfig(config: KinokoConfig, path = configPath): void {
  KinokoConfigSchema.parse(config);
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

export function setWeatherLocation(
  config: KinokoConfig,
  locationName: string,
  latitude: number,
  longitude: number
): KinokoConfig {
  return {
    ...config,
    weather: {
      ...config.weather,
      locationName,
      latitude,
      longitude
    }
  };
}

export function setGeocodedWeatherLocation(
  config: KinokoConfig,
  location: GeocodedLocation
): KinokoConfig {
  return setWeatherLocation(config, location.name, location.latitude, location.longitude);
}

export function hasWeatherLocation(config: KinokoConfig): boolean {
  return config.weather.latitude !== null && config.weather.longitude !== null;
}

export function setFocusDurations(
  config: KinokoConfig,
  focusMinutes: number,
  breakMinutes: number
): KinokoConfig {
  return {
    ...config,
    focus: {
      focusMinutes,
      breakMinutes
    }
  };
}

export function setFocusMinutes(config: KinokoConfig, focusMinutes: number): KinokoConfig {
  return setFocusDurations(config, focusMinutes, config.focus.breakMinutes);
}

export function setBreakMinutes(config: KinokoConfig, breakMinutes: number): KinokoConfig {
  return setFocusDurations(config, config.focus.focusMinutes, breakMinutes);
}

function parseConfig(raw: unknown): KinokoConfig {
  const parsed = KinokoConfigSchema.safeParse(raw);
  if (parsed.success) {
    return parsed.data;
  }

  const legacy = KinokoConfigSchema.omit({focus: true}).safeParse(raw);
  if (legacy.success) {
    return {
      ...legacy.data,
      focus: defaultConfig.focus
    };
  }

  return KinokoConfigSchema.parse(raw);
}
