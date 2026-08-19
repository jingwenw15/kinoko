import React from 'react';
import {Text} from 'ink';
import type {KinokoData} from '../state/schema.js';
import {Panel} from './Panel.js';
import {colors} from '../theme/colors.js';

type NotePanelProps = {
  data: KinokoData;
  active: boolean;
};

export function NotePanel({data, active}: NotePanelProps) {
  return (
    <Panel title="pocket note" active={active}>
      <Text color={colors.cream}>{data.note || 'no note for today'}</Text>
    </Panel>
  );
}
