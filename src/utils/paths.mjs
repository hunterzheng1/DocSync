import { homedir } from 'node:os';
import { resolve, join } from 'node:path';

export function getCwd(options) {
  return options.cwd ? resolve(process.cwd(), options.cwd) : process.cwd();
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
