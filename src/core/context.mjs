import { execSync } from 'node:child_process';
import { writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { getCwd } from '../utils/paths.mjs';

export async function generateGitStatus(outputPath, options = {}) {
  const cwd = getCwd(options);
  try {
    const output = execSync('git status', { cwd, encoding: 'utf8', timeout: 10000 });
    writeFileSync(outputPath, output, 'utf8');
    return { ok: true, file: outputPath };
  } catch (err) {
    writeFileSync(outputPath, `git status failed: ${err.message}\n`, 'utf8');
    return { ok: false, error: err.message };
  }
}

export async function generateRepomixOutput(outputPath, options = {}) {
  const cwd = getCwd(options);
  try {
    execSync('npx --yes repomix --output .docsync/context/repomix-output.xml', {
      cwd,
      stdio: 'inherit',
      timeout: 60000,
    });
    return { ok: true, file: outputPath };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function scanMarkdownDocs(outputPath, options = {}) {
  const cwd = getCwd(options);
  const files = [];

  function scanDir(dir) {
    // Skip node_modules, .git, .docsync/context
    const skipDirs = new Set(['node_modules', '.git']);
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name)) {
          scanDir(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const relPath = relative(cwd, fullPath);
        files.push(relPath);
      }
    }
  }

  scanDir(cwd);

  const inventory = {
    scannedAt: new Date().toISOString(),
    files,
  };

  writeFileSync(outputPath, JSON.stringify(inventory, null, 2), 'utf8');
  return { ok: true, file: outputPath, count: files.length };
}

export async function refreshContext(cwd = process.cwd()) {
  const contextDir = join(cwd, '.docsync', 'context');
  const results = {};

  results.gitStatus = await generateGitStatus(join(contextDir, 'git-status.txt'), { cwd });
  results.docsInventory = await scanMarkdownDocs(join(contextDir, 'docs-inventory.json'), { cwd });
  results.repomix = await generateRepomixOutput(join(contextDir, 'repomix-output.xml'), { cwd });

  return results;
}
