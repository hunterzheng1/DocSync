import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { main } from '../src/cli.mjs';

async function captureOutput(fn, ...args) {
  let stdout = '';
  let stderr = '';
  const origStdout = process.stdout.write;
  const origStderr = process.stderr.write;
  const origExitCode = process.exitCode;
  process.stdout.write = (chunk) => { stdout += String(chunk); return true; };
  process.stderr.write = (chunk) => { stderr += String(chunk); return true; };
  process.exitCode = 0;
  try {
    await fn(...args);
  } finally {
    process.stdout.write = origStdout;
    process.stderr.write = origStderr;
    process.exitCode = origExitCode;
  }
  return { stdout, stderr, exitCode: process.exitCode };
}

describe('cli router', () => {
  it('defaults to help with empty argv', async () => {
    const { stdout } = await captureOutput(() => main([]));
    assert.ok(stdout.includes('docsync'), 'should output help');
  });

  it('routes to version command', async () => {
    const { stdout } = await captureOutput(() => main(['version']));
    assert.ok(stdout.trim().length > 0, 'should output version');
  });

  it('rejects unknown command', async () => {
    const { stderr } = await captureOutput(() => main(['unknown']));
    assert.ok(stderr.length > 0, 'should output error to stderr');
  });
});
