import type {KinokoData} from './schema.js';

export const defaultData: KinokoData = {
  tasks: [
    {id: 'write-outline', title: 'write outline', done: false},
    {id: 'email-sam', title: 'email sam', done: true},
    {id: 'buy-tea', title: 'buy tea', done: false}
  ],
  focus: {
    todayMinutes: 38,
    activeStartedAt: null
  },
  weather: {
    label: 'cloudy, calm',
    temperature: '68°F',
    conditionIcon: '☁'
  },
  note: 'keep it small. one clear thing at a time.'
};
