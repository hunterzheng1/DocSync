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

  it('SKILL.md CLI invocations use npx pattern', () => {
    const content = readFileSync(SKILL_TEMPLATE, 'utf8');
    // When invoking CLI, must use npx @hunterzheng/docsync pattern (not bare "docsync")
    // Check for "docsync doctor/prep/init" that is NOT part of "npx" or a slash command heading
    const lines = content.split('\n').filter(line => {
      // Skip headings like ## /docsync:init
      if (line.startsWith('#')) return false;
      // Skip slash command references like /docsync:sync
      if (line.includes('/docsync:')) return false;
      // Skip npx invocations — these are the correct pattern
      if (line.includes('npx @hunterzheng/docsync')) return false;
      // Check for bare docsync CLI invocations
      return /\bdocsync\s+(doctor|prep|init|skill|codex)\b/i.test(line);
    });
    assert.equal(lines.length, 0, `should not invoke bare "docsync" command; use npx @hunterzheng/docsync instead. Found: ${lines.join('; ')}`);
  });

  it('SKILL.md embeds template contents', () => {
    const content = readFileSync(SKILL_TEMPLATE, 'utf8');
    // Should embed key template content so AI can create files directly
    assert.ok(content.includes('repomix-output.xml'), 'should reference context file');
    assert.ok(content.includes('repomix.config.json') || content.includes('output'), 'should embed repomix config');
    assert.ok(content.includes('.repomixignore') || content.includes('repomix-ignore'), 'should embed repomixignore');
    assert.ok(content.includes('markdownlint-cli2'), 'should embed markdownlint config');
    assert.ok(content.includes('doc-sync-rules'), 'should embed doc-sync-rules');
  });

  it('SKILL.md does not contain sensitive info', () => {
    const content = readFileSync(SKILL_TEMPLATE, 'utf8');
    // Should not contain actual secrets or credentials
    assert.ok(!content.includes('-----BEGIN'), 'should not contain PEM key');
    assert.ok(!content.includes('sk-'), 'should not contain API key');
    assert.ok(!/ghp_[a-zA-Z0-9]{36}/.test(content), 'should not contain GitHub token');
  });
});
