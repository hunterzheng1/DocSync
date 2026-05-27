import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const WORKSPACE_STRUCTURE = [
  'config',
  'context',
  'rules',
  'adapters/claude',
  'adapters/codex',
  'templates',
  'state',
];

const DEFAULT_FILES = {
  'config/repomix.config.json': JSON.stringify({
    output: {
      filePath: '.docsync/context/repomix-output.xml',
      style: 'xml',
      removeComments: false,
      removeEmptyLines: true,
      topFilesLength: 20,
    },
    include: [],
    ignore: {
      useGitignore: true,
      useGlobalPatterns: true,
      customPatterns: [
        '.docsync/context/repomix-output.xml',
        '.env',
        '.env.*',
        '*.pem',
        '*.key',
        '*.p12',
        '*.jks',
        'node_modules/**',
        'dist/**',
        'build/**',
      ],
    },
  }, null, 2),
  'config/repomixignore': `# Repomix ignore patterns
# Exclude sensitive and generated files

.env
.env.*
*.pem
*.key
*.p12
*.jks
*.log

node_modules/
dist/
build/
coverage/
tmp/
temp/

.docsync/context/repomix-output.xml
repomix-output.xml
repomix-output.txt

.DS_Store
Thumbs.db
.vscode/
.idea/
`,
  'config/markdownlint-cli2.jsonc': JSON.stringify({
    globs: ['**/*.md'],
    ignores: ['node_modules/', 'dist/', 'build/', '.docsync/context/repomix-output.xml'],
    fix: true,
    markdownlintConfig: {
      default: true,
      MD013: false,
      MD041: false,
    },
  }, null, 2),
  'config/ignore.md': '# Repomix ignore rules\n',
  'context/.gitkeep': '',
  'rules/default.md': '# DocSync Default Rules\n\n- Do not invent commands, ports, environment variables, APIs, or deployment steps.\n- Mark uncertain content as `TODO(review)`.\n',
  'rules/override.md': `# DocSync Override Rules

> This file has higher priority than DocSync default documentation rules.
> Keep rules concrete, stable, and verifiable.

## Global

- Do not invent commands, ports, environment variables, APIs, or deployment steps.
- Mark uncertain content as \`TODO(review)\`.

## README.md


## AGENTS.md


## CLAUDE.md


## ProtectedContent
`,
};

export async function createWorkspace(cwd = process.cwd()) {
  const docsyncDir = join(cwd, '.docsync');
  const filesCreated = [];

  // Create directory structure
  for (const subDir of WORKSPACE_STRUCTURE) {
    const dirPath = join(docsyncDir, subDir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  // Create default files
  for (const [relPath, content] of Object.entries(DEFAULT_FILES)) {
    const fullPath = join(docsyncDir, relPath);
    if (!existsSync(fullPath)) {
      writeFileSync(fullPath, content, 'utf8');
      filesCreated.push(`.docsync/${relPath}`);
    }
  }


  return filesCreated;
}

export function validateWorkspace(cwd = process.cwd()) {
  const docsyncDir = join(cwd, '.docsync');
  const requiredDirs = ['config', 'context', 'rules', 'state'];
  const missing = [];

  for (const dir of requiredDirs) {
    if (!existsSync(join(docsyncDir, dir))) {
      missing.push(dir);
    }
  }

  return {
    ok: missing.length === 0,
    missing,
  };
}

export async function ensureWorkspace(cwd = process.cwd()) {
  const validation = validateWorkspace(cwd);
  if (!validation.ok) {
    // Try to auto-repair missing directories
    const docsyncDir = join(cwd, '.docsync');
    for (const dir of validation.missing) {
      const dirPath = join(docsyncDir, dir);
      mkdirSync(dirPath, { recursive: true });
    }
  }
  return validateWorkspace(cwd);
}
