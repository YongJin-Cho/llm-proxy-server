import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(npm, ['exec', '--', 'tsx', 'watch', 'src/server.ts'], { stdio: 'inherit' }),
  spawn(npm, ['run', 'build:ui', '--', '--watch'], { stdio: 'inherit' }),
];

let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill(signal);
};

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

for (const child of children) {
  child.once('exit', (code, signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const other of children) {
      if (other !== child) other.kill('SIGTERM');
    }
    process.exit(signal ? 1 : (code ?? 1));
  });
}
