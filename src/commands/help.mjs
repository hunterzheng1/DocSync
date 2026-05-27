export function printHelp() {
  const lines = [
    'Usage: npx @hunterzheng/docsync',
    '',
    'Recommended entry point:',
    '  npx @hunterzheng/docsync          Bootstrap installation (interactive)',
    '  npx @hunterzheng/docsync@latest   Same, explicit latest',
    '',
    'Commands:',
    '  sync      Document sync (full or fast mode)',
    '  version   Show package version',
    '  help      Show this help message',
    '',
    'AI-Driven Slash Commands (after bootstrap):',
    '  /docsync:init       Project initialization and first sync',
    '  /docsync:sync       Daily document sync (full mode)',
    '  /docsync:sync --fast  Quick sync using git facts',
    '  /docsync:sync [file]  Sync specific file(s)',
    '  /docsync:rules      Maintain override rules',
    '  /docsync:rules show  Show current rules',
    '',
    'Options:',
    '  --force      Allow overwriting existing files',
    '  --backup     Backup before overwriting',
    '  --dry-run    Print planned actions without executing',
    '  --verbose    Enable detailed output',
    '  --quiet      Reduce output',
    '  --cwd <path>  Specify target project directory',
    '',
  ];
  for (const line of lines) {
    process.stdout.write(line + '\n');
  }
}
