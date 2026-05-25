import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../src/utils/args.mjs';

describe('parseArgs', () => {
  it('parses boolean flags', () => {
    const result = parseArgs(['--force', '--backup']);
    assert.strictEqual(result.options.force, true);
    assert.strictEqual(result.options.backup, true);
  });

  it('parses --dry-run flag', () => {
    const result = parseArgs(['--dry-run', '--verbose']);
    assert.strictEqual(result.options.dryRun, true);
    assert.strictEqual(result.options.verbose, true);
  });

  it('parses --cwd value flag', () => {
    const result = parseArgs(['--cwd', './demo']);
    assert.strictEqual(result.options.cwd, './demo');
  });

  it('parses multiple flags including value flags', () => {
    const result = parseArgs(['--force', '--cwd', './demo', '--verbose']);
    assert.strictEqual(result.options.force, true);
    assert.strictEqual(result.options.cwd, './demo');
    assert.strictEqual(result.options.verbose, true);
  });

  it('preserves rest (positional arguments)', () => {
    const result = parseArgs(['--force', 'install', './path']);
    assert.deepStrictEqual(result.rest, ['install', './path']);
  });

  it('throws on missing value for value flag', () => {
    assert.throws(() => parseArgs(['--cwd']), {
      message: /--cwd/,
    });
  });
});
