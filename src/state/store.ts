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
  type KinokoData,
  type Pet
} from './schema.js';
import {defaultDailyRecord, defaultData, defaultPet, defaultRepoGarden, defaultWeather} from './defaults.js';

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
        name: cleanName.slice(0, 32),
        log: pushPetLog(data.features.pet, `renamed to ${cleanName.slice(0, 32)}`)
      }
    }
  };
}

export function feedPet(data: KinokoData, now = new Date()): KinokoData {
  const timestamp = now.toISOString();
  return {
    ...data,
    features: {
      ...data.features,
      pet: {
        ...data.features.pet,
        hunger: Math.max(0, data.features.pet.hunger - 25),
        happiness: Math.min(100, data.features.pet.happiness + 10),
        energy: Math.min(100, data.features.pet.energy + 5),
        fedCount: data.features.pet.fedCount + 1,
        lastFedAt: timestamp,
        log: pushPetLog(data.features.pet, `ate a snack at ${formatPetTime(now)}`)
      }
    }
  };
}

export function playWithPet(data: KinokoData, now = new Date()): KinokoData {
  const timestamp = now.toISOString();
  return {
    ...data,
    features: {
      ...data.features,
      pet: {
        ...data.features.pet,
        hunger: Math.min(100, data.features.pet.hunger + 10),
        happiness: Math.min(100, data.features.pet.happiness + 18),
        energy: Math.max(0, data.features.pet.energy - 20),
        cleanliness: Math.max(0, data.features.pet.cleanliness - 8),
        playCount: data.features.pet.playCount + 1,
        lastPlayedAt: timestamp,
        log: pushPetLog(data.features.pet, `played with ${data.features.pet.favoriteToy}`)
      }
    }
  };
}

export function petCat(data: KinokoData, now = new Date()): KinokoData {
  const timestamp = now.toISOString();
  return {
    ...data,
    features: {
      ...data.features,
      pet: {
        ...data.features.pet,
        happiness: Math.min(100, data.features.pet.happiness + 8),
        energy: Math.min(100, data.features.pet.energy + 3),
        petCount: data.features.pet.petCount + 1,
        lastPetAt: timestamp,
        log: pushPetLog(data.features.pet, `got scritches at ${formatPetTime(now)}`)
      }
    }
  };
}

export function cleanPet(data: KinokoData, now = new Date()): KinokoData {
  const timestamp = now.toISOString();
  return {
    ...data,
    features: {
      ...data.features,
      pet: {
        ...data.features.pet,
        cleanliness: 100,
        happiness: Math.max(0, data.features.pet.happiness - 4),
        cleanedCount: data.features.pet.cleanedCount + 1,
        lastCleanedAt: timestamp,
        log: pushPetLog(data.features.pet, `got brushed clean`)
      }
    }
  };
}

export function setPetToy(data: KinokoData, toy: string): KinokoData {
  const cleanToy = toy.trim();
  if (!cleanToy) {
    return data;
  }

  return {
    ...data,
    features: {
      ...data.features,
      pet: {
        ...data.features.pet,
        favoriteToy: cleanToy.slice(0, 32),
        log: pushPetLog(data.features.pet, `favorite toy is now ${cleanToy.slice(0, 32)}`)
      }
    }
  };
}

export function addRepoGardenDir(data: KinokoData, dir: string): KinokoData {
  const cleanDir = dir.trim();
  if (!cleanDir || data.features.repoGarden.scanDirs.includes(cleanDir)) {
    return data;
  }

  return {
    ...data,
    features: {
      ...data.features,
      repoGarden: {
        ...data.features.repoGarden,
        scanDirs: [...data.features.repoGarden.scanDirs, cleanDir]
      }
    }
  };
}

export function removeSelectedRepoGardenDir(data: KinokoData): KinokoData {
  const index = data.features.repoGarden.selectedRepoIndex;
  return {
    ...data,
    features: {
      ...data.features,
      repoGarden: {
        ...data.features.repoGarden,
        scanDirs: data.features.repoGarden.scanDirs.filter((_, dirIndex) => dirIndex !== index),
        selectedRepoIndex: Math.max(0, Math.min(index, data.features.repoGarden.scanDirs.length - 2))
      }
    }
  };
}

export function selectRepoGardenDir(data: KinokoData, direction: -1 | 1): KinokoData {
  const maxIndex = Math.max(0, data.features.repoGarden.scanDirs.length - 1);
  return {
    ...data,
    features: {
      ...data.features,
      repoGarden: {
        ...data.features.repoGarden,
        selectedRepoIndex: Math.max(0, Math.min(maxIndex, data.features.repoGarden.selectedRepoIndex + direction))
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

  const v3WithoutRepoGarden = legacyV3DataSchema.safeParse(raw);
  if (v3WithoutRepoGarden.success) {
    return {
      ...v3WithoutRepoGarden.data,
      features: {
        pet: normalizePet(v3WithoutRepoGarden.data.features.pet),
        repoGarden: v3WithoutRepoGarden.data.features.repoGarden ?? defaultRepoGarden
      }
    };
  }

  const v2Current = legacyCurrentV2DataSchema.safeParse(raw);
  if (v2Current.success) {
    return {
      version: 3,
      days: v2Current.data.days,
      weather: v2Current.data.weather,
      features: {
        pet: defaultPet,
        repoGarden: defaultRepoGarden
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
        pet: defaultPet,
        repoGarden: defaultRepoGarden
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
      pet: defaultPet,
      repoGarden: defaultRepoGarden
    }
  };
}

function normalizeData(data: KinokoData): KinokoData {
  const pet = normalizePet(data.features.pet);
  return {
    ...data,
    features: {
      ...data.features,
      pet,
      repoGarden: data.features.repoGarden ?? defaultRepoGarden
    }
  };
}

function normalizePet(pet: Partial<Pet>): Pet {
  return {
    ...defaultPet,
    ...pet,
    species: 'cat',
    log: pet.log?.slice(-5) ?? defaultPet.log
  };
}

function pushPetLog(pet: Pet, entry: string): string[] {
  return [entry, ...pet.log].slice(0, 5);
}

function formatPetTime(date: Date): string {
  return format(date, 'h:mm a');
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

const legacyPetSchema = PetSchema.partial().extend({
  name: z.string().min(1),
  species: z.enum(['cat', 'mushroom']),
  hunger: z.number().int().min(0).max(100),
  happiness: z.number().int().min(0).max(100),
  fedCount: z.number().int().nonnegative(),
  lastFedAt: z.string().datetime().nullable()
});

const legacyV3DataSchema = z.object({
  version: z.literal(3),
  days: z.record(DailyRecordSchema),
  weather: WeatherSchema,
  features: z.object({
    pet: legacyPetSchema,
    repoGarden: z
      .object({
        scanDirs: z.array(z.string().min(1)),
        selectedRepoIndex: z.number().int().nonnegative()
      })
      .optional()
  })
});

const legacyV2DataSchema = legacyCurrentV2DataSchema.extend({
  days: z.record(legacyDailyRecordSchema)
});

type LegacyFocusState = z.infer<typeof legacyFocusStateSchema>;
