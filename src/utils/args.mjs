const VALUE_FLAGS = new Set(['--cwd', '--docs', '--extra']);

const KNOWN_BOOLEANS = new Set([
  '--force', '--backup', '--dry-run', '--verbose', '--quiet',
  '--compress', '--no-lint', '--no-init',
  '--global', '--project',
]);

function kebabToCamel(str) {
  return str.replace(/^--/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export class CliError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

export function parseArgs(argv) {
  const options = {};
  const rest = [];

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    if (token.startsWith('--')) {
      const name = kebabToCamel(token);

      if (VALUE_FLAGS.has(token)) {
        if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
          throw new CliError(`Missing value for ${token}`, 2);
        }
        options[name] = argv[++i];
      } else {
        options[name] = true;
      }
    } else {
      rest.push(token);
    }
  }

  return { options, rest };
}
