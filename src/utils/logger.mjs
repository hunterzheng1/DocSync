export const logger = {
  ok(label, detail = '') {
    process.stdout.write(`  [OK] ${label}${detail ? `: ${detail}` : ''}\n`);
  },
  missing(label, detail = '') {
    process.stdout.write(`  [MISSING] ${label}${detail ? `: ${detail}` : ''}\n`);
  },
  installed(label, detail = '') {
    process.stdout.write(`  [INSTALLED] ${label}${detail ? `: ${detail}` : ''}\n`);
  },
  info(msg) {
    process.stdout.write(`  ${msg}\n`);
  },
  step(msg) {
    process.stdout.write(`  → ${msg}\n`);
  },
  error(msg) {
    process.stderr.write(`  Error: ${msg}\n`);
  },
};
