import React from 'react';
import {Box, Text} from 'ink';
import {Panel} from '../../components/Panel.js';
import {colors} from '../../theme/colors.js';
import type {KinokoModule, ModuleContext} from '../types.js';

function PetHomeCard(props: ModuleContext & {active: boolean}) {
  const pet = props.data.features.pet;

  return (
    <Panel title="terminal cat" active={props.active} palette={props.palette} grow={false}>
      <Text color={colors.cream}>{pet.name} · {petMood(pet.hunger, pet.happiness)}</Text>
      <Text color={colors.muted}>hunger {pet.hunger}/100 · happiness {pet.happiness}/100</Text>
      <Text color={colors.muted}>press x to feed · m to name</Text>
    </Panel>
  );
}

function PetScreen(props: ModuleContext) {
  const pet = props.data.features.pet;

  return (
    <Panel title="terminal cat" active palette={props.palette} minWidth={44}>
      <Box flexDirection="column" alignItems="center">
        <Text color={colors.moss}> /\_/\\ </Text>
        <Text color={colors.moss}>( o.o )</Text>
        <Text color={colors.moss}> &gt; ^ &lt; </Text>
      </Box>
      <Text color={colors.cream}>{pet.name} is {petMood(pet.hunger, pet.happiness)}</Text>
      <Text color={colors.muted}>hunger: {pet.hunger}/100</Text>
      <Text color={colors.muted}>happiness: {pet.happiness}/100</Text>
      <Text color={colors.muted}>fed {pet.fedCount} time{pet.fedCount === 1 ? '' : 's'}</Text>
      <Text color={colors.muted}>
        last fed: {pet.lastFedAt ? new Date(pet.lastFedAt).toLocaleString() : 'never'}
      </Text>
      <Text color={colors.amber}>x feed · m rename · esc home</Text>
    </Panel>
  );
}

function petMood(hunger: number, happiness: number): string {
  if (hunger >= 80) return 'very hungry';
  if (happiness >= 85) return 'delighted';
  if (hunger <= 20) return 'full';
  if (happiness < 35) return 'a little lonely';
  return 'content';
}

export const petModule: KinokoModule = {
  id: 'pet',
  title: 'pet',
  icon: '🐈',
  order: 50,
  description: 'name and feed a tiny terminal pet',
  HomeCard: PetHomeCard,
  Screen: PetScreen
};
