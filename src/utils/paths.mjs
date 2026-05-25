import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..', '..');

export function getCwd(options) {
  return options.cwd ? resolve(process.cwd(), options.cwd) : process.cwd();
}

export function getTemplateRoot() {
  return join(PROJECT_ROOT, 'templates', 'project');
}

export function resolveProjectPath(cwd, ...segments) {
  return resolve(cwd, ...segments);
}

export function getGlobalClaudeSkillPath() {
  return join(homedir(), '.claude', 'skills', 'doc-sync', 'SKILL.md');
}

export function getGlobalCodexAgentsPath() {
  return join(homedir(), '.codex', 'AGENTS.md');
}
