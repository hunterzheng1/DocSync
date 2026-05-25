import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const binPath = join(__dirname, '..', 'bin', 'docsync.mjs');

function runDocsync(...args) {
  try {
    const output = execSync(`node "${binPath}" ${args.join(' ')}`, { encoding: 'utf8' });
    return { stdout: output, exitCode: 0 };
  } catch (err) {
    return {
      stdout: err.stdout || '',
      stderr: err.stderr || '',
      exitCode: err.status || 1,
    };
  }
}

describe('docsync bin entry', () => {
  it('help command exits with code 0', () => {
    const { stdout, exitCode } = runDocsync('help');
    assert.strictEqual(exitCode, 0);
    assert.ok(stdout.includes('docsync'));
  });

  it('version command exits with code 0', () => {
    const { stdout, exitCode } = runDocsync('version');
    assert.strictEqual(exitCode, 0);
    assert.ok(stdout.trim().length > 0);
  });

  it('--version alias exits with code 0', () => {
    const { stdout, exitCode } = runDocsync('--version');
    assert.strictEqual(exitCode, 0);
    assert.ok(stdout.trim().length > 0);
  });

  it('-v alias exits with code 0', () => {
    const { stdout, exitCode } = runDocsync('-v');
    assert.strictEqual(exitCode, 0);
    assert.ok(stdout.trim().length > 0);
  });
});
