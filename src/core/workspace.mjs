import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getTemplateRoot } from '../utils/paths.mjs';
import { readText } from '../utils/fs.mjs';

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
  'config/repomix.config.json': JSON.stringify({ output: { filePath: '.docsync/context/repomix-output.xml' } }, null, 2),
  'config/markdownlint-cli2.jsonc': JSON.stringify({ config: { default: true } }, null, 2),
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

  // Copy templates
  const templateRoot = getTemplateRoot();
  const templateFiles = [
    { src: 'project/README.md', dest: 'templates/README.template.md' },
    { src: 'project/AGENTS.md', dest: 'templates/AGENTS.template.md' },
    { src: 'project/CLAUDE.md', dest: 'templates/CLAUDE.template.md' },
  ];

  for (const tpl of templateFiles) {
    const srcPath = join(templateRoot, tpl.src);
    const destPath = join(docsyncDir, tpl.dest);
    if (existsSync(srcPath) && !existsSync(destPath)) {
      const content = readText(srcPath);
      writeFileSync(destPath, content, 'utf8');
      filesCreated.push(`.docsync/${tpl.dest}`);
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
