import { runPrep } from './prep.mjs';
import { buildPrompt } from '../utils/prompt.mjs';
import { hasCommand, run } from '../utils/shell.mjs';
import { CliError } from '../utils/args.mjs';

export async function runAi(options = {}) {
  const { docs, extra, compress, noLint, noInit } = options;

  // Step 1: Run prep
  process.stdout.write('Running prep...\n');
  try {
    await runPrep({ compress, noLint, noInit, cwd: options.cwd });
  } catch (err) {
    throw new CliError(`prep failed: ${err.message}`, 1);
  }

  // Step 2: Build prompt
  const prompt = buildPrompt({ docs: docs ? docs.split(',') : [], extra });

  // Step 3: Launch Claude or fallback
  if (hasCommand('claude')) {
    process.stdout.write('Launching Claude Code...\n');
    try {
      await run('claude', ['-p', prompt], { cwd: options.cwd || process.cwd() });
    } catch (err) {
      throw new CliError(`claude failed: ${err.message}`, 1);
    }
  } else {
    process.stdout.write('\nClaude Code not found. Copy the prompt below:\n\n');
    process.stdout.write('─'.repeat(60) + '\n');
    process.stdout.write(prompt + '\n');
    process.stdout.write('─'.repeat(60) + '\n');
  }
}
