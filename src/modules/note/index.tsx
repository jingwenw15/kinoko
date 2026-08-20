import React from 'react';
import {Text} from 'ink';
import {NotePanel} from '../../components/NotePanel.js';
import {Panel} from '../../components/Panel.js';
import {colors} from '../../theme/colors.js';
import type {KinokoModule, ModuleContext} from '../types.js';

function NoteHomeCard(props: ModuleContext & {active: boolean}) {
  return (
    <Panel title="pocket note" active={props.active} palette={props.palette}>
      <Text color={colors.cream}>{props.today.note || 'no note for today'}</Text>
      <Text color={colors.muted}>press n to edit</Text>
    </Panel>
  );
}

function NoteScreen(props: ModuleContext) {
  return <NotePanel record={props.today} active />;
}

export const noteModule: KinokoModule = {
  id: 'note',
  title: 'note',
  icon: '✎',
  order: 40,
  description: 'small note for today',
  HomeCard: NoteHomeCard,
  Screen: NoteScreen
};
