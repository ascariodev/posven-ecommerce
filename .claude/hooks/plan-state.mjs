#!/usr/bin/env node
// Hook SessionStart (startup, resume, compact, clear): imprime el estado del plan activo para que
// la sesión retome sin releer el plan entero. Lo que imprime por stdout entra al contexto.
// Plan activo = un `docs/plans/*.md` cuya línea `**Estado:**` dice "en curso". La raíz es
// CLAUDE_PROJECT_DIR o, sin ella, dos niveles sobre el script. Si contiene posveapi/, posvenapp/ o
// posven-ecommerce/ (espacio de trabajo) busca en los tres y en .claude/docs/plans; si no, es un
// repo suelto y busca sólo en su docs/plans (y .claude/docs/plans si existe).
// Sale siempre con 0: un fallo aquí nunca bloquea la sesión.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_NOTE_LINES = 30;

const posven = resolve(process.env.CLAUDE_PROJECT_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', '..'));
const repos = ['posveapi', 'posvenapp', 'posven-ecommerce'];
const workspace = repos.some((r) => existsSync(join(posven, r)));
const dirs = workspace
  ? [...repos.map((r) => join(posven, r, 'docs', 'plans')), join(posven, '.claude', 'docs', 'plans')]
  : [join(posven, 'docs', 'plans'), join(posven, '.claude', 'docs', 'plans')];

function plansIn(dir) {
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
      .map((f) => join(dir, f));
  } catch {
    return [];
  }
}

try {
  const active = [];
  for (const file of dirs.flatMap(plansIn)) {
    const text = readFileSync(file, 'utf8');
    const status = text.split('\n').find((l) => /^\*\*Estado:\*\*/i.test(l.trim()));
    if (status && /en curso/i.test(status)) active.push({ file, text, status: status.trim() });
  }

  const shown = (file) => relative(posven, file).replaceAll('\\', '/');
  const slug = (file) => file.split(/[\\/]/).pop().replace(/\.md$/, '');
  const out = [];
  if (active.length > 1) {
    out.push(`[plan-state] Hay ${active.length} planes en curso: ${active.map((a) => shown(a.file)).join(', ')}.`);
    out.push('Pregunta al usuario con cuál seguir antes de leer ninguno.');
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
  if (out.length) process.stdout.write(out.join('\n') + '\n');
} catch {
  // Planes ilegibles: no hay nada que reinyectar.
}
process.exit(0);
