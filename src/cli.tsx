#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import {App} from './App.js';
import {
  addTask,
  deleteTask,
  editTask,
  getToday,
  loadData,
  saveData,
  setNote,
  toggleTask,
  todayKey,
  updateToday
} from './state/store.js';
import {
  hasWeatherLocation,
  loadConfig,
  saveConfig,
  setGeocodedWeatherLocation,
  setWeatherLocation
} from './config.js';
import {fetchOpenMeteoWeather, geocodeLocation, markWeatherStale} from './weather/openMeteo.js';

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
`);
}

function requireArg(value: string | undefined, message: string): asserts value is string {
  if (!value) {
    console.error(message);
    process.exit(1);
  }
}
