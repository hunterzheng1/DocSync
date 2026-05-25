import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runInit } from '../src/commands/init.mjs';

function createTmpDir() {
  return mkdtempSync(join(tmpdir(), 'init-test-'));
}

function cleanupTmpDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}

describe('init command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTmpDir();
  });

  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('creates 4 template files in empty directory', async () => {
    const result = await runInit({ cwd: tmpDir });
    assert.equal(result.created.length, 4, 'should create 4 files');
    assert.equal(result.skipped.length, 0);
    assert.equal(result.overwritten.length, 0);

    // Verify files exist
    assert.ok(existsSync(join(tmpDir, 'repomix.config.json')));
    assert.ok(existsSync(join(tmpDir, '.repomixignore')));
    assert.ok(existsSync(join(tmpDir, '.markdownlint-cli2.jsonc')));
    assert.ok(existsSync(join(tmpDir, 'docs', 'doc-sync-rules.md')));
  });

  it('skips existing files without force', async () => {
    // First run to create files
    await runInit({ cwd: tmpDir });

    // Second run should skip
    const result = await runInit({ cwd: tmpDir });
    assert.equal(result.created.length, 0);
    assert.equal(result.skipped.length, 4, 'should skip all 4 files');
  });

  it('overwrites with force flag', async () => {
    await runInit({ cwd: tmpDir });
    const result = await runInit({ cwd: tmpDir, force: true });
    assert.equal(result.overwritten.length, 4, 'should overwrite all 4 files');
  });

  it('dry-run does not write files', async () => {
    const result = await runInit({ cwd: tmpDir, dryRun: true });
    assert.ok(result.created.some(f => f.includes('dry-run')), 'should show planned actions');
    assert.equal(existsSync(join(tmpDir, 'repomix.config.json')), false, 'should not create files');
  });

  it('partial missing creates only missing files', async () => {
    // Create one file manually
    const { writeFileSync, mkdirSync } = await import('node:fs');
    mkdirSync(join(tmpDir, 'docs'), { recursive: true });
    writeFileSync(join(tmpDir, '.repomixignore'), 'user content', 'utf8');

    const result = await runInit({ cwd: tmpDir });
    assert.equal(result.skipped.length, 1, 'should skip existing');
    assert.equal(result.created.length, 3, 'should create missing');
  });
});
