import React from 'react';
import {Box, Text} from 'ink';
import type {Task} from '../state/schema.js';
import {Panel} from './Panel.js';
import {colors} from '../theme/colors.js';

type TasksPanelProps = {
  tasks: Task[];
  selectedIndex: number;
  active: boolean;
};

export function TasksPanel({tasks, selectedIndex, active}: TasksPanelProps) {
  return (
    <Panel title="today" active={active}>
      {tasks.map((task, index) => {
        const selected = active && index === selectedIndex;
        return (
          <Box key={task.id}>
            <Text color={selected ? colors.amber : task.done ? colors.muted : colors.cream}>
              {selected ? '› ' : '  '}
              {task.done ? '●' : '○'} {task.title}
            </Text>
          </Box>
        );
      })}
      {tasks.length === 0 && <Text color={colors.muted}>no tasks yet</Text>}
    </Panel>
  );
}
