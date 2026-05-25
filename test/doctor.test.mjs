import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const BIN_PATH = join(__dirname, '..', 'bin', 'docsync.mjs');

function runDoctor(argv = '') {
  try {
    const output = execSync(`node "${BIN_PATH}" doctor ${argv}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout: output, exitCode: 0 };
  } catch (err) {
    return { stdout: err.stdout || '', stderr: err.stderr || '', exitCode: err.status || 1 };
  }
}

describe('doctor command', () => {
  it('outputs environment diagnostic', () => {
    const { stdout, exitCode } = runDoctor();
    assert.ok(stdout.length > 0, 'should produce output');
    assert.equal(exitCode, 0, 'should exit 0 when required tools present');
  });

  it('output includes node status', () => {
    const { stdout } = runDoctor();
    assert.ok(
      stdout.includes('node') || stdout.includes('Environment'),
      'should mention node or environment'
    );
  });

  it('verbose flag works', () => {
    const { stdout, exitCode } = runDoctor('--verbose');
    assert.ok(stdout.length > 0, 'verbose should produce output');
    assert.equal(exitCode, 0, 'verbose should exit 0');
  });

  it('quiet flag works', () => {
    const { stdout, exitCode } = runDoctor('--quiet');
    // quiet may produce less output but should not crash
    assert.equal(exitCode, 0, 'quiet should exit 0');
  });
});
