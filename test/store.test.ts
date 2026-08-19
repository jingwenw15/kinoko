import {mkdtempSync, readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  getDisplayedFocusMinutes,
  loadData,
  pauseFocus,
  resetCurrentFocus,
  saveData,
  startFocus,
  toggleTask
} from '../src/state/store.js';
import {defaultData} from '../src/state/defaults.js';

function tempDataPath() {
  return join(mkdtempSync(join(tmpdir(), 'kinoko-test-')), 'kinoko.json');
}

describe('store', () => {
  it('creates default state when no file exists', () => {
    const path = tempDataPath();
    const data = loadData(path);

    expect(data).toEqual(defaultData);
    expect(JSON.parse(readFileSync(path, 'utf8'))).toEqual(defaultData);
  });

  it('saves and loads valid data', () => {
    const path = tempDataPath();
    const data = {...defaultData, note: 'steady'};

    saveData(data, path);

    expect(loadData(path).note).toBe('steady');
  });

  it('toggles a task by id', () => {
    const updated = toggleTask(defaultData, 'write-outline');

    expect(updated.tasks[0]?.done).toBe(true);
    expect(defaultData.tasks[0]?.done).toBe(false);
  });

  it('starts, pauses, and resets focus', () => {
    const start = new Date('2026-08-19T19:00:00.000Z');
    const pause = new Date('2026-08-19T19:12:30.000Z');
    const running = startFocus(defaultData, start);

    expect(running.focus.activeStartedAt).toBe(start.toISOString());
    expect(getDisplayedFocusMinutes(running, pause)).toBe(50);

    const paused = pauseFocus(running, pause);
    expect(paused.focus.activeStartedAt).toBeNull();
    expect(paused.focus.todayMinutes).toBe(50);

    const reset = resetCurrentFocus(running);
    expect(reset.focus.activeStartedAt).toBeNull();
    expect(reset.focus.todayMinutes).toBe(38);
  });
});
