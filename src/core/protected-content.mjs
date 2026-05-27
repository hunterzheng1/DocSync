/**
 * Protected content validation
 * Ensures sync operations don't delete or modify protected content clauses
 */

export class ProtectedContentViolation extends Error {
  constructor(rule, file) {
    super(`Protected content violation: "${rule.slug}" in ${file}`);
    this.name = 'ProtectedContentViolation';
    this.rule = rule;
    this.file = file;
  }
}

export function checkProtectedContent(edits, protectedRules) {
  for (const edit of edits) {
    for (const rule of protectedRules) {
      if (rule.target !== edit.file) continue;
      if (!rule.text) continue;

      // Check if the new content still contains the protected text
      if (!edit.newContent.includes(rule.text)) {
        throw new ProtectedContentViolation(rule, edit.file);
      }
    }
  }
  return { ok: true };
}

export function parseProtectedSections(content) {
  const sections = [];
  const re = /## ProtectedContent\s*\n([\s\S]*?)$/;
  const match = content.match(re);
  if (!match) return sections;

  const items = match[1];
  const itemRe = /###\s+([\w-]+)\s*\n[\s\S]*?Target:\s*(\S+)\s*\n[\s\S]*?Text:\s*([\s\S]*?)(?=###\s+[\w-]+|\s*$)/g;
  let m;
  while ((m = itemRe.exec(items)) !== null) {
    sections.push({ slug: m[1], target: m[2], text: m[3].trim() });
  }
  return sections;
}
