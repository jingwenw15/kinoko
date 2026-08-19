import {z} from 'zod';

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  done: z.boolean()
});

export const KinokoDataSchema = z.object({
  tasks: z.array(TaskSchema),
  focus: z.object({
    todayMinutes: z.number().nonnegative(),
    activeStartedAt: z.string().datetime().nullable()
  }),
  weather: z.object({
    label: z.string().min(1),
    temperature: z.string().min(1),
    conditionIcon: z.string().min(1)
  }),
  note: z.string()
});

export type Task = z.infer<typeof TaskSchema>;
export type KinokoData = z.infer<typeof KinokoDataSchema>;
