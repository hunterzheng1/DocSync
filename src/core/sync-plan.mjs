import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readRules } from './rules.mjs';

export async function extractFacts(cwd = process.cwd()) {
  const facts = {};

  // Parse package.json
  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    facts.packageName = pkg.name;
    facts.scripts = pkg.scripts || {};
    facts.dependencies = pkg.dependencies || {};
    facts.devDependencies = pkg.devDependencies || {};
  }

  // Scan directory structure
  facts.files = [];

  // Read existing docs
  facts.readme = existsSync(join(cwd, 'README.md'))
    ? readFileSync(join(cwd, 'README.md'), 'utf8')
    : null;
  facts.agents = existsSync(join(cwd, 'AGENTS.md'))
    ? readFileSync(join(cwd, 'AGENTS.md'), 'utf8')
    : null;
  facts.claude = existsSync(join(cwd, 'CLAUDE.md'))
    ? readFileSync(join(cwd, 'CLAUDE.md'), 'utf8')
    : null;

  // Read rules
  const rules = readRules(cwd);
  facts.rules = rules;

  return facts;
}

export async function generateSyncPlan(targets, facts, rules, mode = 'full', cwd = process.cwd()) {
  const plan = {
    updated_files: [],
    skipped_files: [],
    facts_used: [],
    mode,
    todo_review: [],
  };

  // Track which facts were used
  if (facts.packageName) plan.facts_used.push('package.json name');
  if (facts.scripts) plan.facts_used.push('package.json scripts');
  if (rules.override) plan.facts_used.push('.docsync/rules/override.md');
  if (rules.default) plan.facts_used.push('.docsync/rules/default.md');

  const docFiles = [
    { name: 'README.md', content: facts.readme },
    { name: 'AGENTS.md', content: facts.agents },
    { name: 'CLAUDE.md', content: facts.claude },
  ].filter(d => targets.length === 0 || targets.includes(d.name));

  for (const doc of docFiles) {
    if (!doc.content) {
      // Document doesn't exist, will be created
      plan.updated_files.push(doc.name);
      continue;
    }

    // For now, mark as updated if changes are needed
    // The actual edit computation would be done by the AI during sync
    plan.updated_files.push(doc.name);
  }

  return plan;
}

export async function readLightweightFacts(cwd = process.cwd()) {
  const facts = {};

  try {
    const { execSync } = await import('node:child_process');
    facts.lastCommit = execSync('git log -1 --oneline', { cwd, encoding: 'utf8' }).trim();
    facts.statusShort = execSync('git status --short', { cwd, encoding: 'utf8' }).trim();
    facts.diffNames = execSync('git diff --name-only', { cwd, encoding: 'utf8' }).trim();
    facts.diffStat = execSync('git diff --stat', { cwd, encoding: 'utf8' }).trim();
  } catch {
    // Not a git repo or no commits
    facts.gitAvailable = false;
  }

  return facts;
}
