import React from 'react';
import {Text} from 'ink';
import type {KinokoData} from '../state/schema.js';
import {Panel} from './Panel.js';
import {colors} from '../theme/colors.js';

type WeatherPanelProps = {
  data: KinokoData;
  active: boolean;
  status?: string | null;
};

export function WeatherPanel({data, active, status}: WeatherPanelProps) {
  const weather = data.weather;
  return (
    <Panel title="little weather" active={active}>
      <Text color={colors.blue}>
        {weather.conditionIcon} {weather.label}
      </Text>
      <Text color={colors.cream}>
        {weather.temperature}
        {weather.apparentTemperature ? ` · feels ${weather.apparentTemperature}` : ''}
      </Text>
      {weather.highLow && <Text color={colors.cream}>{weather.highLow}</Text>}
      {weather.windSpeed && <Text color={colors.muted}>wind {weather.windSpeed}</Text>}
      {weather.locationName && <Text color={colors.muted}>{weather.locationName}</Text>}
      <Text color={weather.stale ? colors.amber : colors.muted}>
        {status ?? weather.attribution ?? 'mock data'}
      </Text>
    </Panel>
  );
}
