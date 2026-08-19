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

  return KinokoConfigSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
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
