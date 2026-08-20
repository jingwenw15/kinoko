import React from 'react';
import {Box, Text} from 'ink';
import {modules} from '../modules/registry.js';
import type {ModuleContext} from '../modules/types.js';
import {colors} from '../theme/colors.js';

type HomeScreenProps = ModuleContext & {
  compact: boolean;
  selectedModuleIndex: number;
};

export function HomeScreen({compact, selectedModuleIndex, ...context}: HomeScreenProps) {
  const columns = compact ? 1 : 2;
  const rows = chunk(modules, columns);

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={colors.muted}>home · ↑/↓ choose · enter open · tab cycles</Text>
      </Box>
      <Box flexDirection="column" gap={1}>
        {rows.map((row, rowIndex) => (
          <Box key={row.map(module => module.id).join('-')} flexDirection={compact ? 'column' : 'row'} gap={1}>
            {row.map(module => {
              const index = rowIndex * columns + row.indexOf(module);
              const HomeCard = module.HomeCard;
              return (
                <Box key={module.id} flexDirection="column" width={compact ? undefined : 38}>
                  <Text color={index === selectedModuleIndex ? colors.amber : colors.muted}>
                    {index === selectedModuleIndex ? '› ' : '  '}
                    {module.icon} {module.title}
                  </Text>
                  <HomeCard {...context} active={index === selectedModuleIndex} />
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    rows.push(items.slice(index, index + size));
  }

  return rows;
}
