#!/usr/bin/env node

import { main } from '../src/cli.mjs';
import { CliError } from '../src/utils/args.mjs';

(async () => {
  const args = process.argv.slice(2);

  // No parameter → npx bootstrap entry point (interactive AI tool selection)
  if (args.length === 0) {
    const { runBootstrap } = await import('../src/commands/init.mjs');
    await runBootstrap();
    return;
  }

  try {
    await main(args);
    process.exitCode = process.exitCode || 0;
  } catch (err) {
    if (err instanceof CliError) {
      process.stderr.write(err.message + '\n');
      process.exitCode = err.exitCode;
    } else {
      process.stderr.write(`Error: ${err.message}\n`);
      process.exitCode = 1;
    }
  }
})();
