import { parseArgs, CliError } from './utils/args.mjs';
import { printHelp } from './commands/help.mjs';
import { runVersion } from './commands/version.mjs';

const COMMANDS = new Set(['sync', 'version', 'help']);

export async function main(argv) {
  let command = argv[0] || 'help';
  const rest = argv.slice(1);

  // Normalize version/help aliases
  if (command === '--version' || command === '-v') command = 'version';
  if (command === '--help' || command === '-h') command = 'help';

  if (command === 'help') { printHelp(); return; }
  if (command === 'version') { runVersion(); return; }

  if (!COMMANDS.has(command)) {
    process.stderr.write(`Error: Unknown command "${command}"\n\n`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  const { options } = parseArgs(rest);

  switch (command) {
    case 'sync': {
      const { runSync } = await import('./commands/sync.mjs');
      const targets = rest.filter(arg => !arg.startsWith('--'));
      const fast = rest.includes('--fast');
      await runSync({ ...options, targets, fast });
      break;
    }
  }
}
