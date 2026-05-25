import { parseArgs, CliError } from './utils/args.mjs';
import { printHelp } from './commands/help.mjs';
import { runVersion } from './commands/version.mjs';

const COMMANDS = new Set([
  'init', 'prep', 'ai', 'auto', 'doctor',
  'skill', 'codex', 'version', 'help',
]);

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
    case 'init': {
      const { runInit } = await import('./commands/init.mjs');
      await runInit(options);
      break;
    }
    case 'prep': {
      const { runPrep } = await import('./commands/prep.mjs');
      await runPrep(options);
      break;
    }
    case 'ai': {
      const { runAi } = await import('./commands/ai.mjs');
      await runAi(options);
      break;
    }
    case 'auto': {
      const { runAuto } = await import('./commands/auto.mjs');
      await runAuto(options);
      break;
    }
    case 'doctor': {
      const { runDoctor } = await import('./commands/doctor.mjs');
      await runDoctor(options);
      break;
    }
    case 'skill': {
      const { runSkill } = await import('./commands/skill.mjs');
      const subcommand = rest[0] || 'help';
      if (subcommand === 'help') {
        process.stdout.write('Usage: docsync skill <install|update|path> [options]\n');
        return;
      }
      await runSkill(subcommand, options);
      break;
    }
    case 'codex': {
      const { runCodex } = await import('./commands/codex.mjs');
      const subcommand = rest[0] || 'help';
      if (subcommand === 'help') {
        process.stdout.write('Usage: docsync codex <install|update|path> [options]\n');
        return;
      }
      await runCodex(subcommand, options);
      break;
    }
    default:
      process.stdout.write(`Command "${command}" is recognized but not yet implemented.\n`);
      if (options.verbose) {
        process.stdout.write(`  argv: ${JSON.stringify(argv)}\n`);
        process.stdout.write(`  options: ${JSON.stringify(options)}\n`);
      }
  }
}
