import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {format} from 'date-fns';
import {z} from 'zod';
import {getKinokoDataPath} from '../paths.js';
import {
  DailyRecordSchema,
  FocusStateSchema,
  KinokoDataSchema,
  PetSchema,
  WeatherSchema,
  type DailyRecord,
  type FocusState,
  type KinokoData
} from './schema.js';
import {defaultDailyRecord, defaultData, defaultPet, defaultWeather} from './defaults.js';

const dataPath = getKinokoDataPath();

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

export function addTasks(
  record: DailyRecord,
  tasks: Array<{title: string; done?: boolean}>
): DailyRecord {
  return tasks.reduce((current, task) => addTaskWithDone(current, task.title, task.done ?? false), record);
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

export function renamePet(data: KinokoData, name: string): KinokoData {
  const cleanName = name.trim();
  if (!cleanName) {
    return data;
  }

  return {
    ...data,
    features: {
      ...data.features,
      pet: {
        ...data.features.pet,
        name: cleanName.slice(0, 32)
      }
    }
  };
}

export function feedPet(data: KinokoData, now = new Date()): KinokoData {
  return {
    ...data,
    features: {
      ...data.features,
      pet: {
        ...data.features.pet,
        hunger: Math.max(0, data.features.pet.hunger - 25),
        happiness: Math.min(100, data.features.pet.happiness + 10),
        fedCount: data.features.pet.fedCount + 1,
        lastFedAt: now.toISOString()
      }
    }
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
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
  const sessionType = record.focus.status as 'focus' | 'break';

  return {
    ...record,
    focus: {
      ...record.focus,
      status: 'paused',
      activeStartedAt: null,
      elapsedSeconds: record.focus.elapsedSeconds + elapsedSeconds,
      pausedMode: sessionType,
      sessions: record.focus.sessions
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
      elapsedSeconds: 0,
      pausedMode: null,
      targetMinutes
    }
  };
}

export function getDisplayedFocusMinutes(record: DailyRecord, now = new Date()): number {
  if (record.focus.status !== 'focus') {
    return record.focus.todayMinutes;
  }

  return record.focus.todayMinutes + Math.floor(getFocusElapsedSeconds(record, now) / 60);
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
    return record.focus.elapsedSeconds;
  }

  return record.focus.elapsedSeconds +
    Math.max(0, Math.floor((now.getTime() - new Date(record.focus.activeStartedAt).getTime()) / 1000));
}

export function getFocusRemainingSeconds(record: DailyRecord, now = new Date()): number {
  const targetSeconds = record.focus.targetMinutes * 60;
  return Math.max(0, targetSeconds - getFocusElapsedSeconds(record, now));
}

function parseData(raw: unknown, now: Date): KinokoData {
  const versioned = KinokoDataSchema.safeParse(raw);
  if (versioned.success) {
    return normalizeData(versioned.data);
  }

  const v2Current = legacyCurrentV2DataSchema.safeParse(raw);
  if (v2Current.success) {
    return {
      version: 3,
      days: v2Current.data.days,
      weather: v2Current.data.weather,
      features: {
        pet: defaultPet
      }
    };
  }

  const v2Legacy = legacyV2DataSchema.safeParse(raw);
  if (v2Legacy.success) {
    return {
      version: 3,
      days: Object.fromEntries(
        Object.entries(v2Legacy.data.days).map(([key, record]) => [
          key,
          {
            ...record,
            focus: migrateFocusState(record.focus)
          }
        ])
      ),
      weather: v2Legacy.data.weather,
      features: {
        pet: defaultPet
      }
    };
  }

  const legacy = legacyFlatDataSchema.safeParse(raw);
  if (!legacy.success) {
    return KinokoDataSchema.parse(raw);
  }

  return {
    version: 3,
    days: {
      [todayKey(now)]: {
        tasks: legacy.data.tasks,
        focus: migrateFocusState(legacy.data.focus),
        note: legacy.data.note
      }
    },
    weather: legacy.data.weather ?? defaultWeather,
    features: {
      pet: defaultPet
    }
  };
}

function normalizeData(data: KinokoData): KinokoData {
  return {
    ...data,
    features: {
      ...data.features,
      pet: {
        ...data.features.pet,
        species: 'cat'
      }
    }
  };
}

function addTaskWithDone(record: DailyRecord, title: string, done: boolean): DailyRecord {
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
        done
      }
    ]
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
      sessionStartedAt: record.focus.sessionStartedAt ?? timestamp,
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
    elapsedSeconds: 0,
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

const legacyDailyRecordSchema = DailyRecordSchema.extend({
  focus: legacyFocusStateSchema
});

const legacyFlatDataSchema = z.object({
  tasks: DailyRecordSchema.shape.tasks,
  focus: legacyFocusStateSchema,
  note: DailyRecordSchema.shape.note,
  weather: WeatherSchema
});

const legacyCurrentV2DataSchema = z.object({
  version: z.literal(2),
  days: z.record(DailyRecordSchema),
  weather: WeatherSchema,
  features: z
    .object({
      pet: PetSchema
    })
    .optional()
});

const legacyV2DataSchema = legacyCurrentV2DataSchema.extend({
  days: z.record(legacyDailyRecordSchema)
});

type LegacyFocusState = z.infer<typeof legacyFocusStateSchema>;
