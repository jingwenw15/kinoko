import React from 'react';
import {Text} from 'ink';
import type {KinokoData} from '../state/schema.js';
import {getDisplayedFocusMinutes} from '../state/store.js';
import {Panel} from './Panel.js';
import {colors} from '../theme/colors.js';

type FocusPanelProps = {
  data: KinokoData;
  now: Date;
  active: boolean;
};

function progressBar(minutes: number): string {
  const target = 50;
  const filled = Math.min(10, Math.round((minutes / target) * 10));
  return `${'█'.repeat(filled)}${'░'.repeat(10 - filled)}`;
}

export function FocusPanel({data, now, active}: FocusPanelProps) {
  const minutes = getDisplayedFocusMinutes(data, now);
  const running = Boolean(data.focus.activeStartedAt);

  return (
    <Panel title="focus" active={active}>
      <Text color={colors.cream}>{minutes} min today</Text>
      <Text color={colors.moss}>{progressBar(minutes)}</Text>
      <Text color={running ? colors.moss : colors.muted}>
        {running ? 'running · space pauses' : 'space starts'}
      </Text>
      <Text color={colors.muted}>r resets current session</Text>
    </Panel>
  );
}
