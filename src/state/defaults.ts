import type {DailyRecord, KinokoData, Weather} from './schema.js';

export const defaultDailyRecord: DailyRecord = {
  tasks: [
    {id: 'write-outline', title: 'write outline', done: false},
    {id: 'email-sam', title: 'email sam', done: true},
    {id: 'buy-tea', title: 'buy tea', done: false}
  ],
  focus: {
    todayMinutes: 38,
    activeStartedAt: null
  },
  note: 'keep it small. one clear thing at a time.'
};

export const defaultWeather: Weather = {
  label: 'cloudy, calm',
  temperature: '68°F',
  conditionIcon: '☁'
};

export const defaultData: KinokoData = {
  version: 2,
  days: {},
  weather: defaultWeather
};
