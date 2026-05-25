import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runSkillInstall, runSkillPath } from '../src/commands/skill.mjs';

function createTmpDir() {
  return mkdtempSync(join(tmpdir(), 'skill-test-'));
}

function cleanupTmpDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}

describe('skill install', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTmpDir();
  });

  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('installs to project target', async () => {
    const target = join(tmpDir, '.claude', 'skills', 'doc-sync', 'SKILL.md');
    await runSkillInstall({ project: true, cwd: tmpDir });
    assert.ok(existsSync(target), 'should install to project target');
  });

  it('skips when already installed without force', async () => {
    const target = join(tmpDir, '.claude', 'skills', 'doc-sync', 'SKILL.md');
    mkdirSync(join(tmpDir, '.claude', 'skills', 'doc-sync'), { recursive: true });
    writeFileSync(target, 'user content', 'utf8');

    let stdout = '';
    const orig = process.stdout.write;
    process.stdout.write = (chunk) => { stdout += chunk; return true; };
    await runSkillInstall({ project: true, cwd: tmpDir });
    process.stdout.write = orig;

    assert.ok(stdout.includes('already-installed'), 'should skip');
    assert.equal(readFileSync(target, 'utf8'), 'user content', 'should not overwrite');
  });

  it('force overwrites existing file', async () => {
    const target = join(tmpDir, '.claude', 'skills', 'doc-sync', 'SKILL.md');
    mkdirSync(join(tmpDir, '.claude', 'skills', 'doc-sync'), { recursive: true });
    writeFileSync(target, 'user content', 'utf8');

    await runSkillInstall({ project: true, cwd: tmpDir, force: true });
    assert.ok(!readFileSync(target, 'utf8').includes('user content'), 'should overwrite');
  });

  it('backup before force', async () => {
    const target = join(tmpDir, '.claude', 'skills', 'doc-sync', 'SKILL.md');
    mkdirSync(join(tmpDir, '.claude', 'skills', 'doc-sync'), { recursive: true });
    writeFileSync(target, 'user content', 'utf8');

    let stdout = '';
    const orig = process.stdout.write;
    process.stdout.write = (chunk) => { stdout += chunk; return true; };
    await runSkillInstall({ project: true, cwd: tmpDir, force: true, backup: true });
    process.stdout.write = orig;

    assert.ok(stdout.includes('backup'), 'should mention backup');
  });
});

describe('skill path', () => {
  it('returns global skill path', async () => {
    let stdout = '';
    const orig = process.stdout.write;
    process.stdout.write = (chunk) => { stdout += chunk; return true; };
    await runSkillPath({});
    process.stdout.write = orig;

    assert.ok(stdout.includes('.claude'), 'should return claude path');
  });
});
