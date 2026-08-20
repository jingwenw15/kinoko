import {describe, expect, it} from 'vitest';
import {getKinokoConfigPath, getKinokoDataPath, getKinokoHome} from '../src/paths.js';

describe('paths', () => {
  it('uses .kinoko under cwd by default', () => {
    const original = process.env.KINOKO_HOME;
    delete process.env.KINOKO_HOME;

    expect(getKinokoHome()).toContain('.kinoko');
    expect(getKinokoDataPath()).toContain('.kinoko/kinoko.json');
    expect(getKinokoConfigPath()).toContain('.kinoko/config.json');

    restoreKinokoHome(original);
  });

  it('uses KINOKO_HOME when provided', () => {
    const original = process.env.KINOKO_HOME;
    process.env.KINOKO_HOME = '/tmp/kinoko-state';

    expect(getKinokoHome()).toBe('/tmp/kinoko-state');
    expect(getKinokoDataPath()).toBe('/tmp/kinoko-state/kinoko.json');
    expect(getKinokoConfigPath()).toBe('/tmp/kinoko-state/config.json');

    restoreKinokoHome(original);
  });
});

function restoreKinokoHome(value: string | undefined): void {
  if (value === undefined) {
    delete process.env.KINOKO_HOME;
  } else {
    process.env.KINOKO_HOME = value;
  }
}
