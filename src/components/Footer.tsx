import React from 'react';
import {Box, Text} from 'ink';
import {mascot} from '../theme/ascii.js';
import {colors, type ThemePalette} from '../theme/colors.js';

type FooterProps = {
  palette?: ThemePalette;
  mascotArt?: string;
};

export function Footer({palette = colors, mascotArt = mascot}: FooterProps) {
  return (
    <Box justifyContent="space-between">
      <Text color={palette.muted}>? help · tab switch · a/e/d tasks · l location · f/g durations · space/b focus · q quit</Text>
      <Text color={palette.cap}>{mascotArt}</Text>
    </Box>
  );
}
