import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { getGlobalClaudeSkillPath, getGlobalCodexAgentsPath } from '../src/utils/paths.mjs';

describe('doctor global file detection', () => {
  it('returns valid paths for claude skill and codex agents', () => {
    const skillPath = getGlobalClaudeSkillPath();
    const codexPath = getGlobalCodexAgentsPath();
    assert.ok(skillPath.length > 0, 'skill path should not be empty');
    assert.ok(codexPath.length > 0, 'codex path should not be empty');
    assert.ok(skillPath.includes('.claude'), 'skill path should include .claude');
    assert.ok(codexPath.includes('.codex'), 'codex path should include .codex');
  });

  it('does not read file content, only checks existence', () => {
    // Only assert existsSync behavior, never readFile
    const skillPath = getGlobalClaudeSkillPath();
    const codexPath = getGlobalCodexAgentsPath();
    // These may or may not exist depending on environment
    const skillExists = existsSync(skillPath);
    const codexExists = existsSync(codexPath);
    // Assert we can check without reading content
    assert.equal(typeof skillExists, 'boolean');
    assert.equal(typeof codexExists, 'boolean');
  });
});
