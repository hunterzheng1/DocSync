import { runInit } from './init.mjs';
import { isGitRepo, getStatusShort } from '../utils/git.mjs';
import { hasCommand, run } from '../utils/shell.mjs';
import { logger } from '../utils/logger.mjs';
import { getCwd } from '../utils/paths.mjs';

export async function runPrep(options = {}) {
  const cwd = getCwd(options);
  const result = {
    init: 'pending',
    gitStatus: 'pending',
    repomix: 'pending',
    markdownlint: 'pending',
  };

  // Step 1: Init (unless --no-init)
  if (!options.noInit) {
    try {
      await runInit({ ...options, quiet: true });
      result.init = 'completed';
      logger.step('init: completed');
    } catch (err) {
      logger.error(`init failed: ${err.message}`);
      result.init = 'failed';
    }
  } else {
    result.init = 'disabled';
  }

  // Step 2: Git status
  if (isGitRepo(cwd)) {
    const status = getStatusShort(cwd);
    if (status) {
      process.stdout.write(status + '\n');
    }
    result.gitStatus = 'printed';
  } else {
    result.gitStatus = 'skipped';
    logger.info('Not a git repository, skipping git status');
  }

  // Step 3: Repomix (required)
  if (hasCommand('repomix')) {
    try {
      const args = ['-o', 'repomix-output.xml'];
      if (options.compress) args.push('--compress');
      await run('repomix', args, { cwd });
      result.repomix = 'completed';
      logger.step('repomix: completed');
    } catch (err) {
      logger.error(`repomix failed: ${err.message}`);
      result.repomix = 'failed';
      throw new Error(`repomix failed: ${err.message}`);
    }
  } else {
    result.repomix = 'missing';
    logger.error('repomix is required. Install with: npm i -g repomix');
    throw new Error('repomix is required. Install with: npm i -g repomix');
  }

  // Step 4: markdownlint (optional)
  if (!options.noLint) {
    if (hasCommand('markdownlint-cli2')) {
      try {
        await run('markdownlint-cli2', ['--fix'], { cwd });
        result.markdownlint = 'completed';
        logger.step('markdownlint: completed');
      } catch {
        result.markdownlint = 'failed';
      }
    } else {
      result.markdownlint = 'missing';
      logger.info('markdownlint-cli2 not found (optional). Install with: npm i -g markdownlint-cli2');
    }
  } else {
    result.markdownlint = 'skipped';
  }

  return result;
}
