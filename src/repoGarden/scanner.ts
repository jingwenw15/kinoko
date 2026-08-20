import {existsSync, readdirSync} from 'node:fs';
import {basename, join} from 'node:path';
import {execFileSync} from 'node:child_process';

export type GardenRepo = {
  name: string;
  path: string;
  commits: number;
  branch: string;
  dirty: boolean;
  plant: string;
};

export function scanRepos(scanDirs: string[], limit = 24): GardenRepo[] {
  const repos: GardenRepo[] = [];
  const seen = new Set<string>();

  for (const dir of scanDirs) {
    if (!existsSync(dir)) {
      continue;
    }

    for (const repoPath of findGitRepos(dir)) {
      if (seen.has(repoPath)) {
        continue;
      }

      seen.add(repoPath);
      repos.push(readRepo(repoPath));

      if (repos.length >= limit) {
        return repos;
      }
    }
  }

  return repos.sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name));
}

function findGitRepos(root: string): string[] {
  const repos: string[] = [];

  if (existsSync(join(root, '.git'))) {
    return [root];
  }

  let entries: string[] = [];
  try {
    entries = readdirSync(root, {withFileTypes: true})
      .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
      .map(entry => join(root, entry.name));
  } catch {
    return repos;
  }

  for (const entry of entries) {
    if (existsSync(join(entry, '.git'))) {
      repos.push(entry);
    }
  }

  return repos;
}

function readRepo(path: string): GardenRepo {
  const commits = readNumber(path, ['rev-list', '--count', 'HEAD']);
  const branch = readText(path, ['branch', '--show-current']) || 'detached';
  const dirty = readText(path, ['status', '--porcelain']).length > 0;

  return {
    name: basename(path),
    path,
    commits,
    branch,
    dirty,
    plant: plantForCommits(commits)
  };
}

function readNumber(cwd: string, args: string[]): number {
  const text = readText(cwd, args);
  const value = Number.parseInt(text, 10);
  return Number.isFinite(value) ? value : 0;
}

function readText(cwd: string, args: string[]): string {
  try {
    return execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore']}).trim();
  } catch {
    return '';
  }
}

function plantForCommits(commits: number): string {
  if (commits >= 500) return '🌳';
  if (commits >= 100) return '🌲';
  if (commits >= 25) return '🌿';
  if (commits >= 5) return '🌱';
  return '·';
}
