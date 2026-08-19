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
  addTask,
  deleteTask,
  editTask,
  getToday,
  loadData,
  pauseFocus,
  resetCurrentFocus,
  saveData,
  startFocus,
  toggleTask,
  updateToday
} from './state/store.js';
import type {KinokoData} from './state/schema.js';
import {colors} from './theme/colors.js';
import {hasWeatherLocation, loadConfig, saveConfig, setGeocodedWeatherLocation} from './config.js';
import {
  fetchOpenMeteoWeather,
  geocodeLocation,
  markWeatherStale,
  shouldRefreshWeather
} from './weather/openMeteo.js';

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
  const [weatherStatus, setWeatherStatus] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState(0);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [entryMode, setEntryMode] = useState<'add' | 'edit' | 'location' | null>(null);
  const [entryText, setEntryText] = useState('');
  const today = getToday(data, now);

  useEffect(() => {
    saveData(data, dataPath);
  }, [data, dataPath]);

  useEffect(() => {
    const config = loadConfig();
    if (!hasWeatherLocation(config) || !shouldRefreshWeather(data.weather)) {
      return;
    }

    let cancelled = false;
    setWeatherStatus('refreshing weather');
    fetchOpenMeteoWeather(config)
      .then(weather => {
        if (cancelled) return;
        setData(current => ({...current, weather}));
        setWeatherStatus(null);
      })
      .catch(() => {
        if (cancelled) return;
        setData(current => ({...current, weather: markWeatherStale(current.weather)}));
        setWeatherStatus('weather offline · using cached data');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useInput((input, key) => {
    if (entryMode) {
      if (key.escape) {
        setEntryMode(null);
        setEntryText('');
        return;
      }

      if (key.return) {
        const mode = entryMode;
        const text = entryText;
        if (mode === 'location') {
          setEntryMode(null);
          setEntryText('');
          setWeatherStatus(`finding ${text}`);
          geocodeLocation(text)
            .then(location => {
              const config = setGeocodedWeatherLocation(loadConfig(), location);
              saveConfig(config);
              setWeatherStatus(`refreshing ${location.name}`);
              return fetchOpenMeteoWeather(config);
            })
            .then(weather => {
              setData(current => ({...current, weather}));
              setWeatherStatus(null);
            })
            .catch(error => {
              setData(current => ({...current, weather: markWeatherStale(current.weather)}));
              setWeatherStatus(error instanceof Error ? error.message : 'location setup failed');
            });
          return;
        }

        setData(current =>
          updateToday(current, record => {
            if (mode === 'add') {
              return addTask(record, text);
            }

            const selectedTask = record.tasks[selectedTaskIndex];
            return selectedTask ? editTask(record, selectedTask.id, text) : record;
          })
        );
        setEntryMode(null);
        setEntryText('');
        return;
      }

      if (key.backspace || key.delete) {
        setEntryText(text => text.slice(0, -1));
        return;
      }

      if (input && !key.ctrl && !key.meta) {
        setEntryText(text => text + input);
      }
      return;
    }

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

    if (input === 'l') {
      setActivePanel(panels.indexOf('weather'));
      setEntryMode('location');
      setEntryText('');
      return;
    }

    if (panels[activePanel] === 'tasks') {
      if (key.upArrow) {
        setSelectedTaskIndex(index => Math.max(0, index - 1));
        return;
      }

      if (key.downArrow) {
        setSelectedTaskIndex(index => Math.min(today.tasks.length - 1, index + 1));
        return;
      }

      if (key.return && today.tasks[selectedTaskIndex]) {
        setData(current =>
          updateToday(current, record => toggleTask(record, record.tasks[selectedTaskIndex]!.id))
        );
        return;
      }

      if (input === 'a') {
        setEntryMode('add');
        setEntryText('');
        return;
      }

      if (input === 'e' && today.tasks[selectedTaskIndex]) {
        setEntryMode('edit');
        setEntryText(today.tasks[selectedTaskIndex]!.title);
        return;
      }

      if (input === 'd' && today.tasks[selectedTaskIndex]) {
        setData(current =>
          updateToday(current, record => deleteTask(record, record.tasks[selectedTaskIndex]!.id))
        );
        setSelectedTaskIndex(index => Math.max(0, Math.min(index, today.tasks.length - 2)));
        return;
      }
    }

    if (input === ' ') {
      setData(current =>
        updateToday(current, record =>
          record.focus.activeStartedAt ? pauseFocus(record, new Date()) : startFocus(record, new Date())
        )
      );
      return;
    }

    if (input === 'r') {
      setData(current => updateToday(current, record => resetCurrentFocus(record)));
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor={colors.shell} flexDirection="column" paddingX={1}>
        <Header now={now} weather={data.weather} />
        <Layout compact={compact}>
          <TasksPanel
            tasks={today.tasks}
            selectedIndex={selectedTaskIndex}
            active={panels[activePanel] === 'tasks'}
          />
          <FocusPanel record={today} now={now} active={panels[activePanel] === 'focus'} />
          <WeatherPanel data={data} active={panels[activePanel] === 'weather'} status={weatherStatus} />
        </Layout>
        <NotePanel record={today} active={panels[activePanel] === 'note'} />
        {entryMode && (
          <Box>
            <Text color={colors.amber}>
              {formatEntryPrompt(entryMode)}: {entryText}
            </Text>
          </Box>
        )}
        <Footer />
      </Box>
      <Text color={colors.muted}>data: {dataPath ?? 'data/kinoko.json'}</Text>
    </Box>
  );
}

function formatEntryPrompt(entryMode: 'add' | 'edit' | 'location'): string {
  if (entryMode === 'add') return 'new task';
  if (entryMode === 'edit') return 'edit task';
  return 'location name';
}
