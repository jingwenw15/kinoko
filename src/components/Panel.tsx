import React, {type ReactNode} from 'react';
import {Box, Text} from 'ink';
import {colors} from '../theme/colors.js';

type PanelProps = {
  title: string;
  active?: boolean;
  minWidth?: number;
  children: ReactNode;
};

export function Panel({title, active = false, minWidth = 22, children}: PanelProps) {
  return (
    <Box
      borderStyle="round"
      borderColor={active ? colors.cap : colors.shell}
      flexDirection="column"
      paddingX={1}
      paddingY={0}
      minWidth={minWidth}
      flexGrow={1}
    >
      <Text color={active ? colors.cap : colors.cream}>{title}</Text>
      {children}
    </Box>
  );
}
