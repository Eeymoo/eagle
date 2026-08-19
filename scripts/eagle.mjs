// @ts-check
/**
 * Eagle monorepo task runner.
 * Thin wrapper around package managers so contributors and agents don't
 * need to remember filter syntax. Run `node scripts/eagle.mjs help` for usage.
 */
import { spawnSync } from 'node:child_process';
import process from 'node:process';

const [, , cmd, ...args] = process.argv;

const PNPM = 'pnpm';
const hasPnpm = spawnSync(PNPM, ['-v'], { encoding: 'utf8', shell: process.platform === 'win32' }).status === 0;

/** @param {string} bin @param {string[]} argv */
function runBin(bin, argv) {
  const r = spawnSync(bin, argv, { stdio: 'inherit', shell: process.platform === 'win32' });
  process.exit(r.status ?? 1);
}

/** @param {string[]} filters @param {string[]} rest */
function pnpmFiltered(filters, rest) {
  const argv = ['-r', ...filters.flatMap((f) => ['--filter', f]), ...rest];
  console.log(`> ${PNPM} ${argv.join(' ')}`);
  if (!hasPnpm) {
    console.error(
      `[eagle] pnpm not found. Install it (corepack enable && corepack prepare pnpm@10 --activate) then re-run.`,
    );
    process.exit(127);
  }
  runBin(PNPM, argv);
}

function help() {
  console.log(`Eagle monorepo runner

Usage:
  node scripts/eagle.mjs <group> [args...]

Groups (each maps to a pnpm -r --filter group, extra args pass through):
  core      @eagle/core             build / test / typecheck
  rn        @eagle/rn + @eagle/core bundle, pods, run:ios, run:android, start
  ios       @eagle/ios              run:ios, pods
  android   @eagle/android          run:android
  web       @eagle/web              dev / build / tauri
  ui        @eagle/rn-ui            typecheck / lint (UI plugin sources)
  plugin    alias of "ui"

Examples:
  node scripts/eagle.mjs core build
  node scripts/eagle.mjs core test
  node scripts/eagle.mjs rn start
  node scripts/eagle.mjs rn run:ios
  node scripts/eagle.mjs ios pods
  node scripts/eagle.mjs web dev
`);
}

/** @type {Record<string, string[]>} */
const GROUPS = {
  core: ['@eagle/core'],
  rn: ['@eagle/rn', '@eagle/core'],
  ios: ['@eagle/ios'],
  android: ['@eagle/android'],
  web: ['@eagle/web'],
  ui: ['@eagle/rn-ui'],
  plugin: ['@eagle/rn-ui'],
};

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
  help();
  process.exit(0);
}

const group = GROUPS[cmd];
if (!group) {
  console.error(`[eagle] unknown group "${cmd}" — see \`node scripts/eagle.mjs help\``);
  help();
  process.exit(1);
}
pnpmFiltered(group, args);
