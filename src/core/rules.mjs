import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function readRules(cwd = process.cwd()) {
  const defaultPath = join(cwd, '.docsync', 'rules', 'default.md');
  const overridePath = join(cwd, '.docsync', 'rules', 'override.md');

  let defaultRules = '';
  if (existsSync(defaultPath)) {
    defaultRules = readFileSync(defaultPath, 'utf8');
  }

  let overrideRules = '';
  let protectedContent = [];
  if (existsSync(overridePath)) {
    overrideRules = readFileSync(overridePath, 'utf8');
    protectedContent = parseProtectedContent(overrideRules);
  }

  return {
    default: defaultRules,
    override: overrideRules,
    protected: protectedContent,
  };
}

function parseProtectedContent(content) {
  const items = [];
  const sectionRegex = /## ProtectedContent([\s\S]*?)$/;
  const sectionMatch = content.match(sectionRegex);

  if (!sectionMatch) return items;

  const sectionContent = sectionMatch[1];
  // Parse individual protected items
  // Format: ### slug\nTarget: ...\nText: ...
  const itemRegex = /###\s+([\w-]+)\s*\n([\s\S]*?)(?=###\s+[\w-]+|$)/g;
  let match;

  while ((match = itemRegex.exec(sectionContent)) !== null) {
    const slug = match[1];
    const body = match[2].trim();

    const targetMatch = body.match(/Target:\s*(.+)/);
    const textMatch = body.match(/Text:\s*([\s\S]*?)(?=\n[A-Z]|\n*$)/);

    items.push({
      slug,
      target: targetMatch ? targetMatch[1].trim() : '',
      text: textMatch ? textMatch[1].trim() : '',
    });
  }

  return items;
}

export function mergeRules(defaultRules, overrideRules) {
  // Default rules are the baseline
  // Override rules add to or replace specific rules
  return {
    default: defaultRules,
    override: overrideRules,
    // In practice, the AI uses both: default as baseline, override for specific overrides
  };
}
