import React from 'react';
import {Box, Text} from 'ink';
import {Layout} from '../components/Layout.js';
import {modules} from '../modules/registry.js';
import type {ModuleContext} from '../modules/types.js';
import {colors} from '../theme/colors.js';

type HomeScreenProps = ModuleContext & {
  compact: boolean;
  selectedModuleIndex: number;
};

export function HomeScreen({compact, selectedModuleIndex, ...context}: HomeScreenProps) {
  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color={colors.muted}>home · ↑/↓ choose · enter open · tab cycles</Text>
      </Box>
      <Layout compact={compact}>
        {modules.map((module, index) => {
          const HomeCard = module.HomeCard;
          return (
            <Box key={module.id} flexDirection="column" flexGrow={1}>
              <Text color={index === selectedModuleIndex ? colors.amber : colors.muted}>
                {index === selectedModuleIndex ? '› ' : '  '}
                {module.icon} {module.title}
              </Text>
              <HomeCard {...context} active={index === selectedModuleIndex} />
            </Box>
          );
        })}
      </Layout>
    </Box>
  );
}
