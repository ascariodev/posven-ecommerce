#!/usr/bin/env node
// Hook PreToolUse: avisa cuando una escritura cae en el checkout principal de un repo git o en un
// árbol en HEAD desprendido. El trabajo va en un worktree propio (procedimiento y exención en la
// cabecera de <repo>/.claude/scripts/worktree.mjs; regla en .claude/CLAUDE.comun.md §2). No avisa
// en repos eximidos con `git config claude.mainCheckoutWrites true`, en archivos ignorados ni en
// comandos del script. Avisa por additionalContext y systemMessage; nunca bloquea.
// Con Bash sólo ve rutas absolutas escritas en el comando (C:/..., C:\... o /c/...).
// Si existe ~/.claude/hooks/check-worktree.mjs (hook de usuario), éste calla: los comandos
// difieren y Claude Code no los deduplica, así el aviso no sale dos veces.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const USER_HOOK = resolve(homedir(), '.claude', 'hooks', 'check-worktree.mjs');
if (existsSync(USER_HOOK) && USER_HOOK.toLowerCase() !== resolve(fileURLToPath(import.meta.url)).toLowerCase()) {
  process.exit(0);
}

const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const DISCARDED_OUTPUT = /[\d&]?>>?\s*(?:&\d+|\/dev\/null\b)/g;
const BASH_WRITE =/\b(?:sed\s+-i|perl\s+-pi|tee|cp|mv|rm|touch|mkdir|python3?|node)\b|>>?|git\s+(?:-C\s+(?:"[^"]*"|'[^']*'|\S+)\s+)?(?:checkout|switch|restore|apply|commit|add|stash|reset)\b/;

function words(segment) {
  const out = [];
  let current = '';
  let quote = null;
  let started = false;
  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"' && /["\\$`]/.test(segment[i + 1] ?? '')) current += segment[++i];
      else current += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      started = true;
      continue;
    }
    if (ch === '\\' && i + 1 < segment.length) {
      current += segment[++i];
      started = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (started) out.push(current);
      current = '';
      started = false;
      continue;
    }
    current += ch;
    started = true;
  }
  if (started) out.push(current);
  return out;
}

const isAbsolutePath = path => /^([a-zA-Z]:[\\/]|\/)/.test(path);

function toNativePath(path) {
  if (process.platform !== 'win32') return path;
  const drive = /^\/([a-zA-Z])(\/|$)/.exec(path);
  return drive ? `${drive[1].toUpperCase()}:/${path.slice(3)}` : path;
}

function candidates(tool, input) {
  if (tool === 'Bash') {
    if (typeof input.command !== 'string') return [];
    const command = input.command.replace(DISCARDED_OUTPUT, ' ');
    if (!BASH_WRITE.test(command) || /worktree\.mjs/.test(command)) return [];
    return words(command.replace(/[;&|()]/g, ' '))
      .map(w => w.replace(/^[^=]+=/, ''))
      .filter(isAbsolutePath)
      .map(toNativePath);
  }
  if (!WRITE_TOOLS.has(tool)) return [];
  const path = input.file_path ?? input.notebook_path;
  return typeof path === 'string' && isAbsolutePath(path) ? [path] : [];
}

const git = (dir, ...args) =>
  execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

function existingDir(path) {
  const full = resolve(path);
  let dir = existsSync(full) && statSync(full).isDirectory() ? full : dirname(full);
  while (!existsSync(dir) && dirname(dir) !== dir) dir = dirname(dir);
  return dir;
}

function misplacedWrite(paths) {
  for (const path of paths) {
    try {
      const dir = existingDir(path);
      const toplevel = git(dir, 'rev-parse', '--show-toplevel');
      if (git(dir, 'rev-parse', '--abbrev-ref', 'HEAD') === 'HEAD') {
        return `Escritura en un árbol en HEAD desprendido: ${toplevel} (${git(dir, 'rev-parse', '--short', 'HEAD')}). ` +
          'Ese cambio no termina en ninguna rama. Si es a propósito (el worktree temporal de un merge, ' +
          'una prueba que se revierte), sigue; esto avisa y no bloquea.';
      }
      if (!/[\\/]\.git$/.test(git(dir, 'rev-parse', '--absolute-git-dir'))) continue;
      if (spawnSync('git', ['-C', dir, 'config', '--bool', 'claude.mainCheckoutWrites'], { encoding: 'utf8' }).stdout.trim() === 'true') continue;
      if (spawnSync('git', ['-C', dir, 'check-ignore', '-q', resolve(path)], { stdio: 'ignore' }).status === 0) continue;
      return `Escritura en el checkout principal de ${toplevel}. El trabajo va en un worktree propio ` +
        '(node <repo>/.claude/scripts/worktree.mjs crear <repo> <tarea>) y el checkout principal sólo avanza con ' +
        'merge --ff-only. Si este repo se escribe directo, eximirlo con git config claude.mainCheckoutWrites true. ' +
        'Esto avisa y no bloquea.';
    } catch {
      // Fuera de un repo o directorio inexistente: nada que decir.
    }
  }
  return null;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

setTimeout(() => process.exit(0), 3000).unref();
try {
  const payload = JSON.parse((await readStdin()) || '{}');
  const notice = misplacedWrite(candidates(payload.tool_name, payload.tool_input ?? {}));
  if (notice) {
    process.stdout.write(
      JSON.stringify({ systemMessage: notice, hookSpecificOutput: { hookEventName: 'PreToolUse', additionalContext: notice } }),
    );
  }
} catch {
  // Nunca se interpone.
}
process.exitCode = 0;
