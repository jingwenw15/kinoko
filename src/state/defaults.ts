import type {DailyRecord, KinokoConfig, KinokoData, Weather} from './schema.js';

export const defaultDailyRecord: DailyRecord = {
  tasks: [
    {id: 'write-outline', title: 'write outline', done: false},
    {id: 'email-sam', title: 'email sam', done: true},
    {id: 'buy-tea', title: 'buy tea', done: false}
  ],
  focus: {
    todayMinutes: 0,
    status: 'idle',
    activeStartedAt: null,
    sessionStartedAt: null,
    targetMinutes: 25,
    pausedMode: null,
    sessions: []
  },
  note: 'keep it small. one clear thing at a time.'
};

export const defaultWeather: Weather = {
  label: 'cloudy, calm',
  temperature: '68°F',
  conditionIcon: '☁',
  source: 'mock',
  stale: true
};

export const defaultData: KinokoData = {
  version: 2,
  days: {},
  weather: defaultWeather
};

export const defaultConfig: KinokoConfig = {
  version: 1,
  weather: {
    provider: 'open-meteo',
    latitude: null,
    longitude: null,
    locationName: '',
    temperatureUnit: 'fahrenheit',
    windSpeedUnit: 'mph'
  },
  focus: {
    focusMinutes: 25,
    breakMinutes: 5
  },
  ui: {
    theme: 'cozy'
  }
};
