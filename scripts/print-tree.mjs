// @ts-check
/** Pretty-print the Eagle repo tree (depth-limited) for docs / README upkeep. */
import { readdirSync, statSync, writeSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIR = new Set(['node_modules', '.git', 'dist', 'lib', '.expo', 'target', '.vite']);
const SKIP_FILE = new Set(['.npmwtips.json', 'pnpm-lock.yaml']);

/** @param {string} name */
function sortKey(name) {
  const isDir = (() => {
    try {
      return statSync(join(ROOT, name)).isDirectory();
    } catch {
      return false;
    }
  })();
  // prettier-ignore
  const rank =
    (name === 'packages' || name === 'apps') ? 0 :
    name === 'packages' ? 0 :
    rankOf(name);
  return String(isDir ? 0 : 1) + rank + name;
}

/** @param {string} name */
function rankOf(name) {
  const prefixes = [
    ['README', '0'],
    ['docs/', '1'],
    ['packages/', '2'],
    ['apps/', '3'],
    ['scripts/', '4'],
  ];
  for (const [p, r] of prefixes) if (name.startsWith(p)) return r;
  return '9';
}

/** @param {string} dir @param {number} depth @param {string} prefix */
function walk(dir, depth, prefix) {
  if (depth < 0) return;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  const items = entries
    .filter((e) => !SKIP_DIR.has(e.name) && !SKIP_FILE.has(e.name))
    .sort((a, b) => Number(a.isDirectory()) - Number(b.isDirectory()) || a.name.localeCompare(b.name));
  items.forEach((e, i) => {
    const last = i === items.length - 1;
    const branch = last ? '`-- ' : '|-- ';
    writeSync(1, prefix + branch + e.name + (e.isDirectory() && depth === 0 ? ' (…)' : '') + '\n');
    if (e.isDirectory() && depth > 0) walk(join(dir, e.name), depth - 1, prefix + (last ? '    ' : '|   '));
  });
}

writeSync(1, '.\n');
walk(ROOT, 3, '');
