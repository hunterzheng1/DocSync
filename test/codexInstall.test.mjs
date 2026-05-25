import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const DOCSYNC_START = '<!-- docsync:start -->';
const DOCSYNC_END = '<!-- docsync:end -->';

// Inline the marker algorithm for testing since it's the core logic
function insertMarkerBlock(content, newBlock) {
  const startIdx = content.indexOf(DOCSYNC_START);
  const endIdx = content.indexOf(DOCSYNC_END);

  if (startIdx === -1 && endIdx === -1) {
    return content + '\n\n' + DOCSYNC_START + '\n' + newBlock + '\n' + DOCSYNC_END + '\n';
  }

  if (startIdx !== -1 && endIdx !== -1) {
    const startCount = content.split(DOCSYNC_START).length - 1;
    const endCount = content.split(DOCSYNC_END).length - 1;
    if (startCount > 1 || endCount > 1) {
      throw new Error('Multiple DocSync marker blocks found. Please clean up the file manually.');
    }
    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx + DOCSYNC_END.length + 1);
    return before + DOCSYNC_START + '\n' + newBlock + '\n' + DOCSYNC_END + after;
  }

  throw new Error('Incomplete DocSync marker block found. Please fix manually.');
}

describe('codex marker algorithm', () => {
  it('appends marker to empty file', () => {
    const result = insertMarkerBlock('', 'test content');
    assert.ok(result.includes(DOCSYNC_START), 'should have start marker');
    assert.ok(result.includes(DOCSYNC_END), 'should have end marker');
    assert.ok(result.includes('test content'), 'should have content');
  });

  it('replaces existing marker block', () => {
    const existing = 'header\n<!-- docsync:start -->\nold content\n<!-- docsync:end -->\nfooter';
    const result = insertMarkerBlock(existing, 'new content');
    assert.ok(result.startsWith('header\n'), 'should preserve header');
    assert.ok(result.endsWith('footer'), 'should preserve footer');
    assert.ok(result.includes('new content'), 'should have new content');
    assert.ok(!result.includes('old content'), 'should remove old content');
  });

  it('throws on multiple markers', () => {
    const existing = '<!-- docsync:start -->\nfirst\n<!-- docsync:end -->\n<!-- docsync:start -->\nsecond\n<!-- docsync:end -->';
    assert.throws(() => insertMarkerBlock(existing, 'new'), /Multiple/);
  });
});

describe('codex template', () => {
  it('template can be used as marker block content', () => {
    const template = 'test template content';
    const result = insertMarkerBlock('', template);
    assert.ok(result.includes(DOCSYNC_START));
    assert.ok(result.includes(template));
    assert.ok(result.includes(DOCSYNC_END));
  });
});
