import React from 'react';
import {Box, Text} from 'ink';
import {colors, type ThemePalette} from '../theme/colors.js';

type HelpOverlayProps = {
  palette?: ThemePalette;
};

export function HelpOverlay({palette = colors}: HelpOverlayProps) {
  return (
    <Box borderStyle="round" borderColor={palette.cap} flexDirection="column" paddingX={1}>
      <Text color={palette.cap}>kinoko help</Text>
      <Text color={palette.cream}>home: ↑↓ choose · enter open · esc/backspace returns home</Text>
      <Text color={palette.cream}>tab / shift-tab: switch modules · 1-6 jump modules</Text>
      <Text color={palette.cream}>tasks: ↑↓ move · enter done · a add · e edit · d delete</Text>
      <Text color={palette.cream}>focus: space start/pause/resume · b break · r reset segment · f/g durations</Text>
      <Text color={palette.cream}>weather: l set location by name</Text>
      <Text color={palette.cream}>note: n edit pocket note</Text>
      <Text color={palette.cream}>pet: p open · x feed · z play · s scritch · c clean · m rename · o toy</Text>
      <Text color={palette.cream}>repo garden: v open · ↑/↓ repos · [/ ] scan dirs · y add dir · u remove dir</Text>
      <Text color={palette.cream}>themes: t cycle cozy/pixel/zen</Text>
      <Text color={palette.muted}>press ? or escape to close · q quits app</Text>
    </Box>
  );
}
