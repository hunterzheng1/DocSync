import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, '..', '..', 'package.json');

let cachedVersion = null;

export function runVersion() {
  if (cachedVersion === null) {
    try {
      const { version } = JSON.parse(readFileSync(pkgPath, 'utf8'));
      cachedVersion = version;
    } catch {
      cachedVersion = '0.1.0';
    }
  }
  process.stdout.write(cachedVersion + '\n');
}
