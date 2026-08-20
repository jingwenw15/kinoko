import React from 'react';
import {Text} from 'ink';
import {WeatherPanel} from '../../components/WeatherPanel.js';
import {Panel} from '../../components/Panel.js';
import {colors} from '../../theme/colors.js';
import type {KinokoModule, ModuleContext} from '../types.js';

function WeatherHomeCard(props: ModuleContext & {active: boolean}) {
  const weather = props.data.weather;

  return (
    <Panel title="weather" active={props.active} palette={props.palette}>
      <Text color={colors.blue}>{weather.conditionIcon} {weather.temperature} · {weather.label}</Text>
      <Text color={colors.muted}>{weather.locationName || 'set location with l'}</Text>
    </Panel>
  );
}

function WeatherScreen(props: ModuleContext) {
  return <WeatherPanel data={props.data} active status={props.weatherStatus} />;
}

export const weatherModule: KinokoModule = {
  id: 'weather',
  title: 'weather',
  icon: '☁',
  order: 30,
  description: 'current local forecast',
  HomeCard: WeatherHomeCard,
  Screen: WeatherScreen
};
