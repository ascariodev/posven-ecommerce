#!/usr/bin/env node
// Censo de tamaño, sólo aviso (sale 0): los archivos de código más grandes de un repo, que son los
// candidatos a no engordar más, y el tamaño de lo que se carga en contexto (CLAUDE.md, reglas,
// skills, agentes). Lee el árbol versionado; no ejecuta nada.
//
// Uso: node census.mjs <posveapi|posvenapp|posven-ecommerce|.claude> [--top N]   (en un repo suelto, su nombre)
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { POSVEN, REPO_NAMES, WORKSPACE, gitLs, repoDir } from './lib/common.mjs';

const CODE = {
  posveapi: ['app/**/*.php', 'resources/js/**/*.vue', 'resources/js/**/*.js'],
  posvenapp: ['app/**/*.tsx', 'components/**/*.tsx', 'store/**/*.ts', 'utils/**/*.ts', 'database/**/*.ts', 'hooks/**/*.ts'],
  'posven-ecommerce': ['app/**/*.ts', 'app/**/*.tsx', 'features/**/*.ts', 'features/**/*.tsx', 'lib/**/*.ts', 'components/**/*.tsx'],
};
const CONTEXT = ['CLAUDE.md', '.claude/rules/*.md', '.claude/skills/**/*.md', '.claude/agents/*.md'];

const lines = (path) => readFileSync(path, 'utf8').split('\n').length;

function table(title, dir, files, top) {
  const rows = files
    .map((rel) => ({ rel, lines: lines(join(dir, rel)), bytes: statSync(join(dir, rel)).size }))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, top);
  process.stdout.write(`\n## ${title}\n\n| Líneas | Bytes | Archivo |\n|---:|---:|---|\n`);
  for (const r of rows) process.stdout.write(`| ${r.lines} | ${r.bytes} | ${r.rel} |\n`);
}

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));
const topAt = args.indexOf('--top');
const top = topAt !== -1 ? Number(args[topAt + 1]) : 15;
if (![...REPO_NAMES, ...(WORKSPACE ? ['.claude'] : [])].includes(name)) {
  process.stderr.write('uso: census <posveapi|posvenapp|posven-ecommerce|.claude> [--top N]\n');
  process.exit(2);
}

process.stdout.write(`# Censo: ${name}\n`);
if (name === '.claude') {
  const dir = repoDir('.claude');
  const files = gitLs(dir, ':(glob)rules/*.md', ':(glob)skills/**/*.md', ':(glob)agents/*.md');
  table('Contexto de posven/.claude', dir, files, top);
  table('CLAUDE.md raíz', POSVEN, ['CLAUDE.md'], 1);
} else {
  const dir = repoDir(name);
  table('Código más grande', dir, gitLs(dir, ...(CODE[name] ?? []).map((g) => `:(glob)${g}`)), top);
  table('Contexto del repo', dir, gitLs(dir, ...CONTEXT.map((g) => `:(glob)${g}`)), top);
}
