import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function createTmpDir() {
  return mkdtempSync(join(tmpdir(), 'docsync-skill-'));
}

function cleanupTmpDir(dir) {
  rmSync(dir, { recursive: true, force: true });
}

function initGitRepo(dir) {
  execSync('git init', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.name "test"', { cwd: dir, stdio: 'ignore' });
  execSync('git commit --allow-empty -m "init"', { cwd: dir, stdio: 'ignore' });
}

describe('skill template structure', () => {
  it('Claude SKILL.md has required frontmatter fields', () => {
    const skillPath = join(ROOT, 'templates', 'skills', 'docsync', 'claude', 'SKILL.md');
    assert.ok(existsSync(skillPath), 'Claude SKILL.md should exist');
    const content = readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('name: docsync'), 'should have name field');
    assert.ok(content.includes('description:'), 'should have description field');
    assert.ok(content.includes('disable-model-invocation:'), 'should have disable-model-invocation field');
    assert.ok(content.includes('allowed-tools:'), 'should have allowed-tools field');
    assert.ok(content.includes('when_to_use:'), 'should have when_to_use field');
  });

  it('Codex SKILL.md has required frontmatter fields', () => {
    const skillPath = join(ROOT, 'templates', 'skills', 'docsync', 'codex', 'SKILL.md');
    assert.ok(existsSync(skillPath), 'Codex SKILL.md should exist');
    const content = readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('name: docsync'), 'should have name field');
    assert.ok(content.includes('description:'), 'should have description field');
  });

  it('Codex agents/openai.yaml exists with correct config', () => {
    const yamlPath = join(ROOT, 'templates', 'skills', 'docsync', 'codex', 'agents', 'openai.yaml');
    assert.ok(existsSync(yamlPath), 'openai.yaml should exist');
    const content = readFileSync(yamlPath, 'utf8');
    assert.ok(content.includes('allow_implicit_invocation'), 'should have allow_implicit_invocation');
  });

  it('Claude command wrappers exist', () => {
    const cmdDir = join(ROOT, 'templates', 'skills', 'docsync', 'claude', 'commands');
    for (const cmd of ['init.md', 'sync.md', 'rules.md']) {
      const cmdPath = join(cmdDir, cmd);
      assert.ok(existsSync(cmdPath), `${cmd} should exist`);
    }
  });

  it('Supporting files exist (references, scripts, assets)', () => {
    const base = join(ROOT, 'templates', 'skills', 'docsync');
    const expected = [
      'references/workflow.md',
      'references/doc-standards.md',
      'references/safety.md',
      'scripts/validate-workspace.mjs',
      'scripts/collect-context.mjs',
      'assets/README.template.md',
      'assets/AGENTS.template.md',
      'assets/CLAUDE.template.md',
      'assets/AGENTS.docsync.block.md',
    ];
    for (const file of expected) {
      const p = join(base, file);
      assert.ok(existsSync(p), `${file} should exist`);
    }
  });
});

describe('claude adapter install', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTmpDir();
    initGitRepo(tmpDir);
  });

  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('creates adapter source projection in .docsync/adapters/claude/', async () => {
    const { installClaudeAdapter } = await import('../src/core/adapters/claude.mjs');
    const result = await installClaudeAdapter(tmpDir);

    assert.ok(result.ok);
    // Check adapter source projection
    assert.ok(
      existsSync(join(tmpDir, '.docsync', 'adapters', 'claude', 'skills', 'docsync', 'SKILL.md')),
      'adapter source projection SKILL.md should exist'
    );
    assert.ok(
      existsSync(join(tmpDir, '.docsync', 'adapters', 'claude', 'references', 'workflow.md')),
      'adapter shared references should exist'
    );
  });

  it('projects skill to .claude/skills/docsync/', async () => {
    const { installClaudeAdapter } = await import('../src/core/adapters/claude.mjs');
    await installClaudeAdapter(tmpDir);

    assert.ok(
      existsSync(join(tmpDir, '.claude', 'skills', 'docsync', 'SKILL.md')),
      '.claude/skills/docsync/SKILL.md should exist'
    );
    assert.ok(
      existsSync(join(tmpDir, '.claude', 'skills', 'docsync', 'references', 'workflow.md')),
      '.claude skills should include shared references'
    );
  });

  it('installs command wrappers', async () => {
    const { installClaudeAdapter } = await import('../src/core/adapters/claude.mjs');
    await installClaudeAdapter(tmpDir);

    for (const cmd of ['init.md', 'sync.md', 'rules.md']) {
      const cmdPath = join(tmpDir, '.claude', 'commands', 'docsync', cmd);
      assert.ok(existsSync(cmdPath), `${cmd} wrapper should exist`);
    }
  });

  it('returns correct installed object', async () => {
    const { installClaudeAdapter } = await import('../src/core/adapters/claude.mjs');
    const result = await installClaudeAdapter(tmpDir);

    assert.equal(result.installed.skillPath, '.claude/skills/docsync/SKILL.md');
    assert.equal(result.installed.adapterSkillPath, '.docsync/adapters/claude/skills/docsync/SKILL.md');
    assert.ok(Array.isArray(result.installed.commands));
    assert.equal(result.installed.commands.length, 3);
  });
});

describe('codex adapter install', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTmpDir();
    initGitRepo(tmpDir);
  });

  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('creates adapter source projection in .docsync/adapters/codex/', async () => {
    const { installCodexAdapter } = await import('../src/core/adapters/codex.mjs');
    const result = await installCodexAdapter(tmpDir);

    assert.ok(result.ok);
    assert.ok(
      existsSync(join(tmpDir, '.docsync', 'adapters', 'codex', 'skills', 'docsync', 'SKILL.md')),
      'adapter source projection SKILL.md should exist'
    );
    assert.ok(
      existsSync(join(tmpDir, '.docsync', 'adapters', 'codex', 'AGENTS.docsync.md')),
      'AGENTS.docsync.md should exist in adapter dir'
    );
    assert.ok(
      existsSync(join(tmpDir, '.docsync', 'adapters', 'codex', 'references', 'workflow.md')),
      'adapter shared references should exist'
    );
  });

  it('projects skill to .agents/skills/docsync/', async () => {
    const { installCodexAdapter } = await import('../src/core/adapters/codex.mjs');
    await installCodexAdapter(tmpDir);

    assert.ok(
      existsSync(join(tmpDir, '.agents', 'skills', 'docsync', 'SKILL.md')),
      '.agents/skills/docsync/SKILL.md should exist'
    );
    assert.ok(
      existsSync(join(tmpDir, '.agents', 'skills', 'docsync', 'agents', 'openai.yaml')),
      '.agents skills should include openai.yaml'
    );
  });

  it('returns correct installed object', async () => {
    const { installCodexAdapter } = await import('../src/core/adapters/codex.mjs');
    const result = await installCodexAdapter(tmpDir);

    assert.equal(result.installed.skillPath, '.agents/skills/docsync/SKILL.md');
    assert.equal(result.installed.adapterSkillPath, '.docsync/adapters/codex/skills/docsync/SKILL.md');
    assert.equal(result.installed.agentsBlockPath, '.docsync/adapters/codex/AGENTS.docsync.md');
  });
});

describe('AGENTS.md marker block idempotency', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTmpDir();
    initGitRepo(tmpDir);
  });

  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('inserts marker block when AGENTS.md does not exist', async () => {
    const { installCodexAdapter } = await import('../src/core/adapters/codex.mjs');
    await installCodexAdapter(tmpDir);

    const agentsPath = join(tmpDir, 'AGENTS.md');
    assert.ok(existsSync(agentsPath), 'AGENTS.md should be created');
    const content = readFileSync(agentsPath, 'utf8');
    assert.ok(content.includes('<!-- docsync:start -->'), 'should have start marker');
    assert.ok(content.includes('<!-- docsync:end -->'), 'should have end marker');
  });

  it('does not duplicate marker block on second run', async () => {
    const { installCodexAdapter } = await import('../src/core/adapters/codex.mjs');
    await installCodexAdapter(tmpDir);

    const agentsPath = join(tmpDir, 'AGENTS.md');
    const content1 = readFileSync(agentsPath, 'utf8');
    const count1 = (content1.match(/<!-- docsync:start -->/g) || []).length;

    await installCodexAdapter(tmpDir);

    const content2 = readFileSync(agentsPath, 'utf8');
    const count2 = (content2.match(/<!-- docsync:start -->/g) || []).length;
    assert.equal(count2, count1, 'marker block should not be duplicated');
  });

  it('appends marker block when AGENTS.md has existing content', async () => {
    const agentsPath = join(tmpDir, 'AGENTS.md');
    writeFileSync(agentsPath, '# My Project\n\nSome existing content.\n', 'utf8');

    const { installCodexAdapter } = await import('../src/core/adapters/codex.mjs');
    await installCodexAdapter(tmpDir);

    const content = readFileSync(agentsPath, 'utf8');
    assert.ok(content.startsWith('# My Project'), 'existing content should be preserved');
    assert.ok(content.includes('<!-- docsync:start -->'), 'marker block should be appended');
  });
});

describe('dry-run zero-write guarantee', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTmpDir();
    initGitRepo(tmpDir);
  });

  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('runInit with dryRun:true creates nothing', async () => {
    const { runInit } = await import('../src/commands/init.mjs');

    await runInit({ cwd: tmpDir, aiTool: 'all', dryRun: true, quiet: true, skipEnvCheck: true });

    assert.ok(!existsSync(join(tmpDir, '.docsync')), '.docsync should NOT be created in dry-run');
    assert.ok(!existsSync(join(tmpDir, '.claude')), '.claude should NOT be created in dry-run');
    assert.ok(!existsSync(join(tmpDir, '.agents')), '.agents should NOT be created in dry-run');
  });

  it('runInit with dryRun:false creates workspace', async () => {
    const { runInit } = await import('../src/commands/init.mjs');

    await runInit({ cwd: tmpDir, aiTool: 'claude', dryRun: false, quiet: true, skipEnvCheck: true });

    assert.ok(existsSync(join(tmpDir, '.docsync', 'config')), '.docsync/config should be created');
    assert.ok(
      existsSync(join(tmpDir, '.docsync', 'adapters', 'claude', 'skills', 'docsync', 'SKILL.md')),
      'adapter source projection should be created'
    );
    assert.ok(existsSync(join(tmpDir, '.claude', 'skills', 'docsync', 'SKILL.md')), 'claude skill should be created');
  });
});

describe('copyTemplateTree contract', () => {
  let tmpDir;
  let srcDir;
  let destDir;

  beforeEach(() => {
    tmpDir = createTmpDir();
    srcDir = join(tmpDir, 'src');
    destDir = join(tmpDir, 'dest');
    mkdirSync(join(srcDir, 'sub'), { recursive: true });
    writeFileSync(join(srcDir, 'a.txt'), 'content-a', 'utf8');
    writeFileSync(join(srcDir, 'sub', 'b.txt'), 'content-b', 'utf8');
  });

  afterEach(() => {
    cleanupTmpDir(tmpDir);
  });

  it('returns { created, skipped, updated }', async () => {
    const { copyTemplateTree } = await import('../src/utils/fs.mjs');
    const result = await copyTemplateTree(srcDir, destDir);

    assert.ok('created' in result);
    assert.ok('skipped' in result);
    assert.ok('updated' in result);
    assert.equal(result.created.length, 2);
    assert.equal(result.skipped.length, 0);
    assert.equal(result.updated.length, 0);
  });

  it('skips existing files without force', async () => {
    const { copyTemplateTree } = await import('../src/utils/fs.mjs');
    await copyTemplateTree(srcDir, destDir);
    const result = await copyTemplateTree(srcDir, destDir);

    assert.equal(result.created.length, 0);
    assert.equal(result.skipped.length, 2);
  });

  it('updates existing files with force', async () => {
    const { copyTemplateTree } = await import('../src/utils/fs.mjs');
    await copyTemplateTree(srcDir, destDir);
    const result = await copyTemplateTree(srcDir, destDir, { force: true });

    assert.equal(result.created.length, 0);
    assert.equal(result.updated.length, 2);
  });

  it('does not create dirs or files in dry-run mode', async () => {
    const { copyTemplateTree } = await import('../src/utils/fs.mjs');
    const result = await copyTemplateTree(srcDir, destDir, { dryRun: true });

    assert.ok(!existsSync(destDir), 'dest directory should NOT be created');
    assert.equal(result.created.length, 2, 'should still report planned creates');
  });
});
