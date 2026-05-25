import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';

export function exists(filePath) {
  return existsSync(filePath);
}

export async function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

export async function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

export async function writeText(filePath, content) {
  ensureDir(dirname(filePath));
  writeFileSync(filePath, content, 'utf8');
}

export function makeBackupPath(filePath) {
  const ts = new Date()
    .toISOString()
    .replace(/[-:T]/g, '')
    .slice(0, 14);
  return `${filePath}.bak.${ts}`;
}

export async function backupFile(filePath) {
  const bakPath = makeBackupPath(filePath);
  const content = readFileSync(filePath, 'utf8');
  writeFileSync(bakPath, content, 'utf8');
  return bakPath;
}

/**
 * Write file only if it doesn't exist, or if force=true.
 * Returns { action, path, backupPath? }
 */
export async function writeIfMissing(filePath, content, options = {}) {
  const { force = false, backup = false, dryRun = false } = options;
  const fileExists = exists(filePath);

  if (fileExists && !force) {
    return { action: 'skipped', path: filePath };
  }

  if (dryRun) {
    return { action: fileExists && force ? 'overwrite-planned' : 'create-planned', path: filePath };
  }

  if (fileExists && force) {
    let bakPath;
    if (backup) {
      bakPath = await backupFile(filePath);
    }
    await writeText(filePath, content);
    return { action: 'overwritten', path: filePath, backupPath: bakPath };
  }

  await writeText(filePath, content);
  return { action: 'created', path: filePath };
}
