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
      <Text color={palette.cream}>tab / shift-tab: switch panels</Text>
      <Text color={palette.cream}>tasks: ↑↓ move · enter done · a add · e edit · d delete</Text>
      <Text color={palette.cream}>focus: space start/pause/resume · b break · r reset segment · f/g durations</Text>
      <Text color={palette.cream}>weather: l set location by name</Text>
      <Text color={palette.cream}>note: n edit pocket note</Text>
      <Text color={palette.cream}>themes: t cycle cozy/pixel/zen</Text>
      <Text color={palette.muted}>press ? or escape to close · q quits app</Text>
    </Box>
  );
}
