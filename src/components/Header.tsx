import React from 'react';
import {Box, Text} from 'ink';
import {format} from 'date-fns';
import type {Weather} from '../state/schema.js';
import {colors} from '../theme/colors.js';

type HeaderProps = {
  now: Date;
  weather: Weather;
};

export function Header({now, weather}: HeaderProps) {
  return (
    <Box justifyContent="space-between">
      <Text color={colors.cap}>🍄 kinoko</Text>
      <Text color={colors.cream}>{format(now, 'EEE MMM d').toLowerCase()}</Text>
      <Text color={colors.amber}>{format(now, 'h:mm a')}</Text>
      <Text color={colors.blue}>
        {weather.conditionIcon} {weather.temperature}
      </Text>
    </Box>
  );
}
