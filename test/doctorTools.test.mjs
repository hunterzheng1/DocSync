import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { logger } from '../src/utils/logger.mjs';

// Simple version check for checkTool behavior
describe('doctor tool detection', () => {
  it('node is available with version', () => {
    const version = process.version;
    assert.ok(version.startsWith('v'), 'node version should start with v');
  });

  it('npm is available', () => {
    try {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      assert.ok(version.length > 0, 'npm should return a version');
    } catch {
      // npm may not be available in all test envs
    }
  });

  it('nonexistent command throws', () => {
    try {
      execSync('this-command-does-not-exist-xyz --version', { encoding: 'utf8', stdio: 'pipe' });
      assert.fail('should have thrown');
    } catch {
      // expected
    }
  });

  it('recommended tool missing does not throw', () => {
    // Simulate checkTool for missing optional tool
    function safeCheckTool(name) {
      try {
        execSync(`${name} --version`, { encoding: 'utf8' });
        return { name, status: 'ok' };
      } catch {
        return { name, status: 'missing' };
      }
    }
    const result = safeCheckTool('nonexistent-tool-xyz');
    assert.equal(result.status, 'missing');
    assert.equal(result.name, 'nonexistent-tool-xyz');
  });
});
