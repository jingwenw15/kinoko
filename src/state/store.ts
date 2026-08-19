import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {format} from 'date-fns';
import {z} from 'zod';
import {
  DailyRecordSchema,
  FocusStateSchema,
  KinokoDataSchema,
  WeatherSchema,
  type DailyRecord,
  type FocusState,
  type KinokoData
} from './schema.js';
import {defaultDailyRecord, defaultData, defaultWeather} from './defaults.js';

const dataPath = resolve(process.cwd(), 'data', 'kinoko.json');

export function getDataPath(): string {
  return dataPath;
}

export function loadData(path = dataPath): KinokoData {
  if (!existsSync(path)) {
    saveData(defaultData, path);
    return structuredClone(defaultData);
  }

  const raw = readFileSync(path, 'utf8');
  return parseData(JSON.parse(raw), new Date());
}

export function saveData(data: KinokoData, path = dataPath): void {
  KinokoDataSchema.parse(data);
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function todayKey(now = new Date()): string {
  return format(now, 'yyyy-MM-dd');
}

export function getToday(data: KinokoData, now = new Date()): DailyRecord {
  return data.days[todayKey(now)] ?? structuredClone(defaultDailyRecord);
}

export function updateToday(
  data: KinokoData,
  updater: (record: DailyRecord) => DailyRecord,
  now = new Date()
): KinokoData {
  const key = todayKey(now);
  return {
    ...data,
    days: {
      ...data.days,
      [key]: updater(getToday(data, now))
    }
  };
}

export function addTask(record: DailyRecord, title: string): DailyRecord {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    return record;
  }

  return {
    ...record,
    tasks: [
      ...record.tasks,
      {
        id: createTaskId(cleanTitle, record.tasks.map(task => task.id)),
        title: cleanTitle,
        done: false
      }
    ]
  };
}

export function deleteTask(record: DailyRecord, taskIdOrIndex: string): DailyRecord {
  const taskId = resolveTaskId(record, taskIdOrIndex);
  return {
    ...record,
    tasks: record.tasks.filter(task => task.id !== taskId)
  };
}

export function editTask(record: DailyRecord, taskIdOrIndex: string, title: string): DailyRecord {
  const cleanTitle = title.trim();
  if (!cleanTitle) {
    return record;
  }

  const taskId = resolveTaskId(record, taskIdOrIndex);
  return {
    ...record,
    tasks: record.tasks.map(task =>
      task.id === taskId ? {...task, title: cleanTitle} : task
    )
  };
}

export function setNote(record: DailyRecord, note: string): DailyRecord {
  return {
    ...record,
    note
  };
}

export function toggleTask(record: DailyRecord, taskIdOrIndex: string): DailyRecord {
  const taskId = resolveTaskId(record, taskIdOrIndex);
  return {
    ...record,
    tasks: record.tasks.map(task =>
      task.id === taskId ? {...task, done: !task.done} : task
    )
  };
}

export function pauseFocus(record: DailyRecord, now = new Date()): DailyRecord {
  if (
    !record.focus.activeStartedAt ||
    !record.focus.sessionStartedAt ||
    !['focus', 'break'].includes(record.focus.status)
  ) {
    return record;
  }

  const startedAt = new Date(record.focus.activeStartedAt);
  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 60000));
  const sessionType = record.focus.status as 'focus' | 'break';

  return {
    ...record,
    focus: {
      ...record.focus,
      todayMinutes:
        sessionType === 'focus' ? record.focus.todayMinutes + elapsedMinutes : record.focus.todayMinutes,
      status: 'paused',
      activeStartedAt: null,
      sessionStartedAt: null,
      pausedMode: sessionType,
      sessions:
        elapsedMinutes > 0
          ? [
              ...record.focus.sessions,
              {
                type: sessionType,
                startedAt: record.focus.sessionStartedAt,
                endedAt: now.toISOString(),
                minutes: elapsedMinutes
              }
            ]
          : record.focus.sessions
    }
  };
}

export function resetCurrentFocus(record: DailyRecord, targetMinutes = 25): DailyRecord {
  return {
    ...record,
    focus: {
      ...record.focus,
      status: 'idle',
      activeStartedAt: null,
      sessionStartedAt: null,
      pausedMode: null,
      targetMinutes
    }
  };
}

export function getDisplayedFocusMinutes(record: DailyRecord, now = new Date()): number {
  if (record.focus.status !== 'focus' || !record.focus.activeStartedAt) {
    return record.focus.todayMinutes;
  }

  const startedAt = new Date(record.focus.activeStartedAt);
  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 60000));
  return record.focus.todayMinutes + elapsedMinutes;
}

export function startFocus(record: DailyRecord, now = new Date(), targetMinutes = 25): DailyRecord {
  return startFocusMode(record, 'focus', now, targetMinutes);
}

export function startBreak(record: DailyRecord, now = new Date(), targetMinutes = 5): DailyRecord {
  return startFocusMode(record, 'break', now, targetMinutes);
}

export function resumeFocus(record: DailyRecord, now = new Date()): DailyRecord {
  if (record.focus.status !== 'paused') {
    return record;
  }

  const mode = record.focus.pausedMode ?? 'focus';
  return startFocusMode(record, mode, now, record.focus.targetMinutes);
}

export function getFocusElapsedSeconds(record: DailyRecord, now = new Date()): number {
  if (!record.focus.activeStartedAt || !['focus', 'break'].includes(record.focus.status)) {
    return 0;
  }

  return Math.max(0, Math.floor((now.getTime() - new Date(record.focus.activeStartedAt).getTime()) / 1000));
}

export function getFocusRemainingSeconds(record: DailyRecord, now = new Date()): number {
  const targetSeconds = record.focus.targetMinutes * 60;
  return Math.max(0, targetSeconds - getFocusElapsedSeconds(record, now));
}

function parseData(raw: unknown, now: Date): KinokoData {
  const versioned = KinokoDataSchema.safeParse(raw);
  if (versioned.success) {
    return versioned.data;
  }

  const v2Legacy = legacyV2DataSchema.safeParse(raw);
  if (v2Legacy.success) {
    return {
      ...v2Legacy.data,
      days: Object.fromEntries(
        Object.entries(v2Legacy.data.days).map(([key, record]) => [
          key,
          {
            ...record,
            focus: migrateFocusState(record.focus)
          }
        ])
      )
    };
  }

  const legacy = legacyFlatDataSchema.safeParse(raw);
  if (!legacy.success) {
    return KinokoDataSchema.parse(raw);
  }

  return {
    version: 2,
    days: {
      [todayKey(now)]: {
        tasks: legacy.data.tasks,
        focus: migrateFocusState(legacy.data.focus),
        note: legacy.data.note
      }
    },
    weather: legacy.data.weather ?? defaultWeather
  };
}

function startFocusMode(
  record: DailyRecord,
  mode: 'focus' | 'break',
  now: Date,
  targetMinutes: number
): DailyRecord {
  if (record.focus.status === 'focus' || record.focus.status === 'break') {
    return record;
  }

  const timestamp = now.toISOString();
  return {
    ...record,
    focus: {
      ...record.focus,
      status: mode,
      activeStartedAt: timestamp,
      sessionStartedAt: timestamp,
      targetMinutes,
      pausedMode: null
    }
  };
}

function migrateFocusState(focus: LegacyFocusState | FocusState): FocusState {
  const parsed = FocusStateSchema.safeParse(focus);
  if (parsed.success) {
    return parsed.data;
  }

  return {
    todayMinutes: focus.todayMinutes,
    status: focus.activeStartedAt ? 'focus' : 'idle',
    activeStartedAt: focus.activeStartedAt,
    sessionStartedAt: focus.activeStartedAt,
    targetMinutes: 25,
    pausedMode: null,
    sessions: []
  };
}

function createTaskId(title: string, existingIds: string[]): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'task';

  if (!existingIds.includes(base)) {
    return base;
  }

  let suffix = 2;
  while (existingIds.includes(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

function resolveTaskId(record: DailyRecord, taskIdOrIndex: string): string {
  const directMatch = record.tasks.find(task => task.id === taskIdOrIndex);
  if (directMatch) {
    return directMatch.id;
  }

  const index = Number.parseInt(taskIdOrIndex, 10);
  if (Number.isInteger(index) && index >= 1 && index <= record.tasks.length) {
    return record.tasks[index - 1]!.id;
  }

  return taskIdOrIndex;
}

const legacyFocusStateSchema = FocusStateSchema.or(
  z.object({
    todayMinutes: z.number().nonnegative(),
    activeStartedAt: z.string().datetime().nullable()
  })
);

const legacyFlatDataSchema = DailyRecordSchema.extend({
  focus: legacyFocusStateSchema,
  weather: WeatherSchema
});

const legacyDailyRecordSchema = DailyRecordSchema.extend({
  focus: legacyFocusStateSchema
});

const legacyV2DataSchema = KinokoDataSchema.extend({
  days: z.record(legacyDailyRecordSchema)
});

type LegacyFocusState = z.infer<typeof legacyFocusStateSchema>;
