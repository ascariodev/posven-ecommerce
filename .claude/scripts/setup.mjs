#!/usr/bin/env node
// setup.mjs: comprueba que un clon tiene lo necesario para trabajar con Claude Code y dice qué
// falta. No instala ni escribe nada. Se sincroniza a cada repo desde posven/.claude.
//
// Uso: node .claude/scripts/setup.mjs
//   Una línea por chequeo (OK o FALTA): Node >= 20, git, graphify en el PATH, grafo del repo en
//   <padre>/.graphify-workspace/<repo>/graphify-out/graph.json, .claude/sync.lock.json y
//   .claude/settings.json con JSON válido. Sale 0 si todo está y 1 si falta algo. El repo se
//   detecta como en scripts/lib/common.mjs (CLAUDE_PROJECT_DIR o la carpeta sobre .claude/).
//   Cómo resolver cada falta: .claude/README.md.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { POSVEN, REPO_NAMES, WORKSPACE } from './lib/common.mjs';

const MIN_NODE = 20;
const results = [];
const check = (nombre, ok, detalle) => results.push({ nombre, ok, detalle });

const version = (cmd, ...args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  return r.status === 0 ? (r.stdout || r.stderr).trim().split('\n')[0] : null;
};

const nodeMajor = Number(process.versions.node.split('.')[0]);
check('node', nodeMajor >= MIN_NODE, nodeMajor >= MIN_NODE ? `v${process.versions.node}` : `v${process.versions.node}, se necesita ${MIN_NODE} o superior`);

const gitVersion = version('git', '--version');
check('git', !!gitVersion, gitVersion ?? 'no está en el PATH');

const graphifyVersion = version('graphify', '--help');
check('graphify', !!graphifyVersion, graphifyVersion ? 'en el PATH' : 'no está en el PATH: pip install graphifyy');

const mainCheckout = () => {
  const r = spawnSync('git', ['-C', POSVEN, 'rev-parse', '--path-format=absolute', '--git-common-dir'], { encoding: 'utf8' });
  const common = r.status === 0 ? r.stdout.trim() : '';
  return common ? dirname(resolve(common)) : POSVEN;
};
const workspaceDir = WORKSPACE ? POSVEN : dirname(mainCheckout());
for (const repo of REPO_NAMES) {
  const graph = join(workspaceDir, '.graphify-workspace', repo, 'graphify-out', 'graph.json');
  check(`grafo ${repo}`, existsSync(graph), existsSync(graph) ? graph : `falta ${graph}: ver "Generar el grafo" en .claude/README.md`);
}

const claudeDir = join(POSVEN, '.claude');
if (!WORKSPACE) {
  const lock = join(claudeDir, 'sync.lock.json');
  check('sync.lock.json', existsSync(lock), existsSync(lock) ? 'presente' : `falta ${lock}: lo escribe sync-repos.mjs`);
}

const settings = join(claudeDir, 'settings.json');
if (!existsSync(settings)) {
  check('settings.json', false, `falta ${settings}`);
} else {
  try {
    JSON.parse(readFileSync(settings, 'utf8'));
    check('settings.json', true, 'JSON válido');
  } catch (e) {
    check('settings.json', false, `JSON inválido: ${e.message}`);
  }
}

for (const r of results) console.log(`${r.ok ? 'OK   ' : 'FALTA'} ${r.nombre}: ${r.detalle}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
