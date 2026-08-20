import {mkdtempSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {loadConfig, setBreakMinutes, setFocusMinutes, setTheme} from '../src/config.js';
import {defaultConfig} from '../src/state/defaults.js';

function tempConfigPath() {
  return join(mkdtempSync(join(tmpdir(), 'kinoko-config-test-')), 'config.json');
}

describe('config', () => {
  it('migrates weather-only config with default focus durations and theme', () => {
    const path = tempConfigPath();
    writeFileSync(
      path,
      JSON.stringify({
        version: 1,
        weather: {
          provider: 'open-meteo',
          latitude: null,
          longitude: null,
          locationName: '',
          temperatureUnit: 'fahrenheit',
          windSpeedUnit: 'mph'
        }
      }),
      'utf8'
    );

    expect(loadConfig(path).focus).toEqual({
      focusMinutes: 25,
      breakMinutes: 5
    });
    expect(loadConfig(path).ui.theme).toBe('cozy');
  });

  it('updates focus and break durations', () => {
    expect(setFocusMinutes(defaultConfig, 45).focus).toEqual({
      focusMinutes: 45,
      breakMinutes: 5
    });
    expect(setBreakMinutes(defaultConfig, 10).focus).toEqual({
      focusMinutes: 25,
      breakMinutes: 10
    });
  });

  it('updates theme', () => {
    expect(setTheme(defaultConfig, 'pixel').ui.theme).toBe('pixel');
  });
});
