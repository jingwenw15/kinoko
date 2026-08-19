import React from 'react';
import {Text} from 'ink';
import type {KinokoData} from '../state/schema.js';
import {Panel} from './Panel.js';
import {colors} from '../theme/colors.js';

type WeatherPanelProps = {
  data: KinokoData;
  active: boolean;
};

export function WeatherPanel({data, active}: WeatherPanelProps) {
  return (
    <Panel title="little weather" active={active}>
      <Text color={colors.blue}>
        {data.weather.conditionIcon} {data.weather.label}
      </Text>
      <Text color={colors.cream}>{data.weather.temperature}</Text>
      <Text color={colors.muted}>mock data v1</Text>
    </Panel>
  );
}
