import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
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

/**
 * Recursively copy a template directory to a target.
 * Returns { created, skipped, updated }.
 * Supports --force, --backup, --dry-run.
 */
export async function copyTemplateTree(srcDir, destDir, options = {}) {
  const { force = false, dryRun = false, backup = false } = options;
  const created = [];
  const skipped = [];
  const updated = [];

  async function walk(src, dest) {
    if (!existsSync(src)) return;
    if (!dryRun && !existsSync(dest)) mkdirSync(dest, { recursive: true });

    for (const entry of readdirSync(src)) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);

      if (statSync(srcPath).isDirectory()) {
        await walk(srcPath, destPath);
      } else {
        const content = readFileSync(srcPath, 'utf8');
        if (!existsSync(destPath)) {
          if (!dryRun) writeFileSync(destPath, content, 'utf8');
          created.push(destPath);
        } else if (force) {
          if (backup && !dryRun) {
            await backupFile(destPath);
          }
          if (!dryRun) writeFileSync(destPath, content, 'utf8');
          updated.push(destPath);
        } else {
          skipped.push(destPath);
        }
      }
    }
  }

  await walk(srcDir, destDir);
  return { created, skipped, updated };
}
