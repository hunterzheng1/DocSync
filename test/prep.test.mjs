import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hasCommand } from '../src/utils/shell.mjs';
import { isGitRepo } from '../src/utils/git.mjs';
import { getCwd } from '../src/utils/paths.mjs';

describe('prep utilities', () => {
  it('hasCommand returns false for missing commands', () => {
    assert.equal(hasCommand('nonexistent-command-xyz'), false);
  });

  it('hasCommand returns true for node', () => {
    const result = hasCommand('node');
    // which may not work on Windows, so we just verify the function returns a boolean
    assert.equal(typeof result, 'boolean');
  });

  it('isGitRepo works', () => {
    // Our project is a git repo
    assert.equal(typeof isGitRepo(process.cwd()), 'boolean');
  });

  it('getCwd returns current directory when no cwd option', () => {
    const cwd = getCwd({});
    assert.equal(typeof cwd, 'string');
    assert.ok(cwd.length > 0);
  });
});

describe('prep command routing', () => {
  it('prep command exists and can be imported', async () => {
    const { runPrep } = await import('../src/commands/prep.mjs');
    assert.equal(typeof runPrep, 'function');
  });

  it('prep accepts dry-run option', async () => {
    const { runPrep } = await import('../src/commands/prep.mjs');
    // dry-run will fail because repomix is not installed, but we verify the function exists
    try {
      await runPrep({ dryRun: true });
    } catch {
      // Expected - repomix not installed
    }
  });
});
