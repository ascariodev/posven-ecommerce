#!/usr/bin/env node
// Regenera <repo>/docs/CAPABILITIES.md desde el frontmatter `capabilities` de los README de
// módulo (contrato: .claude/docs/conventions/module-readme.md). Emisión pura: mismo árbol,
// mismos bytes. Con --check no escribe y sale 1 si el archivo está desactualizado.
//
// Uso: node generate-index.mjs <posveapi|posvenapp|posven-ecommerce> [--check]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { REPO_NAMES, moduleReadmes, repoDir } from './lib/common.mjs';

const cell = (v) => String(Array.isArray(v) ? v.join(', ') : v ?? '').replace(/\|/g, '\\|');

export function render(name, readmes) {
  const out = [
    `# Capacidades de ${name}`,
    '',
    'Generado por `node .claude/scripts/generate-index.mjs ' + name + '`: no se edita a mano.',
    'Se regenera y commitea junto con todo cambio al frontmatter `capabilities` de un README.',
    '',
  ];
  if (readmes.length === 0) out.push('Ningún README de módulo con frontmatter todavía.', '');
  for (const { rel, fm } of readmes) {
    out.push(`## ${fm.module}`, '', `README: \`${rel}\``, '');
    const caps = Array.isArray(fm.capabilities) ? fm.capabilities.filter((c) => typeof c === 'object') : [];
    if (caps.length === 0) {
      out.push('Sin capacidades declaradas.', '');
      continue;
    }
    out.push('| Intención | Entrada | Archivo | Reglas |', '|---|---|---|---|');
    for (const c of caps) {
      out.push(`| ${cell(c.intent)} | \`${cell(c.entrypoint)}\` | \`${cell(c.file)}\` | ${cell(c.rules)} |`);
    }
    out.push('');
  }
  return out.join('\n');
}

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--'));
if (!REPO_NAMES.includes(name)) {
  process.stderr.write('uso: generate-index <posveapi|posvenapp|posven-ecommerce> [--check]\n');
  process.exit(2);
}
const target = join(repoDir(name), 'docs', 'CAPABILITIES.md');
const text = render(name, moduleReadmes(name));
if (args.includes('--check')) {
  const current = existsSync(target) ? readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : null;
  if (current !== text) {
    process.stdout.write(`desactualizado: ${target}\n`);
    process.exit(1);
  }
  process.stdout.write(`al día: ${target}\n`);
} else {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, text);
  process.stdout.write(`escrito: ${target}\n`);
}
