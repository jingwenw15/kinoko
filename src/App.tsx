import React, {useEffect, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {Header} from './components/Header.js';
import {TasksPanel} from './components/TasksPanel.js';
import {FocusPanel} from './components/FocusPanel.js';
import {WeatherPanel} from './components/WeatherPanel.js';
import {NotePanel} from './components/NotePanel.js';
import {Footer} from './components/Footer.js';
import {Layout} from './components/Layout.js';
import {useClock} from './hooks/useClock.js';
import {useTerminalSize} from './hooks/useTerminalSize.js';
import {
  loadData,
  pauseFocus,
  resetCurrentFocus,
  saveData,
  startFocus,
  toggleTask
} from './state/store.js';
import type {KinokoData} from './state/schema.js';
import {colors} from './theme/colors.js';

const panels = ['tasks', 'focus', 'weather', 'note'] as const;

type AppProps = {
  dataPath?: string;
};

export function App({dataPath}: AppProps) {
  const {exit} = useApp();
  const now = useClock();
  const {columns} = useTerminalSize();
  const compact = columns < 84;
  const [data, setData] = useState<KinokoData>(() => loadData(dataPath));
  const [activePanel, setActivePanel] = useState(0);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);

  useEffect(() => {
    saveData(data, dataPath);
  }, [data, dataPath]);

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
      return;
    }

    if (key.tab) {
      setActivePanel(index => (index + 1) % panels.length);
      return;
    }

    if (input === '\u001b[Z') {
      setActivePanel(index => (index - 1 + panels.length) % panels.length);
      return;
    }

    if (panels[activePanel] === 'tasks') {
      if (key.upArrow) {
        setSelectedTaskIndex(index => Math.max(0, index - 1));
        return;
      }

      if (key.downArrow) {
        setSelectedTaskIndex(index => Math.min(data.tasks.length - 1, index + 1));
        return;
      }

      if (key.return && data.tasks[selectedTaskIndex]) {
        setData(current => toggleTask(current, current.tasks[selectedTaskIndex]!.id));
        return;
      }
    }

    if (input === ' ') {
      setData(current =>
        current.focus.activeStartedAt ? pauseFocus(current, new Date()) : startFocus(current, new Date())
      );
      return;
    }

    if (input === 'r') {
      setData(current => resetCurrentFocus(current));
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor={colors.shell} flexDirection="column" paddingX={1}>
        <Header now={now} data={data} />
        <Layout compact={compact}>
          <TasksPanel
            tasks={data.tasks}
            selectedIndex={selectedTaskIndex}
            active={panels[activePanel] === 'tasks'}
          />
          <FocusPanel data={data} now={now} active={panels[activePanel] === 'focus'} />
          <WeatherPanel data={data} active={panels[activePanel] === 'weather'} />
        </Layout>
        <NotePanel data={data} active={panels[activePanel] === 'note'} />
        <Footer />
      </Box>
      <Text color={colors.muted}>data: {dataPath ?? 'data/kinoko.json'}</Text>
    </Box>
  );
}
