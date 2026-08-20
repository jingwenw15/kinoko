import type React from 'react';
import type {KinokoConfig, KinokoData, DailyRecord} from '../state/schema.js';
import type {ThemePalette} from '../theme/colors.js';

export type ModuleId = 'tasks' | 'focus' | 'weather' | 'note' | 'pet';

export type ModuleContext = {
  data: KinokoData;
  today: DailyRecord;
  now: Date;
  config: KinokoConfig;
  palette: ThemePalette;
  selectedTaskIndex: number;
  weatherStatus: string | null;
  focusConfigStatus: string | null;
};

export type KinokoModule = {
  id: ModuleId;
  title: string;
  icon: string;
  order: number;
  description: string;
  HomeCard: React.ComponentType<ModuleContext & {active: boolean}>;
  Screen: React.ComponentType<ModuleContext>;
};
