const VALID_DOCS = new Set(['readme', 'agents', 'claude']);

export function buildPrompt(options = {}) {
  const { docs = [], extra = '' } = options;

  // Validate docs
  const invalidDocs = docs.filter(d => !VALID_DOCS.has(d));
  if (invalidDocs.length > 0) {
    throw new Error(`Invalid doc scope: ${invalidDocs.join(', ')}. Valid: ${[...VALID_DOCS].join(', ')}`);
  }

  const docTargets = docs.length
    ? docs.map(d => {
        switch (d) {
          case 'readme': return 'README.md';
          case 'agents': return 'AGENTS.md';
          case 'claude': return 'CLAUDE.md';
        }
      }).join(', ')
    : 'README.md, AGENTS.md, CLAUDE.md';

  return [
    `Create or update the following project documentation files: ${docTargets}.`,
    '',
    'IMPORTANT: If any of these files do not exist, CREATE them with appropriate content based on the prepared context.',
    '',
    'RULES:',
    '1. For new files, create complete content. For existing files, minimize changes and only update what is necessary.',
    '2. Do NOT invent commands, ports, environment variables, APIs, modules, or deployment steps.',
    '3. Base all content on repository facts from the prepared context.',
    '4. Mark uncertain content as TODO(review).',
    '5. Keep documentation concise and avoid duplication.',
    '6. Do NOT read or output secrets, tokens, or credentials.',
    '7. Do NOT perform git commit, git push, or npm publish.',
    '',
    'After sync:',
    '- Report changed files and sections.',
    '- Report facts used from context.',
    '- Run markdownlint-cli2 --fix if available.',
    '',
    extra ? `ADDITIONAL REQUIREMENTS:\n${extra}` : '',
  ].filter(Boolean).join('\n');
}
