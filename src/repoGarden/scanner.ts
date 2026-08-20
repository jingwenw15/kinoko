import {existsSync, readdirSync} from 'node:fs';
import {basename, join} from 'node:path';
import {execFileSync} from 'node:child_process';

export type GardenRepo = {
  name: string;
  path: string;
  commits: number;
  branch: string;
  dirty: boolean;
  dirtyFiles: number;
  ahead: number;
  behind: number;
  lastCommitAt: string | null;
  lastCommitAge: string;
  lastCommitSubject: string;
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
  const status = readText(path, ['status', '--porcelain']);
  const dirtyFiles = status ? status.split('\n').filter(Boolean).length : 0;
  const aheadBehind = readAheadBehind(path);
  const lastCommitAt = readText(path, ['log', '-1', '--format=%cI']) || null;
  const lastCommitSubject = readText(path, ['log', '-1', '--format=%s']) || 'no commits yet';

  return {
    name: basename(path),
    path,
    commits,
    branch,
    dirty: dirtyFiles > 0,
    dirtyFiles,
    ahead: aheadBehind.ahead,
    behind: aheadBehind.behind,
    lastCommitAt,
    lastCommitAge: formatCommitAge(lastCommitAt),
    lastCommitSubject,
    plant: plantForCommits(commits)
  };
}

export function formatRepoSummary(repo: GardenRepo): string {
  const changes = repo.dirtyFiles > 0 ? `${repo.dirtyFiles} changed` : 'clean';
  const sync = repo.ahead > 0 || repo.behind > 0 ? ` · ↑${repo.ahead} ↓${repo.behind}` : '';
  return `${repo.plant} ${repo.name} · ${repo.branch} · ${changes}${sync} · ${repo.lastCommitAge}`;
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

function readAheadBehind(cwd: string): {ahead: number; behind: number} {
  const upstream = readText(cwd, ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  if (!upstream) {
    return {ahead: 0, behind: 0};
  }

  const counts = readText(cwd, ['rev-list', '--left-right', '--count', `HEAD...${upstream}`])
    .split(/\s+/)
    .map(value => Number.parseInt(value, 10));

  return {
    ahead: Number.isFinite(counts[0]) ? counts[0]! : 0,
    behind: Number.isFinite(counts[1]) ? counts[1]! : 0
  };
}

function formatCommitAge(timestamp: string | null): string {
  if (!timestamp) {
    return 'no commits';
  }

  const elapsedMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    return 'just now';
  }

  const minutes = Math.floor(elapsedMs / 60000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 60) return `${days}d ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function plantForCommits(commits: number): string {
  if (commits >= 500) return '🌳';
  if (commits >= 100) return '🌲';
  if (commits >= 25) return '🌿';
  if (commits >= 5) return '🌱';
  return '·';
}
