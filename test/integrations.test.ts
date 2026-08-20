import {describe, expect, it} from 'vitest';
import {parseTaskFile} from '../src/integrations/tasks.js';

describe('task imports', () => {
  it('parses markdown checkboxes', () => {
    expect(parseTaskFile('- [ ] write outline\n- [x] email sam\n# ignored')).toEqual([
      {title: 'write outline', done: false},
      {title: 'email sam', done: true}
    ]);
  });

  it('parses todo.txt lines when no checkboxes exist', () => {
    expect(parseTaskFile('(A) review notes\nx 2026-08-19 stretch')).toEqual([
      {title: 'review notes', done: false},
      {title: 'stretch', done: true}
    ]);
  });
});
