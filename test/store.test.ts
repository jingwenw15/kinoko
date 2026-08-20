import {mkdtempSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
  addTask,
  deleteTask,
  editTask,
  getDisplayedFocusMinutes,
  getFocusRemainingSeconds,
  getToday,
  loadData,
  pauseFocus,
  resetCurrentFocus,
  resumeFocus,
  saveData,
  setNote,
  startBreak,
  startFocus,
  toggleTask,
  updateToday
} from '../src/state/store.js';
import {defaultDailyRecord, defaultData} from '../src/state/defaults.js';

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

  it('saves and loads valid v2 data', () => {
    const path = tempDataPath();
    const date = new Date('2026-08-19T19:00:00.000Z');
    const data = updateToday(defaultData, record => setNote(record, 'steady'), date);

    saveData(data, path);

    expect(getToday(loadData(path), date).note).toBe('steady');
  });

  it('migrates legacy flat data into today', () => {
    const path = tempDataPath();
    writeFileSync(
      path,
      JSON.stringify({
        tasks: [{id: 'legacy-task', title: 'legacy task', done: false}],
        focus: {todayMinutes: 12, activeStartedAt: null},
        weather: {label: 'cloudy', temperature: '68°F', conditionIcon: '☁'},
        note: 'old note'
      }),
      'utf8'
    );

    const data = loadData(path);
    const today = getToday(data);

    expect(data.version).toBe(2);
    expect(today.tasks[0]?.id).toBe('legacy-task');
    expect(today.focus.todayMinutes).toBe(12);
    expect(today.focus.status).toBe('idle');
    expect(today.focus.sessions).toEqual([]);
    expect(today.note).toBe('old note');
  });

  it('creates separate records per day', () => {
    const first = new Date('2026-08-19T12:00:00.000Z');
    const second = new Date('2026-08-20T12:00:00.000Z');
    const data = updateToday(defaultData, record => setNote(record, 'first'), first);

    expect(getToday(data, first).note).toBe('first');
    expect(getToday(data, second)).toEqual(defaultDailyRecord);
  });

  it('adds, edits, toggles, and deletes tasks', () => {
    const added = addTask(defaultDailyRecord, 'review notes');
    const edited = editTask(added, 'review-notes', 'review project notes');
    const toggled = toggleTask(edited, '1');
    const deleted = deleteTask(toggled, 'review-notes');

    expect(added.tasks.at(-1)?.id).toBe('review-notes');
    expect(edited.tasks.at(-1)?.title).toBe('review project notes');
    expect(toggled.tasks[0]?.done).toBe(true);
    expect(deleted.tasks.some(task => task.id === 'review-notes')).toBe(false);
  });

  it('starts, pauses, resumes, and resets focus', () => {
    const start = new Date('2026-08-19T19:00:00.000Z');
    const pause = new Date('2026-08-19T19:12:30.000Z');
    const running = startFocus(defaultDailyRecord, start);

    expect(running.focus.status).toBe('focus');
    expect(running.focus.activeStartedAt).toBe(start.toISOString());
    expect(getDisplayedFocusMinutes(running, pause)).toBe(12);
    expect(getFocusRemainingSeconds(running, pause)).toBe(750);

    const paused = pauseFocus(running, pause);
    expect(paused.focus.status).toBe('paused');
    expect(paused.focus.activeStartedAt).toBeNull();
    expect(paused.focus.elapsedSeconds).toBe(750);
    expect(paused.focus.todayMinutes).toBe(0);
    expect(getFocusRemainingSeconds(paused, pause)).toBe(750);
    expect(paused.focus.sessions).toEqual([]);

    const resumed = resumeFocus(paused, new Date('2026-08-19T19:20:00.000Z'));
    expect(resumed.focus.status).toBe('focus');
    expect(getFocusRemainingSeconds(resumed, new Date('2026-08-19T19:20:00.000Z'))).toBe(750);

    const reset = resetCurrentFocus(paused);
    expect(reset.focus.status).toBe('idle');
    expect(reset.focus.activeStartedAt).toBeNull();
    expect(reset.focus.elapsedSeconds).toBe(0);
    expect(reset.focus.todayMinutes).toBe(0);
    expect(reset.focus.sessions).toHaveLength(0);
  });

  it('tracks break sessions without adding focus minutes', () => {
    const start = new Date('2026-08-19T19:00:00.000Z');
    const pause = new Date('2026-08-19T19:04:10.000Z');
    const running = startBreak(defaultDailyRecord, start);
    const paused = pauseFocus(running, pause);

    expect(running.focus.status).toBe('break');
    expect(paused.focus.todayMinutes).toBe(0);
    expect(paused.focus.elapsedSeconds).toBe(250);
    expect(paused.focus.sessions).toEqual([]);
  });
});
