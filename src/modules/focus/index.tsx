import React from 'react';
import {Text} from 'ink';
import {FocusPanel} from '../../components/FocusPanel.js';
import {Panel} from '../../components/Panel.js';
import {colors} from '../../theme/colors.js';
import {getFocusRemainingSeconds} from '../../state/store.js';
import type {KinokoModule, ModuleContext} from '../types.js';

function FocusHomeCard(props: ModuleContext & {active: boolean}) {
  const remaining = getFocusRemainingSeconds(props.today, props.now);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <Panel title="focus" active={props.active} palette={props.palette}>
      <Text color={colors.cream}>
        {props.today.focus.status} · {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} left
      </Text>
      <Text color={colors.muted}>space pause/start · r reset</Text>
    </Panel>
  );
}

function FocusScreen(props: ModuleContext) {
  return (
    <FocusPanel
      record={props.today}
      now={props.now}
      active
      config={props.config.focus}
      status={props.focusConfigStatus}
    />
  );
}

export const focusModule: KinokoModule = {
  id: 'focus',
  title: 'focus',
  icon: '◷',
  order: 20,
  description: 'timer and focus totals',
  HomeCard: FocusHomeCard,
  Screen: FocusScreen
};
