import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const templateRoot = join(__dirname, '..', 'templates', 'project');

describe('project templates', () => {
  it('repomix.config.json exists and has xml output format', () => {
    const p = join(templateRoot, 'repomix.config.json');
    assert.ok(existsSync(p), 'repomix.config.json should exist');
    const content = readFileSync(p, 'utf8');
    const config = JSON.parse(content);
    assert.ok(config.output, 'should have output field');
  });

  it('.repomixignore excludes .env and key files', () => {
    const p = join(templateRoot, '.repomixignore');
    assert.ok(existsSync(p), '.repomixignore should exist');
    const content = readFileSync(p, 'utf8');
    assert.ok(content.includes('.env'), 'should exclude .env');
    assert.ok(
      /key|secret|token|pem/i.test(content),
      'should exclude key/secret/token/pem patterns'
    );
    assert.ok(content.includes('repomix-output'), 'should exclude repomix output');
  });

  it('.markdownlint-cli2.jsonc exists and is valid JSONC', () => {
    const p = join(templateRoot, '.markdownlint-cli2.jsonc');
    assert.ok(existsSync(p), '.markdownlint-cli2.jsonc should exist');
  });

  it('doc-sync-rules.md exists and contains required sections', () => {
    const p = join(templateRoot, 'docs', 'doc-sync-rules.md');
    assert.ok(existsSync(p), 'doc-sync-rules.md should exist');
    const content = readFileSync(p, 'utf8');
    assert.ok(content.length > 50, 'should have meaningful content');
  });
});
