import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  exists,
  readText,
  ensureDir,
  writeText,
  backupFile,
  makeBackupPath,
  writeIfMissing,
} from '../src/utils/fs.mjs';

function createTmpDir() {
  return mkdtempSync(join(tmpdir(), 'fs-test-'));
}

function cleanupTmpDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}

describe('fs utils', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTmpDir();
  });

  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  describe('writeIfMissing', () => {
    it('creates file when missing', async () => {
      const filePath = join(tmpDir, 'new.txt');
      const result = await writeIfMissing(filePath, 'hello');
      assert.equal(result.action, 'created');
      assert.equal(result.path, filePath);
      assert.ok(existsSync(filePath));
      assert.equal(readFileSync(filePath, 'utf8'), 'hello');
    });

    it('skips when file exists without force', async () => {
      const filePath = join(tmpDir, 'existing.txt');
      writeFileSync(filePath, 'original', 'utf8');
      const result = await writeIfMissing(filePath, 'new content');
      assert.equal(result.action, 'skipped');
      assert.equal(readFileSync(filePath, 'utf8'), 'original');
    });

    it('overwrites when force=true', async () => {
      const filePath = join(tmpDir, 'force.txt');
      writeFileSync(filePath, 'original', 'utf8');
      const result = await writeIfMissing(filePath, 'new content', { force: true });
      assert.equal(result.action, 'overwritten');
      assert.equal(readFileSync(filePath, 'utf8'), 'new content');
    });

    it('creates backup before overwrite when backup=true', async () => {
      const filePath = join(tmpDir, 'backup.txt');
      writeFileSync(filePath, 'original', 'utf8');
      const result = await writeIfMissing(filePath, 'new content', { force: true, backup: true });
      assert.equal(result.action, 'overwritten');
      assert.ok(result.backupPath, 'should have backup path');
      assert.ok(existsSync(result.backupPath), 'backup file should exist');
      assert.equal(readFileSync(result.backupPath, 'utf8'), 'original');
      assert.equal(readFileSync(filePath, 'utf8'), 'new content');
    });

    it('does not write in dry-run mode', async () => {
      const filePath = join(tmpDir, 'dryrun.txt');
      const result = await writeIfMissing(filePath, 'content', { dryRun: true });
      assert.equal(result.action, 'create-planned');
      assert.ok(!existsSync(filePath), 'file should not be created');
    });

    it('does not write in dry-run mode when file exists', async () => {
      const filePath = join(tmpDir, 'existing.txt');
      writeFileSync(filePath, 'original', 'utf8');
      const result = await writeIfMissing(filePath, 'new', { force: true, dryRun: true });
      assert.equal(result.action, 'overwrite-planned');
      assert.equal(readFileSync(filePath, 'utf8'), 'original');
    });
  });

  describe('exists', () => {
    it('returns true for existing file', () => {
      const filePath = join(tmpDir, 'exists.txt');
      writeFileSync(filePath, 'content', 'utf8');
      assert.equal(exists(filePath), true);
    });

    it('returns false for non-existing file', () => {
      assert.equal(exists(join(tmpDir, 'nope.txt')), false);
    });
  });

  describe('ensureDir', () => {
    it('creates nested directories', async () => {
      const dirPath = join(tmpDir, 'a', 'b', 'c');
      await ensureDir(dirPath);
      assert.ok(existsSync(dirPath));
    });
  });
});

// Need fs for writing test fixtures
import { writeFileSync } from 'node:fs';
