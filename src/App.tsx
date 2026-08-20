import React, {useEffect, useState} from 'react';
import {Box, Text, useApp, useInput} from 'ink';
import {Header} from './components/Header.js';
import {Footer} from './components/Footer.js';
import {HelpOverlay} from './components/HelpOverlay.js';
import {HomeScreen} from './screens/HomeScreen.js';
import {useClock} from './hooks/useClock.js';
import {useTerminalSize} from './hooks/useTerminalSize.js';
import {
  addTask,
  deleteTask,
  editTask,
  feedPet,
  getDataPath,
  getToday,
  loadData,
  pauseFocus,
  resetCurrentFocus,
  resumeFocus,
  renamePet,
  setNote,
  startBreak,
  saveData,
  startFocus,
  toggleTask,
  updateToday
} from './state/store.js';
import type {KinokoData} from './state/schema.js';
import {colors, themes, type ThemeName} from './theme/colors.js';
import {mascots} from './theme/ascii.js';
import {getModule, moduleIds} from './modules/registry.js';
import type {ModuleId, ModuleContext} from './modules/types.js';
import {
  hasWeatherLocation,
  loadConfig,
  saveConfig,
  setBreakMinutes,
  setFocusMinutes,
  setGeocodedWeatherLocation,
  setTheme
} from './config.js';
import {
  fetchOpenMeteoWeather,
  geocodeLocation,
  markWeatherStale,
  shouldRefreshWeather
} from './weather/openMeteo.js';

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
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(0);
  const [activeModuleId, setActiveModuleId] = useState<ModuleId | null>(null);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [entryMode, setEntryMode] = useState<'add' | 'edit' | 'note' | 'location' | 'focusMinutes' | 'breakMinutes' | 'petName' | null>(null);
  const [entryText, setEntryText] = useState('');
  const [focusConfigStatus, setFocusConfigStatus] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const today = getToday(data, now);
  const config = loadConfig();
  const palette = themes[config.ui.theme];

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

        if (mode === 'focusMinutes' || mode === 'breakMinutes') {
          const minutes = Number.parseInt(text, 10);
          if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
            setFocusConfigStatus('duration must be 1-180 minutes');
          } else {
            const config = loadConfig();
            saveConfig(
              mode === 'focusMinutes'
                ? setFocusMinutes(config, minutes)
                : setBreakMinutes(config, minutes)
            );
            setFocusConfigStatus(
              mode === 'focusMinutes' ? `focus set to ${minutes} min` : `break set to ${minutes} min`
            );
            setData(current =>
              updateToday(current, record => {
                if (record.focus.status !== 'idle') {
                  return record;
                }

                return {
                  ...record,
                  focus: {
                    ...record.focus,
                    targetMinutes: mode === 'focusMinutes' ? minutes : record.focus.targetMinutes
                  }
                };
              })
            );
          }
          setEntryMode(null);
          setEntryText('');
          return;
        }

        if (mode === 'note') {
          setData(current => updateToday(current, record => setNote(record, text)));
          setEntryMode(null);
          setEntryText('');
          return;
        }

        if (mode === 'petName') {
          setData(current => renamePet(current, text));
          setEntryMode(null);
          setEntryText('');
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

    if (showHelp) {
      if (input === '?' || key.escape) {
        setShowHelp(false);
      }
      return;
    }

    if ((key.escape || key.backspace || key.delete) && activeModuleId) {
      setActiveModuleId(null);
      return;
    }

    if (input === 'q' || key.escape) {
      exit();
      return;
    }

    if (input === '?') {
      setShowHelp(true);
      return;
    }

    if (input === 't') {
      saveConfig(setTheme(loadConfig(), nextThemeName(loadConfig().ui.theme)));
      return;
    }

    if (key.tab) {
      setSelectedModuleIndex(index => {
        const nextIndex = (index + 1) % moduleIds.length;
        if (activeModuleId) {
          setActiveModuleId(moduleIds[nextIndex]!);
        }

        return nextIndex;
      });
      return;
    }

    if (input === '\u001b[Z') {
      setSelectedModuleIndex(index => {
        const nextIndex = (index - 1 + moduleIds.length) % moduleIds.length;
        if (activeModuleId) {
          setActiveModuleId(moduleIds[nextIndex]!);
        }

        return nextIndex;
      });
      return;
    }

    if (!activeModuleId) {
      if (key.upArrow) {
        setSelectedModuleIndex(index => Math.max(0, index - 1));
        return;
      }

      if (key.downArrow) {
        setSelectedModuleIndex(index => Math.min(moduleIds.length - 1, index + 1));
        return;
      }

      if (key.return) {
        setActiveModuleId(moduleIds[selectedModuleIndex]!);
        return;
      }
    }

    const selectedModuleId = activeModuleId ?? moduleIds[selectedModuleIndex]!;

    if (input === '1') {
      setSelectedModule('tasks', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      return;
    }

    if (input === '2') {
      setSelectedModule('focus', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      return;
    }

    if (input === '3') {
      setSelectedModule('weather', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      return;
    }

    if (input === '4') {
      setSelectedModule('note', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      return;
    }

    if (input === '5') {
      setSelectedModule('pet', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      return;
    }

    if (input === 'p') {
      setSelectedModule('pet', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      return;
    }

    if (input === 'l') {
      setSelectedModule('weather', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      setEntryMode('location');
      setEntryText('');
      return;
    }

    if (input === 'f') {
      setSelectedModule('focus', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      setEntryMode('focusMinutes');
      setEntryText(String(loadConfig().focus.focusMinutes));
      return;
    }

    if (input === 'g') {
      setSelectedModule('focus', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      setEntryMode('breakMinutes');
      setEntryText(String(loadConfig().focus.breakMinutes));
      return;
    }

    if (input === 'n') {
      setSelectedModule('note', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      setEntryMode('note');
      setEntryText(today.note);
      return;
    }

    if (input === 'm') {
      setSelectedModule('pet', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      setEntryMode('petName');
      setEntryText(data.features.pet.name);
      return;
    }

    if (input === 'x') {
      setSelectedModule('pet', setSelectedModuleIndex, setActiveModuleId, Boolean(activeModuleId));
      setData(current => feedPet(current, new Date()));
      return;
    }

    if (selectedModuleId === 'tasks') {
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
        updateToday(current, record => {
          if (record.focus.status === 'focus' || record.focus.status === 'break') {
            return pauseFocus(record, new Date());
          }

          if (record.focus.status === 'paused') {
            return resumeFocus(record, new Date());
          }

          return startFocus(record, new Date(), loadConfig().focus.focusMinutes);
        })
      );
      return;
    }

    if (input === 'b') {
      setData(current =>
        updateToday(current, record => startBreak(record, new Date(), loadConfig().focus.breakMinutes))
      );
      return;
    }

    if (input === 'r') {
      setData(current =>
        updateToday(current, record => resetCurrentFocus(record, loadConfig().focus.focusMinutes))
      );
    }
  });

  const activeModule = activeModuleId ? getModule(activeModuleId) : null;
  const moduleContext: ModuleContext = {
    data,
    today,
    now,
    config,
    palette,
    selectedTaskIndex,
    weatherStatus,
    focusConfigStatus
  };

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box borderStyle="round" borderColor={palette.shell} flexDirection="column" paddingX={1}>
        <Header now={now} weather={data.weather} />
        {showHelp && <HelpOverlay palette={palette} />}
        {activeModule ? (
          <Box flexDirection="column">
            <Text color={colors.muted}>module · esc/backspace home</Text>
            <activeModule.Screen {...moduleContext} />
          </Box>
        ) : (
          <HomeScreen
            {...moduleContext}
            compact={compact}
            selectedModuleIndex={selectedModuleIndex}
          />
        )}
        {entryMode && (
          <Box>
            <Text color={colors.amber}>
              {formatEntryPrompt(entryMode)}: {entryText}
            </Text>
          </Box>
        )}
        <Footer palette={palette} mascotArt={selectMascot(today, data)} />
      </Box>
      <Text color={colors.muted}>data: {dataPath ?? getDataPath()}</Text>
    </Box>
  );
}

function setSelectedModule(
  moduleId: ModuleId,
  setSelectedModuleIndex: React.Dispatch<React.SetStateAction<number>>,
  setActiveModuleId: React.Dispatch<React.SetStateAction<ModuleId | null>>,
  keepActive: boolean
): void {
  setSelectedModuleIndex(moduleIds.indexOf(moduleId));
  if (keepActive) {
    setActiveModuleId(moduleId);
  }
}

function formatEntryPrompt(entryMode: 'add' | 'edit' | 'note' | 'location' | 'focusMinutes' | 'breakMinutes' | 'petName'): string {
  if (entryMode === 'add') return 'new task';
  if (entryMode === 'edit') return 'edit task';
  if (entryMode === 'note') return 'pocket note';
  if (entryMode === 'focusMinutes') return 'focus minutes';
  if (entryMode === 'breakMinutes') return 'break minutes';
  if (entryMode === 'petName') return 'pet name';
  return 'location name';
}

function nextThemeName(theme: ThemeName): ThemeName {
  if (theme === 'cozy') return 'pixel';
  if (theme === 'pixel') return 'zen';
  return 'cozy';
}

function selectMascot(today: ReturnType<typeof getToday>, data: KinokoData): string {
  if (today.focus.status === 'focus') return mascots.focus;
  if (today.focus.status === 'break') return mascots.break;
  if (data.weather.label.includes('rain')) return mascots.rainy;
  if (today.tasks.length > 0 && today.tasks.every(task => task.done)) return mascots.done;
  return mascots.idle;
}
