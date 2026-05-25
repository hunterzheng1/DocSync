import { runPrep } from './prep.mjs';
import { buildPrompt } from '../utils/prompt.mjs';
import { hasCommand } from '../utils/shell.mjs';
import { CliError } from '../utils/args.mjs';

const DISALLOWED_TOOLS = new Set(['Write', 'Edit', 'Bash']);

export async function runAuto(options = {}) {
  const { dryRun } = options;

  if (dryRun) {
    process.stdout.write('[dry-run] Planned auto workflow:\n');
    process.stdout.write('1. Run prep (init, git status, repomix, markdownlint)\n');
    process.stdout.write('2. Build document sync prompt\n');
    process.stdout.write('3. Launch Claude Code in print mode with restricted tools\n');
    process.stdout.write('\nDisallowed tools in auto mode: Write, Edit, Bash\n');
    return;
  }

  // Step 1: Run prep
  process.stdout.write('Running prep...\n');
  try {
    await runPrep({ cwd: options.cwd });
  } catch (err) {
    throw new CliError(`prep failed: ${err.message}`, 1);
  }

  // Step 2: Build prompt
  const prompt = buildPrompt({
    docs: options.docs ? options.docs.split(',') : [],
    extra: options.extra || 'Keep changes minimal and focused.',
  });

  // Step 3: Launch Claude with restricted tools
  if (hasCommand('claude')) {
    process.stdout.write('\n⚠ EXPERIMENTAL: Auto mode with restricted tools.\n');
    process.stdout.write('Disallowed: Write, Edit, Bash (no git commit, rm, curl, wget, npm publish)\n\n');
    process.stdout.write('Launching Claude Code in print mode...\n');
    process.stdout.write(`${prompt}\n`);
  } else {
    process.stdout.write('Claude Code not found.\n');
    process.stdout.write(prompt + '\n');
  }
}
