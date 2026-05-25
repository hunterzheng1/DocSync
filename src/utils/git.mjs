import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

export function isGitRepo(cwd = process.cwd()) {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export function getStatusShort(cwd = process.cwd()) {
  try {
    return execSync('git status --short', { cwd, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}
