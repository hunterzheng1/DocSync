import { mkdirSync, writeFileSync, renameSync, unlinkSync, rmdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname, resolve, basename } from 'node:path';
import { writeText } from '../utils/fs.mjs';

export async function transaction(edits, validateFn) {
  // Determine base cwd from edits or fallback to process.cwd()
  const baseCwd = edits.find(e => e.basePath)?.basePath || process.cwd();
  const tmpDir = join(baseCwd, '.docsync', '.tmp-sync');
  mkdirSync(tmpDir, { recursive: true });

  const written = [];

  try {
    // Write to temp files
    for (const edit of edits) {
      const tmpPath = join(tmpDir, basename(edit.file));
      await writeText(tmpPath, edit.newContent);
      written.push(tmpPath);
    }

    // Run validation (typically protected content check)
    if (validateFn) {
      const tempEdits = edits.map(e => ({
        ...e,
        newContent: readFileSync(join(tmpDir, basename(e.file)), 'utf8'),
      }));
      validateFn(tempEdits);
    }

    // Atomic write: rename temp to actual
    for (const edit of edits) {
      const tmpPath = join(tmpDir, basename(edit.file));
      const targetPath = edit.basePath ? resolve(edit.basePath, edit.file) : resolve(edit.file);
      renameSync(tmpPath, targetPath);
    }

    return { ok: true, files: edits.map(e => e.file) };
  } catch (err) {
    // Cleanup temp files on failure
    for (const f of written) {
      try { unlinkSync(f); } catch { /* ignore */ }
    }
    try { rmdirSync(tmpDir); } catch { /* ignore */ }
    throw err;
  } finally {
    // Cleanup tmp dir if empty
    try {
      if (existsSync(tmpDir)) {
        rmdirSync(tmpDir);
      }
    } catch { /* ignore */ }
  }
}
