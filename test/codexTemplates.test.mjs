import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CODEX_TEMPLATE = join(__dirname, '..', 'templates', 'codex', 'AGENTS.docsync.md');

describe('codex template', () => {
  it('AGENTS.docsync.md exists', () => {
    assert.ok(existsSync(CODEX_TEMPLATE), 'codex template should exist');
  });

  it('AGENTS.docsync.md contains workflow sections', () => {
    const content = readFileSync(CODEX_TEMPLATE, 'utf8');
    assert.ok(content.includes('DOCSYNC_START'), 'should have DOCSYNC_START marker');
    assert.ok(content.includes('DOCSYNC_END'), 'should have DOCSYNC_END marker');
    assert.ok(content.includes('工作流') || content.includes('workflow'), 'should have workflow section');
    assert.ok(content.includes('安全约束') || content.includes('Security'), 'should have security section');
  });

  it('AGENTS.docsync.md has substantial content', () => {
    const content = readFileSync(CODEX_TEMPLATE, 'utf8');
    assert.ok(content.length > 500, 'should have substantial content (>500 chars)');
  });
});
