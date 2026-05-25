import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('prompt utils', () => {
  it('prompt module exists', async () => {
    const mod = await import('../src/utils/prompt.mjs');
    assert.equal(typeof mod.buildPrompt, 'function', 'buildPrompt should be a function');
  });

  it('prompt module can build a basic prompt', async () => {
    const { buildPrompt } = await import('../src/utils/prompt.mjs');
    const result = buildPrompt({ docs: ['readme'], rules: [] });
    assert.equal(typeof result, 'string');
    assert.ok(result.length > 0);
  });
});

describe('ai command', () => {
  it('ai command can be imported', async () => {
    const mod = await import('../src/commands/ai.mjs');
    assert.equal(typeof mod.runAi, 'function');
  });
});

describe('auto command', () => {
  it('auto command can be imported', async () => {
    const mod = await import('../src/commands/auto.mjs');
    assert.equal(typeof mod.runAuto, 'function');
  });
});
