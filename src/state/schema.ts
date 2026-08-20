import {z} from 'zod';

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  done: z.boolean()
});

export const FocusSessionSchema = z.object({
  type: z.enum(['focus', 'break']),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  minutes: z.number().nonnegative()
});

export const FocusStateSchema = z.object({
  todayMinutes: z.number().nonnegative(),
  status: z.enum(['idle', 'focus', 'break', 'paused']),
  activeStartedAt: z.string().datetime().nullable(),
  sessionStartedAt: z.string().datetime().nullable(),
  targetMinutes: z.number().positive(),
  pausedMode: z.enum(['focus', 'break']).nullable(),
  sessions: z.array(FocusSessionSchema)
});

export const DailyRecordSchema = z.object({
  tasks: z.array(TaskSchema),
  focus: FocusStateSchema,
  note: z.string()
});

export const WeatherSchema = z.object({
  label: z.string().min(1),
  temperature: z.string().min(1),
  conditionIcon: z.string().min(1),
  apparentTemperature: z.string().optional(),
  windSpeed: z.string().optional(),
  highLow: z.string().optional(),
  source: z.string().optional(),
  locationName: z.string().optional(),
  updatedAt: z.string().datetime().optional(),
  stale: z.boolean().optional(),
  attribution: z.string().optional()
});

export const KinokoConfigSchema = z.object({
  version: z.literal(1),
  weather: z.object({
    provider: z.literal('open-meteo'),
    latitude: z.number().min(-90).max(90).nullable(),
    longitude: z.number().min(-180).max(180).nullable(),
    locationName: z.string(),
    temperatureUnit: z.enum(['fahrenheit', 'celsius']),
    windSpeedUnit: z.enum(['mph', 'kmh'])
  }),
  focus: z.object({
    focusMinutes: z.number().int().positive(),
    breakMinutes: z.number().int().positive()
  }),
  ui: z.object({
    theme: z.enum(['cozy', 'pixel', 'zen'])
  })
});

export const KinokoDataSchema = z.object({
  version: z.literal(2),
  days: z.record(DailyRecordSchema),
  weather: WeatherSchema
});

export type Task = z.infer<typeof TaskSchema>;
export type FocusSession = z.infer<typeof FocusSessionSchema>;
export type FocusState = z.infer<typeof FocusStateSchema>;
export type DailyRecord = z.infer<typeof DailyRecordSchema>;
export type Weather = z.infer<typeof WeatherSchema>;
export type KinokoConfig = z.infer<typeof KinokoConfigSchema>;
export type KinokoData = z.infer<typeof KinokoDataSchema>;
