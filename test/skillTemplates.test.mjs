import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const SKILL_TEMPLATE = join(__dirname, '..', 'templates', 'claude-skill', 'SKILL.md');

describe('claude skill template', () => {
  it('SKILL.md template exists', () => {
    assert.ok(existsSync(SKILL_TEMPLATE), 'SKILL.md template should exist');
  });

  it('SKILL.md does not contain sensitive info', () => {
    const content = readFileSync(SKILL_TEMPLATE, 'utf8');
    // Should not contain actual secrets or credentials
    assert.ok(!content.includes('-----BEGIN'), 'should not contain PEM key');
    assert.ok(!content.includes('sk-'), 'should not contain API key');
    assert.ok(!/ghp_[a-zA-Z0-9]{36}/.test(content), 'should not contain GitHub token');
  });
});
