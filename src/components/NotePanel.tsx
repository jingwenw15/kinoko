import React from 'react';
import {Text} from 'ink';
import type {DailyRecord} from '../state/schema.js';
import {Panel} from './Panel.js';
import {colors} from '../theme/colors.js';

type NotePanelProps = {
  record: DailyRecord;
  active: boolean;
};

export function NotePanel({record, active}: NotePanelProps) {
  return (
    <Panel title="pocket note" active={active}>
      <Text color={colors.cream}>{record.note || 'no note for today'}</Text>
    </Panel>
  );
}
