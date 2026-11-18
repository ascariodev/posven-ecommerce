#!/usr/bin/env node
// Hook SessionStart (startup, resume, compact, clear): imprime el estado del plan activo para que
// la sesión retome sin releer el plan entero. Lo que imprime por stdout entra al contexto.
// Plan activo = un `docs/plans/*.md` cuya línea `**Estado:**` dice "en curso". La raíz es
// CLAUDE_PROJECT_DIR o, sin ella, dos niveles sobre el script. Si contiene posveapi/, posvenapp/ o
// posven-ecommerce/ (espacio de trabajo) busca en los tres y en .claude/docs/plans; si no, es un
// repo suelto y busca sólo en su docs/plans (y .claude/docs/plans si existe). En ambos casos mira
// también docs/plans de cada worktree de `.claude/worktrees/`. De un plan con copias en varios
// árboles vale la tocada por última vez (su último commit, o la fecha del archivo si tiene cambios
// sin commit), contando las de `terminados/`. Un plan sin cambios hace más de STALE_DAYS días se
// lista aparte, y con varios en curso no se ordena preguntar: el hook también corre tras
// compactar, en medio de una tarea que puede no ser de ningún plan.
// De `terminados/` lista los de Estado "pantalla pendiente" (regla plan-cobertura); con copias en
// varios árboles vale la del checkout principal.
// Sale siempre con 0: un fallo aquí nunca bloquea la sesión.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_NOTE_LINES = 30;

const posven = resolve(process.env.CLAUDE_PROJECT_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const repos = ['posveapi', 'posvenapp', 'posven-ecommerce'];
const workspace = repos.some((r) => existsSync(join(posven, r)));
const STALE_DAYS = 7;

// Un plan recién planificado vive en el worktree de su tarea hasta el merge; los temporales
// `merge-*` no llevan planes propios.
function worktreePlanDirs(repoDir) {
  const root = join(repoDir, '.claude', 'worktrees');
  try {
    return readdirSync(root)
      .filter((name) => !name.startsWith('merge-'))
      .map((name) => join(root, name, 'docs', 'plans'));
  } catch {
    return [];
  }
}

const repoDirs = workspace ? repos.map((r) => join(posven, r)) : [posven];
const dirs = [
  ...repoDirs.map((d) => join(d, 'docs', 'plans')),
  join(posven, '.claude', 'docs', 'plans'),
  ...repoDirs.flatMap(worktreePlanDirs),
];

function plansIn(dir) {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

function git(dir, args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

function touchedMs(file) {
  const dir = dirname(file);
  const name = file.split(/[\\/]/).pop();
  const pending = git(dir, ['status', '--porcelain', '--', name]);
  const committed = pending === '' ? git(dir, ['log', '-1', '--format=%ct', '--', name]) : null;
  return committed ? Number(committed) * 1000 : statSync(file).mtimeMs;
}

const statusOf = (text) => text.split('\n').find((l) => /^\*\*Estado:\*\*/i.test(l.trim()));

try {
  const shown = (file) => relative(posven, file).replaceAll('\\', '/');
  const slug = (file) => file.split(/[\\/]/).pop().replace(/\.md$/, '');

  const candidates = new Map();
  for (const file of dirs.flatMap(plansIn)) {
    const status = statusOf(readFileSync(file, 'utf8'));
    if (status && /en curso/i.test(status) && !candidates.has(slug(file))) candidates.set(slug(file), file);
  }

  const active = [];
  const stale = [];
  for (const name of candidates.keys()) {
    const copies = dirs
      .flatMap((d) => [join(d, `${name}.md`), join(d, 'terminados', `${name}.md`)])
      .filter(existsSync)
      .map((file) => ({ file, touched: touchedMs(file) }));
    const latest = copies.reduce((a, b) => (b.touched > a.touched ? b : a));
    const text = readFileSync(latest.file, 'utf8');
    const status = statusOf(text);
    if (!status || !/en curso/i.test(status)) continue;
    const days = Math.floor((Date.now() - latest.touched) / 86_400_000);
    (days > STALE_DAYS ? stale : active).push({ file: latest.file, text, status: status.trim(), days });
  }

  const out = [];
  if (active.length > 1) {
    out.push(`[plan-state] Planes en curso: ${active.map((a) => shown(a.file)).join(', ')}.`);
    out.push('Si el usuario pide seguir un plan sin nombrarlo, pregunta cuál; si pide otra cosa, no leas ninguno.');
  } else if (active.length === 1) {
    const { file, text, status } = active[0];
    const lines = text.split('\n');
    const next = lines.find((l) => /^###\s*\[ \]/.test(l));
    const start = lines.findIndex((l) => /^##\s*Notas para la próxima sesión/i.test(l));
    let notes = [];
    if (start >= 0) {
      for (const l of lines.slice(start + 1)) {
        if (/^##\s/.test(l)) break;
        notes.push(l);
      }
      notes = notes.filter((l) => l.trim() && l.trim() !== '-' && !l.trim().startsWith('<!--')).slice(0, MAX_NOTE_LINES);
    }
    out.push(`[plan-state] Plan activo: ${workspace ? 'posven/' : ''}${shown(file)}`);
    out.push(status);
    if (next) out.push(`Siguiente fase pendiente: ${next.replace(/^###\s*\[ \]\s*/, '')}`);
    if (notes.length) out.push('Notas para la próxima sesión:', ...notes);
    out.push(`Para continuar: /siguiente-fase ${slug(file)} (o /ejecutar-plan ${slug(file)})`);
  }
  if (stale.length) {
    out.push(
      `[plan-state] En curso sin cambios hace más de ${STALE_DAYS} días (cerrar o retomar; no se leen sin pedido): ` +
        stale.map((s) => `${shown(s.file)} (${s.days} d)`).join(', ') + '.',
    );
  }
  const settled = new Set();
  const screenPending = [];
  for (const file of dirs.flatMap((d) => plansIn(join(d, 'terminados')))) {
    if (settled.has(slug(file))) continue;
    settled.add(slug(file));
    const status = statusOf(readFileSync(file, 'utf8'));
    if (status && /pantalla pendiente/i.test(status)) screenPending.push(file);
  }
  if (screenPending.length) {
    out.push(`[plan-state] Terminados con la fase [pantalla] sin correr: ${screenPending.map(shown).join(', ')}.`);
  }
  if (out.length) process.stdout.write(out.join('\n') + '\n');
} catch {
  // Planes ilegibles: no hay nada que reinyectar.
}
process.exit(0);
