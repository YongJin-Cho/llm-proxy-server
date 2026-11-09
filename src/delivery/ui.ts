import { existsSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { ServerResponse } from 'node:http';

export function serveUi(pathname: string, res: ServerResponse) {
  const uiRoot = join(process.cwd(), 'dist', 'ui');
  const requested = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const file = join(uiRoot, requested);
  const target = existsSync(file) ? file : join(uiRoot, 'index.html');
  if (!existsSync(target)) return false;
  const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
  res.writeHead(200, { 'content-type': types[extname(target)] ?? 'application/octet-stream' });
  res.end(readFileSync(target));
  return true;
}
