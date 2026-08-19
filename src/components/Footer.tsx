import React from 'react';
import {Box, Text} from 'ink';
import {mascot} from '../theme/ascii.js';
import {colors} from '../theme/colors.js';

export function Footer() {
  return (
    <Box justifyContent="space-between">
      <Text color={colors.muted}>tab switch · ↑↓ move · enter done · space focus · r reset · q quit</Text>
      <Text color={colors.cap}>{mascot}</Text>
    </Box>
  );
}
