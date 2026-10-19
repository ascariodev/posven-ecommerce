#!/usr/bin/env node
// worktree.mjs: cada tarea va en un worktree propio que se elimina al terminar. El checkout
// principal de un repo no se edita ni se commitea, porque lo comparten las sesiones en paralelo y
// de él sale el grafo; sólo avanza con merge --ff-only. Un repo que se escribe directo (config,
// planes) se exime con `git -C <repo> config claude.mainCheckoutWrites true`; el hook
// <repo>/.claude/hooks/check-worktree.mjs avisa al escribir en un checkout principal no eximido.
// Regla en .claude/CLAUDE.comun.md §2.
//
// Uso: node <repo>/.claude/scripts/worktree.mjs <orden> ...
//   crear <repo> <tarea> [--rama <rama>] [--desde <ref>]
//       Crea <repo>/.claude/worktrees/<tarea> en <rama> (por omisión feat/<tarea>; nueva desde
//       <ref>, por omisión la rama del checkout principal, que es la base). Si el checkout principal
//       tiene node_modules, lo enlaza como junction. Excluye .claude/worktrees/ en .git/info/exclude.
//   merge <repo> <rama> [--no-verify]
//       Trae el remoto de la base y adelanta el checkout principal si quedó atrás; luego crea el
//       worktree temporal desprendido .claude/worktrees/merge-<tarea> en la base y hace
//       merge --no-ff <rama>. Con conflictos se detiene: se resuelven y commitean en ese árbol.
//       La verificación del repo se corre en ese árbol antes de publicar.
//   publicar <repo> <rama> [--push] [--no-verify]
//       Con --push sube el merge a la base en cada remoto que la tiene. Adelanta el checkout
//       principal con --ff-only y elimina el temporal.
//   cerrar <repo> <tarea> [--descartar]
//       Quita la junction de node_modules (el enlace, no el destino), el worktree y la rama
//       (branch -d). Se niega con cambios sin commit, y si la rama no está en la base salvo con
//       --descartar (branch -D), que sólo se usa cuando el usuario descarta la tarea.
//   listar [repo]
//       Worktrees del repo con rama, cambios sin commit y si ya están en la base.
// <repo> es cualquier ruta dentro del repo o de uno de sus worktrees. Push, merge y --no-verify
// sólo con pedido explícito del usuario. Nunca se cierra el worktree de otra sesión.

import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, lstatSync, mkdirSync, unlinkSync, symlinkSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';

const git = (dir, ...args) =>
  execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const tryGit = (dir, ...args) => {
  try {
    return git(dir, ...args);
  } catch {
    return null;
  }
};
const run = (dir, ...args) => spawnSync('git', ['-C', dir, ...args], { stdio: 'inherit' }).status === 0;
const quiet = (dir, ...args) => spawnSync('git', ['-C', dir, ...args], { stdio: 'ignore' }).status === 0;
const isAncestor = (dir, a, b) => quiet(dir, 'merge-base', '--is-ancestor', a, b);

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) positional.push(arg);
    else if (['--rama', '--desde'].includes(arg)) flags[arg.slice(2)] = argv[++i];
    else flags[arg.slice(2)] = true;
  }
  return { positional, flags };
}

function repoOf(path) {
  let dir = resolve(path ?? '.');
  while (!existsSync(dir) && dirname(dir) !== dir) dir = dirname(dir);
  const common = tryGit(dir, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  if (!common) fail(`${path} no está dentro de un repo git.`);
  if (basename(common) !== '.git') fail(`${common} no es el .git de un checkout principal.`);
  const main = dirname(resolve(common));
  const base = tryGit(main, 'symbolic-ref', '--short', 'HEAD');
  if (!base) fail(`El checkout principal ${main} está en HEAD desprendido: la base no se puede inferir.`);
  return { main, common: resolve(common), base };
}

function taskName(name) {
  if (!name || !/^[\w.-]+$/.test(name)) fail(`Nombre de tarea inválido: "${name ?? ''}" (letras, números, . _ -).`);
  return name;
}

const treePath = (main, task) => join(main, '.claude', 'worktrees', task);
const mergeTree = (main, branch) => treePath(main, `merge-${taskName(branch.split('/').pop())}`);

function excludeWorktrees({ main, common }) {
  if (quiet(main, 'check-ignore', '-q', '.claude/worktrees/x')) return;
  mkdirSync(join(common, 'info'), { recursive: true });
  appendFileSync(join(common, 'info', 'exclude'), '\n/.claude/worktrees/\n');
}

function linkNodeModules(main, tree) {
  const source = join(main, 'node_modules');
  const link = join(tree, 'node_modules');
  if (existsSync(source) && !existsSync(link)) symlinkSync(source, link, 'junction');
}

function unlinkNodeModules(tree) {
  const link = join(tree, 'node_modules');
  try {
    if (lstatSync(link).isSymbolicLink()) unlinkSync(link);
  } catch {
    // Sin node_modules enlazado.
  }
}

function dirty(tree) {
  return git(tree, 'status', '--porcelain')
    .split('\n')
    .filter(line => line && !/^\?\? node_modules\/?$/.test(line));
}

function removeTree(main, tree) {
  unlinkNodeModules(tree);
  if (!run(main, 'worktree', 'remove', tree)) fail(`No se pudo eliminar ${tree}.`);
}

function syncBase({ main, base }) {
  const upstream = tryGit(main, 'rev-parse', '--abbrev-ref', `${base}@{u}`);
  if (!upstream) return;
  const remote = upstream.split('/')[0];
  if (!quiet(main, 'fetch', remote)) console.warn(`No se pudo traer ${remote}; se sigue con lo local.`);
  if (git(main, 'rev-list', '--count', `${base}..${upstream}`) === '0') return;
  if (!run(main, 'merge', '--ff-only', upstream)) {
    fail(`${base} quedó atrás de ${upstream} y el checkout principal no avanza con --ff-only; resuélvelo antes del merge.`);
  }
}

function crear(repo, task, flags) {
  const tree = treePath(repo.main, taskName(task));
  if (existsSync(tree)) fail(`Ya existe ${tree}: es de esta tarea o de otra sesión; no se toca.`);
  const branch = flags.rama ?? `feat/${task}`;
  const from = flags.desde ?? repo.base;
  excludeWorktrees(repo);
  const exists = quiet(repo.main, 'rev-parse', '--verify', '--quiet', `refs/heads/${branch}`);
  const args = exists ? ['worktree', 'add', tree, branch] : ['worktree', 'add', '-b', branch, tree, from];
  if (!run(repo.main, ...args)) fail('No se pudo crear el worktree.');
  linkNodeModules(repo.main, tree);
  console.log(`Árbol: ${tree}\nRama: ${branch}${exists ? ' (existente)' : ` (nueva desde ${from})`}\nBase: ${repo.base}`);
}

function merge(repo, branch, flags) {
  if (!quiet(repo.main, 'rev-parse', '--verify', '--quiet', `refs/heads/${branch}`)) fail(`No existe la rama ${branch}.`);
  const tmp = mergeTree(repo.main, branch);
  if (existsSync(tmp)) fail(`Ya hay un merge en curso en ${tmp}: termínalo con publicar o elimínalo.`);
  syncBase(repo);
  excludeWorktrees(repo);
  if (!run(repo.main, 'worktree', 'add', '--detach', tmp, repo.base)) fail('No se pudo crear el worktree temporal.');
  linkNodeModules(repo.main, tmp);
  const verify = flags['no-verify'] ? ['--no-verify'] : [];
  if (!run(tmp, 'merge', '--no-ff', ...verify, '-m', `Merge branch '${branch}' into ${repo.base}`, branch)) {
    const conflicts = tryGit(tmp, 'diff', '--name-only', '--diff-filter=U') || '(ninguno listado)';
    fail(`Conflictos en ${tmp}:\n${conflicts}\nResuélvelos ahí, commitea y sigue con publicar.`);
  }
  console.log(`Merge listo en ${tmp} (${git(tmp, 'rev-parse', '--short', 'HEAD')}).\nVerifica en ese árbol y sigue con publicar.`);
}

function publicar(repo, branch, flags) {
  const tmp = mergeTree(repo.main, branch);
  if (!existsSync(tmp)) fail(`No hay merge en curso en ${tmp}.`);
  if (quiet(tmp, 'rev-parse', '-q', '--verify', 'MERGE_HEAD') || dirty(tmp).length) {
    fail(`El merge de ${tmp} no está terminado o tiene cambios sin commit.`);
  }
  const head = git(tmp, 'rev-parse', 'HEAD');
  if (!isAncestor(tmp, branch, head)) fail(`${branch} no está en el HEAD de ${tmp}.`);
  if (!isAncestor(tmp, repo.base, head)) fail(`${repo.base} avanzó desde el merge: rehazlo.`);
  if (flags.push) {
    const remotes = git(repo.main, 'remote')
      .split('\n')
      .filter(r => r && quiet(repo.main, 'rev-parse', '--verify', '--quiet', `refs/remotes/${r}/${repo.base}`));
    if (!remotes.length) fail(`Ningún remoto tiene ${repo.base}.`);
    const verify = flags['no-verify'] ? ['--no-verify'] : [];
    const failed = remotes.filter(r => !run(tmp, 'push', ...verify, r, `HEAD:refs/heads/${repo.base}`));
    if (failed.length) fail(`Falló el push a ${failed.join(', ')}; el temporal queda para reintentar publicar --push.`);
  }
  if (!run(repo.main, 'merge', '--ff-only', head)) fail(`El checkout principal no avanzó con --ff-only; ${tmp} queda.`);
  removeTree(repo.main, tmp);
  console.log(`${repo.base} en ${head.slice(0, 9)}${flags.push ? ', subido' : ', sin push'}. Temporal eliminado.`);
}

function cerrar(repo, task, flags) {
  const tree = treePath(repo.main, taskName(task));
  if (!existsSync(tree)) fail(`No existe ${tree}.`);
  const pending = dirty(tree);
  if (pending.length) fail(`${tree} tiene cambios sin commit; no se elimina:\n${pending.join('\n')}`);
  const branch = tryGit(tree, 'symbolic-ref', '--short', 'HEAD');
  if (branch && !flags.descartar && !isAncestor(repo.main, branch, repo.base)) {
    fail(`${branch} no está en ${repo.base}. Si el usuario descarta la tarea, cerrar con --descartar.`);
  }
  removeTree(repo.main, tree);
  if (branch && !run(repo.main, 'branch', flags.descartar ? '-D' : '-d', branch)) fail(`Worktree eliminado; la rama ${branch} quedó.`);
  console.log(`Eliminados ${tree}${branch ? ` y la rama ${branch}` : ''}.`);
}

function listar(repo) {
  const blocks = git(repo.main, 'worktree', 'list', '--porcelain').split(/\n\n/).filter(Boolean);
  for (const block of blocks) {
    const path = /^worktree (.+)$/m.exec(block)?.[1];
    const branch = /^branch refs\/heads\/(.+)$/m.exec(block)?.[1] ?? '(desprendido)';
    if (!path || !existsSync(path)) {
      console.log(`${path}  ${branch}  (no existe; git worktree prune)`);
      continue;
    }
    const state = [
      resolve(path) === repo.main ? 'principal' : null,
      dirty(path).length ? 'con cambios' : 'limpio',
      branch !== '(desprendido)' && branch !== repo.base && isAncestor(repo.main, branch, repo.base) ? `en ${repo.base}` : null,
    ].filter(Boolean);
    console.log(`${path}  ${branch}  ${state.join(', ')}`);
  }
}

const [command, ...rest] = process.argv.slice(2);
const { positional, flags } = parseArgs(rest);
const usage = 'Uso: worktree.mjs crear|merge|publicar|cerrar|listar <repo> ... (ver la cabecera del script).';
const need = n => positional.length >= n || fail(usage);

switch (command) {
  case 'crear':
    need(2) && crear(repoOf(positional[0]), positional[1], flags);
    break;
  case 'merge':
    need(2) && merge(repoOf(positional[0]), positional[1], flags);
    break;
  case 'publicar':
    need(2) && publicar(repoOf(positional[0]), positional[1], flags);
    break;
  case 'cerrar':
    need(2) && cerrar(repoOf(positional[0]), positional[1], flags);
    break;
  case 'listar':
    listar(repoOf(positional[0]));
    break;
  default:
    fail(usage);
}
