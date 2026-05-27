import { join } from 'node:path';
import { existsSync, writeFileSync } from 'node:fs';
import { getCwd } from '../utils/paths.mjs';
import { checkAll, printCheckResults } from '../core/environment.mjs';
import { createWorkspace, validateWorkspace } from '../core/workspace.mjs';
import { installClaudeAdapter } from '../core/adapters/claude.mjs';
import { installCodexAdapter } from '../core/adapters/codex.mjs';
import { prompt } from '../utils/prompt.mjs';

const DOC_VERSION = '1.0.0';
const DEFAULT_FILE_COUNT = 7;

/**
 * Non-interactive initialization.
 * Called from prep.mjs and other programmatic use cases.
 */
export async function runInit(options = {}) {
  const cwd = getCwd(options);
  const { aiTool = 'claude', quiet = false, dryRun = false, force = false } = options;

  if (!quiet) {
    process.stdout.write('\nDocSync init\n');
  }

  // Check environment
  const envResult = await checkAll(cwd);
  if (!envResult.allOk && !options.skipEnvCheck) {
    process.stderr.write('\nError: Required environment check failed. Aborting.\n');
    process.exitCode = 1;
    return { created: [], skipped: [], overwritten: [] };
  }

  // Dry-run: skip all writes, report planned actions only
  if (dryRun) {
    if (!quiet) {
      process.stdout.write('\n[dry-run] Planned actions:\n');
      process.stdout.write(`  AI Tool: ${aiTool}\n`);
      process.stdout.write(`  Would create workspace files (from ${DEFAULT_FILE_COUNT} defaults)\n`);
      if (aiTool === 'claude' || aiTool === 'all') {
        process.stdout.write('  Would install Claude adapter (.claude/skills/docsync/, .docsync/adapters/claude/)\n');
      }
      if (aiTool === 'codex' || aiTool === 'all') {
        process.stdout.write('  Would install Codex adapter (.agents/skills/docsync/, .docsync/adapters/codex/)\n');
      }
      process.stdout.write('  Would write .docsync/state/install.json\n');
    }
    return { created: [], skipped: [], overwritten: [] };
  }

  // Create workspace (directories + config files)
  const workspaceFiles = await createWorkspace(cwd);

  // Install adapters
  const installedFiles = [];
  const installed = {};
  if (aiTool === 'claude' || aiTool === 'all') {
    const result = await installClaudeAdapter(cwd);
    if (result.ok) {
      installedFiles.push(...result.files);
      installed.claude = result.installed;
    }
  }
  if (aiTool === 'codex' || aiTool === 'all') {
    const result = await installCodexAdapter(cwd);
    if (result.ok) {
      installedFiles.push(...result.files);
      installed.codex = result.installed;
    }
  }

  // Write install.json
  const pkg = await import('../../package.json', { with: { type: 'json' } });
  const installJson = {
    version: 1,
    installedAt: new Date().toISOString(),
    docsyncVersion: pkg.default.version,
    aiTool,
    templateVersion: DOC_VERSION,
    installed,
    filesCreated: [...workspaceFiles, ...installedFiles],
  };

  const stateDir = join(cwd, '.docsync', 'state');
  const installPath = join(stateDir, 'install.json');
  writeFileSync(installPath, JSON.stringify(installJson, null, 2), 'utf8');

  if (!quiet) {
    process.stdout.write('\nDocSync init complete.\n');
    process.stdout.write(`AI Tool: ${aiTool}\n`);
    process.stdout.write(`Workspace: .docsync/\n`);
    process.stdout.write(`Created: ${workspaceFiles.length + installedFiles.length} files\n`);
  }
}

/**
 * Interactive npx bootstrap flow.
 * Called from bin/docsync.mjs when no arguments provided.
 */
export async function runBootstrap(options = {}) {
  const cwd = getCwd(options);

  process.stdout.write('\n=== DocSync Bootstrap ===\n\n');
  process.stdout.write(`Phase 1: Target directory: ${cwd}\n`);

  // Check dangerous directory
  const dangerousDirs = ['/', '/home', '/root'];
  const normalized = cwd.replace(/\\/g, '/').toLowerCase();
  if (dangerousDirs.some(d => normalized === d || normalized.startsWith(d + '/'))) {
    process.stderr.write(`Error: ${cwd} is a dangerous directory. Please choose a project directory.\n`);
    process.exitCode = 1;
    return;
  }

  // Check git repo
  try {
    const { execSync } = await import('node:child_process');
    execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'ignore' });
    process.stdout.write('  Git repository: yes\n');
  } catch {
    process.stdout.write('  Git repository: no\n');
    const answer = await prompt('This directory is not a git repository. Continue? (y/N): ');
    if (answer.toLowerCase() !== 'y') {
      process.stdout.write('Aborted.\n');
      return;
    }
  }

  // Phase 2: Environment check
  process.stdout.write('\nPhase 2: Environment check\n');
  const envResult = await checkAll(cwd);
  printCheckResults(envResult);

  if (!envResult.allOk) {
    process.stderr.write('\nError: Required environment check failed. Aborting.\n');
    process.exitCode = 1;
    return;
  }

  // Phase 3: AI tool selection
  process.stdout.write('\nPhase 3: AI Tool Selection\n');
  const aiChoice = await prompt(
    'Which AI tool do you want to prepare DocSync for?\n' +
    '  1. Claude Code\n' +
    '  2. Codex\n' +
    '  3. All\n' +
    'Choice (1/2/3): '
  );

  let aiTool;
  switch (aiChoice.trim()) {
    case '1': aiTool = 'claude'; break;
    case '2': aiTool = 'codex'; break;
    case '3': aiTool = 'all'; break;
    default:
      process.stderr.write('Error: Invalid choice. Aborting.\n');
      process.exitCode = 1;
      return;
  }

  // Phase 4-6: Delegate to runInit with the chosen aiTool
  await runInit({ ...options, aiTool });

  // Summary
  process.stdout.write('\n=== Bootstrap Complete ===\n');

  // Check for missing AI clients
  try {
    const { execSync } = await import('node:child_process');
    if (aiTool === 'claude' || aiTool === 'all') {
      execSync('claude --version', { stdio: 'ignore' });
    }
  } catch {
    process.stdout.write('\nNote: Claude Code CLI is not installed. Skill file was still created.\n');
  }

  try {
    const { execSync } = await import('node:child_process');
    if (aiTool === 'codex' || aiTool === 'all') {
      execSync('codex --version', { stdio: 'ignore' });
    }
  } catch {
    process.stdout.write('Note: Codex CLI is not installed. AGENTS.md was still updated.\n');
  }
}
