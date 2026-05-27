import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function createTmpDir() {
  return mkdtempSync(join(tmpdir(), 'sync-test-'));
}

function cleanupTmpDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}

describe('sync command', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = createTmpDir();
    try {
      const { execSync } = await import('node:child_process');
      execSync('git init', { cwd: tmpDir, stdio: 'ignore' });
    } catch {
      // git might not be available
    }
  });

  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('runSync rejects when not initialized', async () => {
    const { runSync } = await import('../src/commands/sync.mjs');
    const result = await runSync({ cwd: tmpDir, quiet: true });
    assert.equal(result, undefined);
    process.exitCode = 0; // runSync sets exitCode=1, reset for test runner
  });

  it('runSync rejects when workspace is incomplete', async () => {
    mkdirSync(join(tmpDir, '.docsync', 'state'), { recursive: true });
    writeFileSync(
      join(tmpDir, '.docsync', 'state', 'install.json'),
      JSON.stringify({ version: 1 }),
      'utf8'
    );

    const { runSync } = await import('../src/commands/sync.mjs');
    const result = await runSync({ cwd: tmpDir, quiet: true });
    assert.equal(result, undefined);
    process.exitCode = 0; // runSync sets exitCode=1, reset for test runner
  });
});

describe('sync helpers', () => {
  it('computeEdits returns create action for missing doc', async () => {
    const { computeEdits } = await import('../src/commands/sync.mjs');
    const facts = {
      readme: null,
      agents: null,
      claude: null,
      scripts: {},
      rules: { default: '', override: '', protected: [] },
    };
    const rules = {};

    const result = computeEdits(facts, rules, 'README.md');
    assert.equal(result.action, 'create');
    assert.ok(result.content.includes('# Project'));
  });

  it('computeEdits returns review action for existing doc', async () => {
    const { computeEdits } = await import('../src/commands/sync.mjs');
    const facts = {
      readme: '# Existing README\n',
      agents: null,
      claude: null,
      scripts: {},
      rules: { default: '', override: '', protected: [] },
    };
    const rules = {};

    const result = computeEdits(facts, rules, 'README.md');
    assert.equal(result.action, 'review');
    assert.equal(result.content, '# Existing README\n');
  });

  it('computeEdits creates all three doc templates', async () => {
    const { computeEdits } = await import('../src/commands/sync.mjs');
    const facts = { readme: null, agents: null, claude: null, scripts: {}, rules: {} };
    const rules = {};

    const readme = computeEdits(facts, rules, 'README.md');
    const agents = computeEdits(facts, rules, 'AGENTS.md');
    const claude = computeEdits(facts, rules, 'CLAUDE.md');

    assert.equal(readme.action, 'create');
    assert.equal(agents.action, 'create');
    assert.equal(claude.action, 'create');
  });

  it('syncFast returns result on empty git repo', async () => {
    const { syncFast } = await import('../src/commands/sync.mjs');
    const tmpDir = createTmpDir();
    try {
      const { execSync } = await import('node:child_process');
      execSync('git init', { cwd: tmpDir, stdio: 'ignore' });

      // syncFast without commits returns upgrade notice without running repomix
      const result = await syncFast(tmpDir, ['README.md']);
      assert.ok(result, 'should return a result');
      assert.ok(result.mode === 'fast-upgraded-to-full', `expected upgrade, got ${result.mode}`);
      assert.ok(result.upgraded === true, 'should flag as upgraded');
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });
});
