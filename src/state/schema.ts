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
  conditionIcon: z.string().min(1)
});

export const KinokoDataSchema = z.object({
  version: z.literal(2),
  days: z.record(DailyRecordSchema),
  weather: z.object({
    label: z.string().min(1),
    temperature: z.string().min(1),
    conditionIcon: z.string().min(1)
  })
});

export type Task = z.infer<typeof TaskSchema>;
export type DailyRecord = z.infer<typeof DailyRecordSchema>;
export type Weather = z.infer<typeof WeatherSchema>;
export type KinokoData = z.infer<typeof KinokoDataSchema>;
