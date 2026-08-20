import React, {type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {colors, type ThemePalette} from '../theme/colors.js';

type PanelProps = {
  title: string;
  active?: boolean;
  minWidth?: number;
  palette?: ThemePalette;
  children: ReactNode;
};

export function Panel({title, active = false, minWidth = 22, palette = colors, children}: PanelProps) {
  return (
    <Box
      borderStyle="round"
      borderColor={active ? palette.cap : palette.shell}
      flexDirection="column"
      paddingX={1}
      paddingY={0}
      minWidth={minWidth}
      flexGrow={1}
    >
      <Text color={active ? palette.cap : palette.cream}>{title}</Text>
      {children}
    </Box>
  );
}
