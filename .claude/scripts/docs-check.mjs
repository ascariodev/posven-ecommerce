#!/usr/bin/env node
// Verificador liviano de la documentación de agentes. ERROR (sale 1): README de módulo que no
// cumple el contrato (posven/.claude/docs/conventions/module-readme.md) o cuyo frontmatter tiene
// un escalar entre comillas dobles con comillas dobles dentro, o lección sin
// `aplicada en:` válida. AVISO (sale 0): README rancio (una ruta de `verified_against` cambió
// después del último commit del README), glob de regla que no casa ningún archivo, narrativa de
// plan en un README, archivo de contexto que pasa su tope, lección promovida candidata a poda.
//
// Uso: node docs-check.mjs [posveapi] [posvenapp] [posven-ecommerce] [.claude] [--poda]   (sin objetivos, los cuatro;
// --poda lista además las lecciones promovidas candidatas a poda). En un repo suelto (raíz
// sin los repos) el único objetivo es él y `aplicada en:` con prefijo posven/ o <repo>/ se resuelve contra él.
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { POSVEN, REPOS, REPO_NAMES, WORKSPACE, gitLs, globToRegex, lastCommitTime, moduleReadmes, parseFrontmatter, readText, repoDir, sections } from './lib/common.mjs';

const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`ERROR ${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`AVISO ${where}: ${msg}`);

const REQUIRED_KEYS = ['module', 'path', 'type', 'exports', 'depends_on', 'tests', 'verified_against', 'capabilities'];
const TYPES = ['feature', 'infra', 'integration', 'util'];
const NARRATIVE = /\b(Task \d+|tarea \d+|fase \d+|todav[ií]a no|por ahora|cuando exista|en esta fase)\b/i;
const LIMITS = [
  [/(^|\/)CLAUDE\.md$/, 120],
  [/(^|\/)\.claude\/rules\/[^/]+\.md$|^rules\/[^/]+\.md$/, 60],
  [/(^|\/)skills\/[^/]+\/SKILL\.md$/, 150],
  [/(^|\/)agents\/[^/]+\.md$/, 120],
];

function checkReadme(name, dir, { rel, text, fm }) {
  const where = `${name}/${rel}`;
  for (const key of REQUIRED_KEYS) if (fm[key] === undefined) err(where, `falta la clave \`${key}\` en el frontmatter`);
  if (fm.type !== undefined && !TYPES.includes(fm.type)) err(where, `type "${fm.type}" no es ${TYPES.join('|')}`);
  const fmBlock = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
  fmBlock.split(/\r?\n/).forEach((line, i) => {
    const quoted = line.match(/^\s*(?:-\s+|[\w-]+:\s+)"(.*)"\s*$/);
    if (quoted && /(^|[^\\])"/.test(quoted[1])) err(`${where}:${i + 2}`, 'escalar entre comillas dobles con comillas dobles dentro: YAML inválido (usar comillas simples dentro)');
  });
  const verified = Array.isArray(fm.verified_against) ? fm.verified_against : [];
  if (fm.verified_against !== undefined && verified.length === 0) err(where, '`verified_against` vacía');
  const readmeTime = lastCommitTime(dir, rel);
  for (const path of verified) {
    if (!existsSync(join(dir, path))) {
      err(where, `verified_against apunta a una ruta que no existe: ${path}`);
      continue;
    }
    const t = lastCommitTime(dir, path);
    if (readmeTime !== null && t !== null && t > readmeTime) warn(where, `RANCIO: ${path} cambió después del último commit del README`);
  }

  const secs = sections(text);
  for (let n = 1; n <= 9; n++) if (!secs.has(n)) err(where, `falta la sección \`## ${n}.\``);
  const purpose = (secs.get(1)?.body ?? []).join(' ').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
  if (purpose.length > 600) err(where, `Propósito de ${purpose.length} caracteres (máximo 600)`);

  for (const line of secs.get(2)?.body ?? []) {
    const row = /^\|\s*`?(RN-[A-Z0-9_-]+-\d+)`?\s*\|([^|]*)\|/.exec(line);
    if (row && row[2].trim().length > 240) err(where, `${row[1]}: enunciado de ${row[2].trim().length} caracteres (máximo 240)`);
  }

  const api = (secs.get(4)?.body ?? []).join('\n');
  for (const exp of Array.isArray(fm.exports) ? fm.exports : []) {
    if (!api.includes(exp)) err(where, `export \`${exp}\` no aparece en la sección 4`);
  }
  if (Array.isArray(fm.capabilities) && fm.capabilities.filter((c) => typeof c === 'object').length === 0) {
    err(where, 'sin capacidades en `capabilities`');
  }

  text.split('\n').forEach((line, i) => {
    if (i > 0 && NARRATIVE.test(line) && !line.startsWith('<!--')) warn(`${where}:${i + 1}`, `narrativa de plan: "${line.trim().slice(0, 80)}"`);
  });
}

function checkLessons(name, dir) {
  const rel = 'docs/conventions/lessons.md';
  const path = join(dir, rel);
  if (!existsSync(path)) return;
  const where = `${name}/${rel}`;
  const text = readText(path);
  const entries = text.split(/^## (?=L-\d+)/m).slice(1);
  const seen = new Set();
  for (const entry of entries) {
    const id = /^(L-\d+)/.exec(entry)[1];
    if (seen.has(id)) err(where, `${id} duplicado`);
    seen.add(id);
    const applied = /^aplicada en:\s*(.*)$/m.exec(entry);
    if (!applied) {
      err(where, `${id} sin línea \`aplicada en:\``);
      continue;
    }
    const value = applied[1].trim();
    if (/^pendiente\s*$/.test(value)) err(where, `${id}: \`pendiente\` sin dueño`);
    if (/^pendiente/.test(value)) continue;
    const paths = [...value.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    if (paths.length === 0) err(where, `${id}: \`aplicada en:\` sin ruta entre comillas invertidas`);
    for (const p of paths) {
      const candidates = [join(dir, p), join(POSVEN, p), join(POSVEN, p.replace(/^posven\//, ''))];
      if (!WORKSPACE) candidates.push(join(dir, p.replace(new RegExp(`^(posven/)?(${[...REPOS, name].join('|')})/`), '')));
      if (!candidates.some((c) => existsSync(c))) err(where, `${id}: \`aplicada en:\` apunta a una ruta que no existe: ${p}`);
    }
    if (PRUNE) warn(where, `${id} promovida: candidata a poda si su aplicación sobrevivió el plan`);
  }
}

// Las reglas de un repo casan contra sus archivos; las de posven/.claude, contra rutas relativas a
// posven/ (los repos y .claude).
function checkRules(where, rulesDir, files) {
  for (const ruleRel of gitLs(rulesDir, '*.md')) {
    const fm = parseFrontmatter(readText(join(rulesDir, ruleRel)));
    const globs = Array.isArray(fm?.paths) ? fm.paths : [];
    if (globs.length === 0) {
      warn(`${where}/${ruleRel}`, 'regla sin `paths:`: se carga siempre o nunca');
      continue;
    }
    for (const g of globs) {
      const re = globToRegex(g);
      if (!files.some((f) => re.test(f))) warn(`${where}/${ruleRel}`, `el glob "${g}" no casa ningún archivo`);
    }
  }
}

function checkSizes(where, dir, files) {
  for (const rel of files) {
    const limit = LIMITS.find(([re]) => re.test(rel));
    if (!limit) continue;
    const n = readText(join(dir, rel)).split('\n').length;
    if (n > limit[1]) warn(`${where}/${rel}`, `${n} líneas (tope orientativo ${limit[1]})`);
  }
}

const PRUNE = process.argv.includes('--poda');
const targets = process.argv.slice(2).filter((a) => a !== '--poda');
const VALID = WORKSPACE ? [...REPOS, '.claude'] : REPO_NAMES;
const selected = targets.length ? targets : VALID;
for (const name of selected) {
  if (!VALID.includes(name)) {
    process.stderr.write(`objetivo desconocido: ${name}\n`);
    process.exit(2);
  }
}

const filesOf = new Map(REPO_NAMES.map((r) => [r, gitLs(repoDir(r))]));
const claudeFiles = WORKSPACE ? gitLs(repoDir('.claude')) : [];

for (const name of selected) {
  if (name === '.claude') {
    const rootView = [
      'CLAUDE.md',
      ...claudeFiles.map((f) => `.claude/${f}`),
      ...REPO_NAMES.flatMap((r) => filesOf.get(r).map((f) => `${r}/${f}`)),
    ];
    checkRules('.claude/rules', join(POSVEN, '.claude', 'rules'), rootView);
    checkSizes('.claude', repoDir('.claude'), claudeFiles);
    checkSizes('posven', POSVEN, ['CLAUDE.md']);
    continue;
  }
  const dir = repoDir(name);
  for (const readme of moduleReadmes(name)) checkReadme(name, dir, readme);
  checkLessons(name, dir);
  checkRules(`${name}/.claude/rules`, join(dir, '.claude', 'rules'), filesOf.get(name));
  checkSizes(name, dir, filesOf.get(name).filter((f) => f === 'CLAUDE.md' || f.startsWith('.claude/rules/')));
}

for (const line of [...errors, ...warnings]) process.stdout.write(`${line}\n`);
process.stdout.write(`\n${errors.length} error(es), ${warnings.length} aviso(s)\n`);
process.exit(errors.length ? 1 : 0);
