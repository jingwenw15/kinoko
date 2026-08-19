import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {KinokoDataSchema, type KinokoData} from './schema.js';
import {defaultData} from './defaults.js';

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
  return KinokoDataSchema.parse(JSON.parse(raw));
}

export function saveData(data: KinokoData, path = dataPath): void {
  KinokoDataSchema.parse(data);
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export function toggleTask(data: KinokoData, taskId: string): KinokoData {
  return {
    ...data,
    tasks: data.tasks.map(task =>
      task.id === taskId ? {...task, done: !task.done} : task
    )
  };
}

export function startFocus(data: KinokoData, now = new Date()): KinokoData {
  if (data.focus.activeStartedAt) {
    return data;
  }

  return {
    ...data,
    focus: {
      ...data.focus,
      activeStartedAt: now.toISOString()
    }
  };
}

export function pauseFocus(data: KinokoData, now = new Date()): KinokoData {
  if (!data.focus.activeStartedAt) {
    return data;
  }

  const startedAt = new Date(data.focus.activeStartedAt);
  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 60000));

  return {
    ...data,
    focus: {
      todayMinutes: data.focus.todayMinutes + elapsedMinutes,
      activeStartedAt: null
    }
  };
}

export function resetCurrentFocus(data: KinokoData): KinokoData {
  return {
    ...data,
    focus: {
      ...data.focus,
      activeStartedAt: null
    }
  };
}

export function getDisplayedFocusMinutes(data: KinokoData, now = new Date()): number {
  if (!data.focus.activeStartedAt) {
    return data.focus.todayMinutes;
  }

  const startedAt = new Date(data.focus.activeStartedAt);
  const elapsedMinutes = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 60000));
  return data.focus.todayMinutes + elapsedMinutes;
}
