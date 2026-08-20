import React, {useMemo} from 'react';
import {Box, Text} from 'ink';
import {Panel} from '../../components/Panel.js';
import {colors} from '../../theme/colors.js';
import {formatRepoSummary, scanRepos} from '../../repoGarden/scanner.js';
import type {KinokoModule, ModuleContext} from '../types.js';

function RepoGardenHomeCard(props: ModuleContext & {active: boolean}) {
  const scanDirs = props.data.features.repoGarden.scanDirs;
  const scanKey = scanDirs.join('\n');
  const repos = useMemo(() => scanRepos(scanDirs, 8), [scanKey]);
  const dirtyCount = repos.filter(repo => repo.dirty).length;
  const unpushedCount = repos.filter(repo => repo.ahead > 0).length;

  return (
    <Panel title="repo garden" active={props.active} palette={props.palette} grow={false}>
      <Text color={colors.cream}>{repos.length} repo{repos.length === 1 ? '' : 's'} growing</Text>
      <Text color={colors.muted}>{dirtyCount} dirty · {unpushedCount} unpushed · press v</Text>
      <Text color={colors.moss}>{repos.slice(0, 6).map(repo => repo.plant).join(' ') || 'no plants yet'}</Text>
    </Panel>
  );
}

function RepoGardenScreen(props: ModuleContext) {
  const garden = props.data.features.repoGarden;
  const scanKey = garden.scanDirs.join('\n');
  const repos = useMemo(() => scanRepos(garden.scanDirs), [scanKey]);
  const selectedRepo = repos[Math.min(garden.selectedRepoIndex, Math.max(0, repos.length - 1))];

  return (
    <Panel title="repo garden" active palette={props.palette} minWidth={56}>
      <Text color={colors.muted}>repos: ↑/↓ select · scan dirs: [/ ] select · y add dir · u remove dir</Text>
      {garden.scanDirs.length === 0 && (
        <Text color={colors.amber}>no scan dirs yet. press y and enter a folder path.</Text>
      )}
      {garden.scanDirs.map((dir, index) => (
        <Text key={dir} color={index === garden.selectedScanDirIndex ? colors.amber : colors.muted}>
          {index === garden.selectedScanDirIndex ? '› ' : '  '}{dir}
        </Text>
      ))}
      <Box marginTop={1} flexDirection="column">
        <Text color={colors.cream}>plants</Text>
        {repos.length === 0 && (
          <Text color={colors.muted}>no git repos found directly inside configured dirs</Text>
        )}
        {repos.map((repo, index) => (
          <Text key={repo.path} color={colors.cream}>
            <Text color={index === garden.selectedRepoIndex ? colors.amber : colors.muted}>
              {index === garden.selectedRepoIndex ? '› ' : '  '}
            </Text>
            {formatRepoSummary(repo)}
            {repo.dirty ? <Text color={colors.amber}> *</Text> : ''}
          </Text>
        ))}
        {repos.some(repo => repo.dirty) && (
          <Text color={colors.muted}>* has local changes</Text>
        )}
      </Box>
      {selectedRepo && (
        <Box marginTop={1} flexDirection="column">
          <Text color={colors.cream}>selected</Text>
          <Text color={colors.muted}>path: {selectedRepo.path}</Text>
          <Text color={colors.muted}>commits: {selectedRepo.commits} · last: {selectedRepo.lastCommitAge}</Text>
          <Text color={colors.muted}>sync: ahead {selectedRepo.ahead} · behind {selectedRepo.behind}</Text>
          <Text color={colors.muted}>last commit: {selectedRepo.lastCommitSubject}</Text>
        </Box>
      )}
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
