#!/usr/bin/env node

import { main } from '../src/cli.mjs';
import { CliError } from '../src/utils/args.mjs';

(async () => {
  try {
    await main(process.argv.slice(2));
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
