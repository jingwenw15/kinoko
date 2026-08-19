import React from 'react';
import {Box, Text} from 'ink';
import {format} from 'date-fns';
import type {KinokoData} from '../state/schema.js';
import {colors} from '../theme/colors.js';

type HeaderProps = {
  now: Date;
  data: KinokoData;
};

export function Header({now, data}: HeaderProps) {
  return (
    <Box justifyContent="space-between">
      <Text color={colors.cap}>🍄 kinoko</Text>
      <Text color={colors.cream}>{format(now, 'EEE MMM d').toLowerCase()}</Text>
      <Text color={colors.amber}>{format(now, 'h:mm a')}</Text>
      <Text color={colors.blue}>
        {data.weather.conditionIcon} {data.weather.temperature}
      </Text>
    </Box>
  );
}
