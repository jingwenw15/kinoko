import React, {type ReactNode} from 'react';
import {Box} from 'ink';

type LayoutProps = {
  compact: boolean;
  children: ReactNode;
};

export function Layout({compact, children}: LayoutProps) {
  return (
    <Box flexDirection={compact ? 'column' : 'row'} gap={1}>
      {children}
    </Box>
  );
}
