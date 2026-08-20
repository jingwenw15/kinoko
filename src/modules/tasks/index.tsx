import React from 'react';
import {Text} from 'ink';
import {TasksPanel} from '../../components/TasksPanel.js';
import {Panel} from '../../components/Panel.js';
import {colors} from '../../theme/colors.js';
import type {KinokoModule, ModuleContext} from '../types.js';

function TasksHomeCard(props: ModuleContext & {active: boolean}) {
  const openTasks = props.today.tasks.filter(task => !task.done).length;

  return (
    <Panel title="tasks" active={props.active} palette={props.palette}>
      <Text color={colors.cream}>{openTasks} open · {props.today.tasks.length} total</Text>
      <Text color={colors.muted}>enter opens · a/e/d manage</Text>
    </Panel>
  );
}

function TasksScreen(props: ModuleContext) {
  return (
    <TasksPanel
      tasks={props.today.tasks}
      selectedIndex={props.selectedTaskIndex}
      active
    />
  );
}

export const tasksModule: KinokoModule = {
  id: 'tasks',
  title: 'tasks',
  icon: '○',
  order: 10,
  description: 'today’s task list',
  HomeCard: TasksHomeCard,
  Screen: TasksScreen
};
