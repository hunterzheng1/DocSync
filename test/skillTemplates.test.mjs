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

  it('SKILL.md has YAML frontmatter', () => {
    const content = readFileSync(SKILL_TEMPLATE, 'utf8');
    assert.ok(content.startsWith('---'), 'should start with YAML frontmatter');
    assert.ok(content.includes('name:'), 'should have name field');
    assert.ok(content.includes('description:'), 'should have description field');
    assert.ok(content.includes('allowed-tools:'), 'should have allowed-tools field');
  });

  it('SKILL.md contains slash commands', () => {
    const content = readFileSync(SKILL_TEMPLATE, 'utf8');
    assert.ok(content.includes('/docsync:sync'), 'should have sync slash command');
    assert.ok(content.includes('/docsync:doctor'), 'should have doctor slash command');
    assert.ok(content.includes('/docsync:init'), 'should have init slash command');
    assert.ok(content.includes('/docsync:prep'), 'should have prep slash command');
    assert.ok(content.includes('/docsync:skill-install'), 'should have skill-install slash command');
    assert.ok(content.includes('/docsync:codex-install'), 'should have codex-install slash command');
  });

  it('SKILL.md contains phased workflows', () => {
    const content = readFileSync(SKILL_TEMPLATE, 'utf8');
    assert.ok(content.includes('Phase 1') || content.includes('Phase'), 'should have phased workflow');
    assert.ok(content.includes('repomix-output.xml'), 'should reference context file');
  });

  it('SKILL.md has sufficient content', () => {
    const content = readFileSync(SKILL_TEMPLATE, 'utf8');
    assert.ok(content.length > 500, 'SKILL.md should have substantial content (>500 chars)');
    assert.ok(content.includes('硬性规则') || content.includes('硬规则'), 'should have hard rules section');
  });

  it('SKILL.md does not contain sensitive info', () => {
    const content = readFileSync(SKILL_TEMPLATE, 'utf8');
    // Should not contain actual secrets or credentials
    assert.ok(!content.includes('-----BEGIN'), 'should not contain PEM key');
    assert.ok(!content.includes('sk-'), 'should not contain API key');
    assert.ok(!/ghp_[a-zA-Z0-9]{36}/.test(content), 'should not contain GitHub token');
  });
});
