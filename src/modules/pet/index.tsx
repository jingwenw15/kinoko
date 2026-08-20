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
      <Text color={colors.muted}>food {100 - pet.hunger}/100 · joy {pet.happiness}/100 · energy {pet.energy}/100</Text>
      <Text color={colors.muted}>x feed · z play · s scritch</Text>
    </Panel>
  );
}

function PetScreen(props: ModuleContext) {
  const pet = props.data.features.pet;

  return (
    <Panel title="terminal cat" active palette={props.palette} minWidth={44}>
      <Box flexDirection="column" alignItems="center">
        <Text color={pet.happiness >= 85 ? colors.amber : colors.moss}> /\_/\\ </Text>
        <Text color={pet.hunger >= 80 ? colors.amber : colors.moss}>{catFace(pet.hunger, pet.happiness, pet.energy)}</Text>
        <Text color={colors.moss}> &gt; ^ &lt; </Text>
      </Box>
      <Text color={colors.cream}>{pet.name} is {petMood(pet.hunger, pet.happiness)}</Text>
      <Text color={colors.muted}>favorite toy: {pet.favoriteToy}</Text>
      <Text color={colors.muted}>food: {100 - pet.hunger}/100 · hunger: {pet.hunger}/100</Text>
      <Text color={colors.muted}>happiness: {pet.happiness}/100 · energy: {pet.energy}/100 · clean: {pet.cleanliness}/100</Text>
      <Text color={colors.muted}>
        fed {pet.fedCount} · played {pet.playCount} · scritched {pet.petCount} · cleaned {pet.cleanedCount}
      </Text>
      <Text color={colors.muted}>
        last fed: {pet.lastFedAt ? new Date(pet.lastFedAt).toLocaleString() : 'never'}
      </Text>
      <Text color={colors.muted}>
        last play: {pet.lastPlayedAt ? new Date(pet.lastPlayedAt).toLocaleString() : 'never'}
      </Text>
      <Box marginTop={1} flexDirection="column">
        <Text color={colors.cream}>activity</Text>
        {pet.log.map((entry, index) => (
          <Text key={`${entry}-${index}`} color={colors.muted}>- {entry}</Text>
        ))}
      </Box>
      <Text color={colors.amber}>x feed · z play · s scritch · c clean · m rename · o toy · esc home</Text>
    </Panel>
  );
}

function petMood(hunger: number, happiness: number, energy = 100): string {
  if (hunger >= 80) return 'very hungry';
  if (energy <= 20) return 'sleepy';
  if (happiness >= 85) return 'delighted';
  if (hunger <= 20) return 'full';
  if (happiness < 35) return 'a little lonely';
  return 'content';
}

function catFace(hunger: number, happiness: number, energy: number): string {
  if (energy <= 20) return '( -.- )';
  if (hunger >= 80) return '( >.< )';
  if (happiness >= 85) return '( ^.^ )';
  return '( o.o )';
}

export const petModule: KinokoModule = {
  id: 'pet',
  title: 'pet',
  icon: '🐈',
  order: 50,
  description: 'care for a tiny terminal cat',
  HomeCard: PetHomeCard,
  Screen: PetScreen
};
