import React, {useMemo} from 'react';
import {Box, Text} from 'ink';
import {Panel} from '../../components/Panel.js';
import {colors} from '../../theme/colors.js';
import {scanRepos} from '../../repoGarden/scanner.js';
import type {KinokoModule, ModuleContext} from '../types.js';

function RepoGardenHomeCard(props: ModuleContext & {active: boolean}) {
  const scanDirs = props.data.features.repoGarden.scanDirs;
  const scanKey = scanDirs.join('\n');
  const repos = useMemo(() => scanRepos(scanDirs, 8), [scanKey]);

  return (
    <Panel title="repo garden" active={props.active} palette={props.palette} grow={false}>
      <Text color={colors.cream}>{repos.length} repo{repos.length === 1 ? '' : 's'} growing</Text>
      <Text color={colors.muted}>{scanDirs.length} scan dir{scanDirs.length === 1 ? '' : 's'} · press y to add</Text>
      <Text color={colors.moss}>{repos.slice(0, 6).map(repo => repo.plant).join(' ') || 'no plants yet'}</Text>
    </Panel>
  );
}

function RepoGardenScreen(props: ModuleContext) {
  const garden = props.data.features.repoGarden;
  const scanKey = garden.scanDirs.join('\n');
  const repos = useMemo(() => scanRepos(garden.scanDirs), [scanKey]);

  return (
    <Panel title="repo garden" active palette={props.palette} minWidth={56}>
      <Text color={colors.muted}>scan dirs · ↑/↓ select · y add dir · u remove dir</Text>
      {garden.scanDirs.length === 0 && (
        <Text color={colors.amber}>no scan dirs yet. press y and enter a folder path.</Text>
      )}
      {garden.scanDirs.map((dir, index) => (
        <Text key={dir} color={index === garden.selectedRepoIndex ? colors.amber : colors.muted}>
          {index === garden.selectedRepoIndex ? '› ' : '  '}{dir}
        </Text>
      ))}
      <Box marginTop={1} flexDirection="column">
        <Text color={colors.cream}>plants</Text>
        {repos.length === 0 && (
          <Text color={colors.muted}>no git repos found directly inside configured dirs</Text>
        )}
        {repos.map(repo => (
          <Text key={repo.path} color={colors.cream}>
            {repo.plant} {repo.name} · {repo.commits} commits · {repo.branch}
            {repo.dirty ? <Text color={colors.amber}> *</Text> : ''}
          </Text>
        ))}
        {repos.some(repo => repo.dirty) && (
          <Text color={colors.muted}>* has local changes</Text>
        )}
      </Box>
    </Panel>
  );
}

export const repoGardenModule: KinokoModule = {
  id: 'repoGarden',
  title: 'repo garden',
  icon: '🌱',
  order: 60,
  description: 'local repositories as plants',
  HomeCard: RepoGardenHomeCard,
  Screen: RepoGardenScreen
};
