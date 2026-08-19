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

const [, , command, ...args] = process.argv;

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
`);
}

function requireArg(value: string | undefined, message: string): asserts value is string {
  if (!value) {
    console.error(message);
    process.exit(1);
  }
}
