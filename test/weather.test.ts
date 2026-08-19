import {describe, expect, it} from 'vitest';
import {defaultConfig, defaultWeather} from '../src/state/defaults.js';
import {
  fetchOpenMeteoWeather,
  geocodeLocation,
  markWeatherStale,
  shouldRefreshWeather
} from '../src/weather/openMeteo.js';

describe('open-meteo weather', () => {
  it('refreshes missing or stale weather', () => {
    expect(shouldRefreshWeather(defaultWeather)).toBe(true);
    expect(
      shouldRefreshWeather({
        ...defaultWeather,
        source: 'open-meteo',
        updatedAt: '2026-08-19T12:00:00.000Z'
      }, new Date('2026-08-19T12:20:00.000Z'))
    ).toBe(false);
    expect(
      shouldRefreshWeather({
        ...defaultWeather,
        source: 'open-meteo',
        updatedAt: '2026-08-19T12:00:00.000Z'
      }, new Date('2026-08-19T12:31:00.000Z'))
    ).toBe(true);
  });

  it('maps Open-Meteo response into display weather', async () => {
    const config = {
      ...defaultConfig,
      weather: {
        ...defaultConfig.weather,
        latitude: 37.7749,
        longitude: -122.4194,
        locationName: 'San Francisco'
      }
    };

    const weather = await fetchOpenMeteoWeather(
      config,
      async () =>
        new Response(
          JSON.stringify({
            current: {
              temperature_2m: 68.4,
              apparent_temperature: 66.2,
              weather_code: 3,
              wind_speed_10m: 4.2
            },
            daily: {
              temperature_2m_max: [72.1],
              temperature_2m_min: [58.6]
            }
          }),
          {status: 200}
        ),
      new Date('2026-08-19T19:00:00.000Z')
    );

    expect(weather).toMatchObject({
      conditionIcon: '☁',
      label: 'overcast',
      temperature: '68°F',
      apparentTemperature: '66°F',
      windSpeed: '4 mph',
      highLow: 'H 72°F · L 59°F',
      source: 'open-meteo',
      locationName: 'San Francisco',
      stale: false
    });
  });

  it('marks cached weather stale after refresh failures', () => {
    expect(markWeatherStale({...defaultWeather, stale: false}).stale).toBe(true);
  });

  it('geocodes a location name through Open-Meteo', async () => {
    const location = await geocodeLocation(
      'San Francisco',
      async () =>
        new Response(
          JSON.stringify({
            results: [
              {
                name: 'San Francisco',
                latitude: 37.77493,
                longitude: -122.41942,
                admin1: 'California',
                country: 'United States'
              }
            ]
          }),
          {status: 200}
        )
    );

    expect(location).toEqual({
      name: 'San Francisco, California, United States',
      latitude: 37.77493,
      longitude: -122.41942
    });
  });
});
