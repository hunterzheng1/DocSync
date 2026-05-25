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

  it('AGENTS.docsync.md contains meaningful content', () => {
    const content = readFileSync(CODEX_TEMPLATE, 'utf8');
    assert.ok(content.length > 50, 'should have meaningful content');
  });
});
