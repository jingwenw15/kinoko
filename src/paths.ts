import {resolve} from 'node:path';

export function getKinokoHome(): string {
  return process.env.KINOKO_HOME
    ? resolve(process.env.KINOKO_HOME)
    : resolve(process.cwd(), '.kinoko');
}

export function getKinokoDataPath(): string {
  return resolve(getKinokoHome(), 'kinoko.json');
}

export function getKinokoConfigPath(): string {
  return resolve(getKinokoHome(), 'config.json');
}
