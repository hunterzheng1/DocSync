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
    'STEP 1: Read the prepared project context file (repomix-output.xml) to understand the codebase, structure, and existing documentation.',
    'STEP 2: If any target file does not exist, CREATE it with complete content based on the context you just read.',
    'STEP 3: If a target file already exists, update it with minimal changes to reflect current project facts.',
    '',
    'RULES:',
    '1. Always read repomix-output.xml FIRST before creating or editing any files.',
    '2. For new files, write complete and useful documentation. For existing files, minimize changes.',
    '3. Do NOT invent commands, ports, environment variables, APIs, modules, or deployment steps.',
    '4. Base ALL content on facts from the prepared context (repomix-output.xml).',
    '5. Mark uncertain content as TODO(review).',
    '6. Keep documentation concise and avoid duplication.',
    '7. Do NOT read or output secrets, tokens, or credentials.',
    '8. Do NOT perform git commit, git push, or npm publish.',
    '',
    'After sync:',
    '- Report changed files and sections.',
    '- Report facts used from context.',
    '- Run markdownlint-cli2 --fix if available.',
    '',
    'TIP: After installing the DocSync Skill (docsync skill install), you can use /docsync:sync in future sessions instead of this prompt.',
    '',
    extra ? `ADDITIONAL REQUIREMENTS:\n${extra}` : '',
  ].filter(Boolean).join('\n');
}

export async function prompt(question) {
  const readline = await import('node:readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}
