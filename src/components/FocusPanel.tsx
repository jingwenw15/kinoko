import React from 'react';
import {Text} from 'ink';
import type {DailyRecord, KinokoConfig} from '../state/schema.js';
import {
  getDisplayedFocusMinutes,
  getFocusElapsedSeconds,
  getFocusRemainingSeconds
} from '../state/store.js';
import {Panel} from './Panel.js';
import {colors} from '../theme/colors.js';

type FocusPanelProps = {
  record: DailyRecord;
  now: Date;
  active: boolean;
  config: KinokoConfig['focus'];
  status?: string | null;
};

function progressBar(elapsedSeconds: number, targetMinutes: number): string {
  const targetSeconds = targetMinutes * 60;
  const filled = Math.min(10, Math.round((elapsedSeconds / targetSeconds) * 10));
  return `${'█'.repeat(filled)}${'░'.repeat(10 - filled)}`;
}

export function FocusPanel({record, now, active, config, status}: FocusPanelProps) {
  const minutes = getDisplayedFocusMinutes(record, now);
  const elapsedSeconds = getFocusElapsedSeconds(record, now);
  const displayTargetMinutes = record.focus.status === 'idle' ? config.focusMinutes : record.focus.targetMinutes;
  const remainingSeconds =
    record.focus.status === 'idle'
      ? displayTargetMinutes * 60
      : getFocusRemainingSeconds(record, now);
  const running = record.focus.status === 'focus' || record.focus.status === 'break';

  return (
    <Panel title="focus" active={active}>
      <Text color={colors.cream}>
        {formatStatus(record.focus.status)} · {formatDuration(remainingSeconds)} left
      </Text>
      <Text color={colors.moss}>{progressBar(elapsedSeconds, displayTargetMinutes)}</Text>
      <Text color={colors.cream}>{minutes} focus min today</Text>
      <Text color={colors.muted}>defaults {config.focusMinutes}/{config.breakMinutes} min</Text>
      <Text color={colors.muted}>{record.focus.sessions.length} completed segments</Text>
      <Text color={running ? colors.moss : colors.muted}>
        {running ? 'running · space pauses' : 'space starts/resumes'}
      </Text>
      <Text color={colors.muted}>f focus length · g break length</Text>
      {status && <Text color={colors.amber}>{status}</Text>}
    </Panel>
  );
}

function formatStatus(status: DailyRecord['focus']['status']): string {
  if (status === 'focus') return 'focusing';
  if (status === 'break') return 'break';
  if (status === 'paused') return 'paused';
  return 'idle';
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}
