import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const BIN_PATH = join(__dirname, '..', 'bin', 'docsync.mjs');

describe('codex command', () => {
  it('codex path returns a path', () => {
    const output = execSync(`node "${BIN_PATH}" codex path`, { encoding: 'utf8' });
    assert.ok(output.length > 0, 'should return a path');
    assert.ok(output.includes('.codex'), 'should include .codex in path');
  });

  it('unknown subcommand returns error', () => {
    try {
      execSync(`node "${BIN_PATH}" codex nope`, { encoding: 'utf8', stdio: 'pipe' });
      assert.fail('should have failed');
    } catch (err) {
      assert.ok(err.status === 2, 'should exit with code 2');
    }
  });
});
