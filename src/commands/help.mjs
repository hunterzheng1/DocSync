export function printHelp() {
  const lines = [
    'Usage: docsync <command> [options]',
    '',
    'Commands:',
    '  init      Initialize DocSync project templates',
    '  prep      Prepare project context for document sync',
    '  ai        Start interactive document sync (Claude Code)',
    '  auto      Experimental: non-interactive document sync',
    '  doctor    Check local environment and tool status',
    '  skill     Manage Claude Code Skill files',
    '  codex     Manage Codex global rule files',
    '  version   Show package version',
    '  help      Show this help message',
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
