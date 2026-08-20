import {tasksModule} from './tasks/index.js';
import {focusModule} from './focus/index.js';
import {weatherModule} from './weather/index.js';
import {noteModule} from './note/index.js';
import {petModule} from './pet/index.js';
import {repoGardenModule} from './repoGarden/index.js';
import type {KinokoModule, ModuleId} from './types.js';

export const modules: KinokoModule[] = [
  tasksModule,
  focusModule,
  weatherModule,
  noteModule,
  petModule,
  repoGardenModule
].sort((a, b) => a.order - b.order);

export const moduleIds = modules.map(module => module.id);

export function getModule(id: ModuleId): KinokoModule {
  return modules.find(module => module.id === id) ?? modules[0]!;
}
