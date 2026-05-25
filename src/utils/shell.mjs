import { execSync } from 'node:child_process';
import { spawn } from 'node:child_process';

export function hasCommand(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' }).toString().trim();
    return true;
  } catch {
    return false;
  }
}

export function getCommandVersion(command) {
  try {
    return execSync(`${command} --version`, { encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

export async function run(command, args = [], options = {}) {
  const { cwd = process.cwd(), stdio = 'inherit' } = options;
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio, shell: process.platform === 'win32' });
    child.on('exit', (code) => {
      if (code === 0) resolve({ code, output: '' });
      else reject(new Error(`${command} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}
