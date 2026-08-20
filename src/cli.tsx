#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import React from 'react';
import {render} from 'ink';
import {App} from './App.js';
import {
  addTask,
  addTasks,
  deleteTask,
  editTask,
  getToday,
  getDisplayedFocusMinutes,
  getFocusRemainingSeconds,
  loadData,
  saveData,
  setNote,
  pauseFocus,
  resetCurrentFocus,
  resumeFocus,
  startBreak,
  startFocus,
  toggleTask,
  todayKey,
  updateToday
} from './state/store.js';
import {
  hasWeatherLocation,
  loadConfig,
  saveConfig,
  setBreakMinutes,
  setFocusMinutes,
  setGeocodedWeatherLocation,
  setTheme,
  setWeatherLocation
} from './config.js';
import {fetchOpenMeteoWeather, geocodeLocation, markWeatherStale} from './weather/openMeteo.js';
import {parseTaskFile} from './integrations/tasks.js';
import {formatRepoSummary, scanRepos} from './repoGarden/scanner.js';

const [, , command, ...args] = process.argv;

await main();

async function main(): Promise<void> {
  switch (command) {
    case undefined:
      render(<App />);
      break;
    case 'add':
      requireArg(args[0], 'usage: kinoko add "task title"');
      runMutation(record => addTask(record, args.join(' ')), `added task for ${todayKey()}`);
      break;
    case 'done':
    case 'toggle':
      requireArg(args[0], `usage: kinoko ${command} <task-id-or-number>`);
      runMutation(record => toggleTask(record, args[0]!), `updated task ${args[0]}`);
      break;
    case 'delete':
    case 'rm':
      requireArg(args[0], `usage: kinoko ${command} <task-id-or-number>`);
      runMutation(record => deleteTask(record, args[0]!), `deleted task ${args[0]}`);
      break;
    case 'edit':
      requireArg(args[0], 'usage: kinoko edit <task-id-or-number> <new title>');
      requireArg(args[1], 'usage: kinoko edit <task-id-or-number> <new title>');
      runMutation(record => editTask(record, args[0]!, args.slice(1).join(' ')), `edited task ${args[0]}`);
      break;
    case 'note':
      runMutation(record => setNote(record, args.join(' ')), `updated note for ${todayKey()}`);
      break;
    case 'list':
    case 'ls':
      printToday();
      break;
    case 'weather':
      await runWeatherCommand(args);
      break;
    case 'focus':
      runFocusCommand(args);
      break;
    case 'repos':
      runReposCommand();
      break;
    case 'config':
      runConfigCommand(args);
      break;
    case 'import':
      runImportCommand(args);
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    default:
      console.error(`unknown command: ${command}`);
      printHelp();
      process.exitCode = 1;
  }
}

function runReposCommand(): void {
  const data = loadData();
  const dirs = data.features.repoGarden.scanDirs;
  const repos = scanRepos(dirs);

  if (dirs.length === 0) {
    console.log('no repo garden scan dirs configured');
    console.log('open kinoko, press v, then y to add a directory');
    return;
  }

  if (repos.length === 0) {
    console.log(`no git repos found in ${dirs.length} scan dir${dirs.length === 1 ? '' : 's'}`);
    return;
  }

  for (const repo of repos) {
    const dirty = repo.dirty ? ' *' : '';
    console.log(`${formatRepoSummary(repo)}${dirty}`);
    console.log(`  ${repo.path}`);
  }
}

function runImportCommand(args: string[]): void {
  const [kind, filePath] = args;
  requireArg(kind, 'usage: kinoko import tasks <path>');
  requireArg(filePath, 'usage: kinoko import tasks <path>');
  const content = readFileSync(filePath, 'utf8');

  switch (kind) {
    case 'tasks': {
      const tasks = parseTaskFile(content);
      runMutation(record => addTasks(record, tasks), `imported ${tasks.length} tasks`);
      break;
    }
    default:
      console.error('usage: kinoko import tasks <path>');
      process.exit(1);
  }
}

function runMutation(
  updater: Parameters<typeof updateToday>[1],
  message: string
): void {
  const data = loadData();
  const next = updateToday(data, updater);
  saveData(next);
  console.log(message);
}

function printToday(): void {
  const today = getToday(loadData());
  const lines = today.tasks.map((task, index) => {
    const marker = task.done ? '●' : '○';
    return `${index + 1}. ${marker} ${task.title} (${task.id})`;
  });

  console.log(lines.length > 0 ? lines.join('\n') : 'no tasks yet');
  if (today.note) {
    console.log(`note: ${today.note}`);
  }
}

async function runWeatherCommand(args: string[]): Promise<void> {
  const [subcommand, ...rest] = args;

  switch (subcommand) {
    case 'set-location': {
      requireArg(rest[0], 'usage: kinoko weather set-location <name> [latitude longitude]');

      if (rest.length >= 3) {
        const [name, latitudeValue, longitudeValue] = rest;
        const latitude = Number(latitudeValue);
        const longitude = Number(longitudeValue);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          console.error('latitude and longitude must be numbers');
          process.exit(1);
        }

        const config = setWeatherLocation(loadConfig(), name!, latitude, longitude);
        saveConfig(config);
        console.log(`set weather location to ${name} (${latitude}, ${longitude})`);
        break;
      }

      const location = await geocodeLocation(rest.join(' '));
      const config = setGeocodedWeatherLocation(loadConfig(), location);
      saveConfig(config);
      console.log(`set weather location to ${location.name} (${location.latitude}, ${location.longitude})`);
      break;
    }
    case 'refresh': {
      const config = loadConfig();
      if (!hasWeatherLocation(config)) {
        console.error('weather location is not configured');
        console.error('usage: kinoko weather set-location <name> <latitude> <longitude>');
        process.exit(1);
      }

      const data = loadData();
      try {
        const weather = await fetchOpenMeteoWeather(config);
        saveData({...data, weather});
        console.log(`weather refreshed: ${weather.conditionIcon} ${weather.temperature} ${weather.label}`);
      } catch (error) {
        saveData({...data, weather: markWeatherStale(data.weather)});
        console.error(error instanceof Error ? error.message : 'weather refresh failed');
        process.exitCode = 1;
      }
      break;
    }
    case 'config': {
      console.log(JSON.stringify(loadConfig().weather, null, 2));
      break;
    }
    default:
      console.log(`weather commands:
  kinoko weather set-location <name> <latitude> <longitude>
  kinoko weather refresh
  kinoko weather config`);
  }
}

function runFocusCommand(args: string[]): void {
  const [subcommand] = args;
  const config = loadConfig();

  switch (subcommand) {
    case 'start':
      runMutation(record => startFocus(record, new Date(), config.focus.focusMinutes), 'started focus session');
      break;
    case 'break':
      runMutation(record => startBreak(record, new Date(), config.focus.breakMinutes), 'started break');
      break;
    case 'pause':
      runMutation(record => pauseFocus(record), 'paused current focus segment');
      break;
    case 'resume':
      runMutation(record => resumeFocus(record), 'resumed focus');
      break;
    case 'reset':
      runMutation(record => resetCurrentFocus(record, config.focus.focusMinutes), 'reset current focus segment');
      break;
    case 'status':
    case undefined:
      printFocusStatus();
      break;
    default:
      console.log(`focus commands:
  kinoko focus start
  kinoko focus break
  kinoko focus pause
  kinoko focus resume
  kinoko focus reset
  kinoko focus status`);
  }
}

function runConfigCommand(args: string[]): void {
  const [subcommand, value] = args;
  const config = loadConfig();

  switch (subcommand) {
    case 'focus-minutes': {
      const minutes = parseDuration(value, 'usage: kinoko config focus-minutes <1-180>');
      saveConfig(setFocusMinutes(config, minutes));
      console.log(`focus minutes set to ${minutes}`);
      break;
    }
    case 'break-minutes': {
      const minutes = parseDuration(value, 'usage: kinoko config break-minutes <1-180>');
      saveConfig(setBreakMinutes(config, minutes));
      console.log(`break minutes set to ${minutes}`);
      break;
    }
    case 'focus':
      console.log(JSON.stringify(config.focus, null, 2));
      break;
    case 'show':
    case undefined:
      console.log(JSON.stringify(config, null, 2));
      break;
    case 'theme': {
      const theme = parseTheme(value);
      saveConfig(setTheme(config, theme));
      console.log(`theme set to ${theme}`);
      break;
    }
    default:
      console.log(`config commands:
  kinoko config show
  kinoko config focus
  kinoko config focus-minutes <1-180>
  kinoko config break-minutes <1-180>
  kinoko config theme <cozy|pixel|zen>`);
  }
}

function printFocusStatus(): void {
  const config = loadConfig();
  const today = getToday(loadData());
  const remaining = today.focus.status === 'idle' ? config.focus.focusMinutes * 60 : getFocusRemainingSeconds(today);
  console.log(`status: ${today.focus.status}`);
  console.log(`today: ${getDisplayedFocusMinutes(today)} min`);
  console.log(`remaining: ${formatDuration(remaining)}`);
  console.log(`segments: ${today.focus.sessions.length}`);
}

function printHelp(): void {
  console.log(`kinoko

usage:
  kinoko                         open terminal desktop
  kinoko add "task title"         add a task for today
  kinoko done <id-or-number>      toggle a task done/open
  kinoko delete <id-or-number>    delete a task
  kinoko edit <id-or-number> "x"  rename a task
  kinoko note "text"              set today's note
  kinoko list                     list today's tasks
  kinoko weather set-location <name>
  kinoko weather set-location <name> <lat> <lon>
  kinoko weather refresh          fetch Open-Meteo weather
  kinoko weather config           show weather config
  kinoko focus start              start a focus session
  kinoko focus break              start a break
  kinoko focus pause              pause current segment
  kinoko focus resume             resume paused segment
  kinoko focus reset              reset current segment
  kinoko focus status             show focus status
  kinoko repos                    list repo garden status
  kinoko config focus-minutes <n> set default focus length
  kinoko config break-minutes <n> set default break length
  kinoko config theme <name>      set theme: cozy, pixel, zen
  kinoko import tasks <path>      import Markdown or Todo.txt tasks
`);
}

function requireArg(value: string | undefined, message: string): asserts value is string {
  if (!value) {
    console.error(message);
    process.exit(1);
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function parseDuration(value: string | undefined, message: string): number {
  requireArg(value, message);
  const minutes = Number.parseInt(value, 10);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
    console.error(message);
    process.exit(1);
  }

  return minutes;
}

function parseTheme(value: string | undefined): 'cozy' | 'pixel' | 'zen' {
  requireArg(value, 'usage: kinoko config theme <cozy|pixel|zen>');
  if (value !== 'cozy' && value !== 'pixel' && value !== 'zen') {
    console.error('usage: kinoko config theme <cozy|pixel|zen>');
    process.exit(1);
  }

  return value;
}
