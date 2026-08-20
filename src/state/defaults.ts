import type {DailyRecord, KinokoConfig, KinokoData, Pet, RepoGarden, Weather} from './schema.js';

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
    elapsedSeconds: 0,
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

export const defaultPet: Pet = {
  name: 'kinoko',
  species: 'cat',
  hunger: 35,
  happiness: 70,
  energy: 65,
  cleanliness: 80,
  fedCount: 0,
  playCount: 0,
  petCount: 0,
  cleanedCount: 0,
  favoriteToy: 'yarn mouse',
  lastFedAt: null,
  lastPlayedAt: null,
  lastPetAt: null,
  lastCleanedAt: null,
  log: ['kinoko moved in.']
};

export const defaultRepoGarden: RepoGarden = {
  scanDirs: [],
  selectedScanDirIndex: 0,
  selectedRepoIndex: 0
};

export const defaultData: KinokoData = {
  version: 3,
  days: {},
  weather: defaultWeather,
  features: {
    pet: defaultPet,
    repoGarden: defaultRepoGarden
  }
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
