import {z} from 'zod';

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  done: z.boolean()
});

export const DailyRecordSchema = z.object({
  tasks: z.array(TaskSchema),
  focus: z.object({
    todayMinutes: z.number().nonnegative(),
    activeStartedAt: z.string().datetime().nullable()
  }),
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
  })
});

export const KinokoDataSchema = z.object({
  version: z.literal(2),
  days: z.record(DailyRecordSchema),
  weather: WeatherSchema
});

export type Task = z.infer<typeof TaskSchema>;
export type DailyRecord = z.infer<typeof DailyRecordSchema>;
export type Weather = z.infer<typeof WeatherSchema>;
export type KinokoConfig = z.infer<typeof KinokoConfigSchema>;
export type KinokoData = z.infer<typeof KinokoDataSchema>;
