#!/usr/bin/env node
// Hook PostToolUse sobre Bash: una regla de .claude/rules/ con `paths:` sólo entra al contexto
// cuando Read abre un archivo que la dispara; leer con cat, sed, head, tail, nl o less no la carga.
// Este hook detecta esas lecturas, busca las reglas del árbol git dueño de cada archivo (un repo, o
// posven/.claude) o, si no, las de CLAUDE_PROJECT_DIR, y entrega su texto una vez por agente y por
// compactación. No depende de dónde esté el script.
// Avisa; no bloquea: cualquier fallo propio sale con 0 y sin salida.
//
// Uso: node .claude/hooks/rules-on-bash-read.mjs < carga.json
//      node .claude/hooks/rules-on-bash-read.mjs --self-test

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readStdin } from './hook-stdin.mjs';
import { splitSegments, toNativePath, words } from './lib/shell.mjs';

const SELF = fileURLToPath(import.meta.url);
const MAX_OUTPUT = 9000;
const READERS = new Set(['cat', 'head', 'tail', 'nl', 'less', 'sed', 'awk']);
const VALUED = {
  head: new Set(['-n', '-c', '--lines', '--bytes']),
  tail: new Set(['-n', '-c', '--lines', '--bytes']),
  nl: new Set(['-b', '-d', '-f', '-h', '-i', '-l', '-n', '-s', '-v', '-w']),
  less: new Set(['-p', '-x', '-y', '-z']),
  sed: new Set(['-e', '-f', '-l']),
  awk: new Set(['-F', '-v', '-f']),
};
const REDIRECT = /^(?:\d*|&)(?:>>?|<)(.*)$/;

function operandsOf(verb, args) {
  const valued = VALUED[verb] ?? new Set();
  const operands = [];
  let scriptSeen = verb !== 'sed' && verb !== 'awk';
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const redirect = REDIRECT.exec(arg);
    if (redirect) {
      if (!redirect[1]) i++;
      continue;
    }
    if (arg.startsWith('-') && arg !== '-') {
      if (valued.has(arg)) {
        if ((verb === 'sed' && arg === '-e') || (verb === 'awk' && arg === '-f')) scriptSeen = true;
        i++;
      }
      continue;
    }
    if (!scriptSeen) {
      scriptSeen = true;
      continue;
    }
    operands.push(arg);
  }
  return operands;
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

export function readTargets(command, cwd) {
  const vars = {};
  const targets = [];
  for (const segment of splitSegments(command)) {
    const tokens = words(segment);
    while (tokens.length && /^[A-Za-z_]\w*=/.test(tokens[0])) {
      const [name, ...value] = tokens.shift().split('=');
      vars[name] = value.join('=');
    }
    if (tokens[0] === 'sudo' || tokens[0] === 'command') tokens.shift();
    if (!tokens.length || !READERS.has(basename(tokens[0]))) continue;
    for (const raw of operandsOf(basename(tokens[0]), tokens.slice(1))) {
      const expanded = raw.replace(/\$\{?([A-Za-z_]\w*)\}?/g, (m, name) => vars[name] ?? m);
      if (expanded.includes('$')) continue;
      const native = toNativePath(expanded);
      const full = isAbsolute(native) ? native : resolve(cwd, native);
      if (isFile(full)) targets.push(full);
    }
  }
  return [...new Set(targets)];
}

export function globToRegExp(glob) {
  let source = '';
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') {
        source += '(?:.*/)?';
        i += 2;
      } else {
        source += '.*';
        i += 1;
      }
    } else if (ch === '*') source += '[^/]*';
    else if (ch === '?') source += '[^/]';
    else if (ch === '{') source += '(?:';
    else if (ch === '}') source += ')';
    else if (ch === ',') source += '|';
    else if ('.+^$()|[]\\'.includes(ch)) source += `\\${ch}`;
    else source += ch;
  }
  return new RegExp(`^${source}$`);
}

const unquote = value => value.trim().replace(/^(['"])(.*)\1$/, '$2');

export function parseRule(text) {
  const normalized = text.replace(/\r\n?/g, '\n');
  const match = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(normalized);
  if (!match) return null;
  const globs = [];
  const lines = match[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const key = /^paths:\s*(.*)$/.exec(lines[i]);
    if (!key) continue;
    const inline = key[1].trim();
    if (inline.startsWith('[')) inline.replace(/^\[|\]$/g, '').split(',').map(unquote).filter(Boolean).forEach(g => globs.push(g));
    else if (inline) globs.push(unquote(inline));
    else while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) globs.push(unquote(lines[++i].replace(/^\s*-\s+/, '')));
  }
  if (!globs.length) return null;
  const after = normalized.slice(match[0].length);
  const leading = /^\n*/.exec(after)[0].length;
  return {
    patterns: globs.map(globToRegExp),
    body: after.slice(leading).trimEnd(),
    bodyLine: match[0].split('\n').length + leading,
  };
}

function loadRules(root) {
  const dir = join(root, '.claude', 'rules');
  let names;
  try {
    names = readdirSync(dir).filter(n => n.endsWith('.md')).sort();
  } catch {
    return [];
  }
  return names.flatMap(name => {
    try {
      const rule = parseRule(readFileSync(join(dir, name), 'utf8'));
      return rule ? [{ name, ...rule }] : [];
    } catch {
      return [];
    }
  });
}

function toplevel(dir) {
  try {
    const out = execFileSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return realpathSync.native(toNativePath(out));
  } catch {
    return null;
  }
}

// La raíz de reglas de un archivo: el árbol git que lo contiene (cada worktree tiene la suya).
// Fuera de todo repo, o dentro de posven/.claude, manda el directorio del proyecto.
export function governedReads(command, cwd, projectDir) {
  const governed = [];
  const cache = new Map();
  for (const target of readTargets(command, cwd)) {
    const physical = realpathSync.native(target);
    const roots = [toplevel(dirname(physical)), projectDir].filter(Boolean);
    for (const root of new Set(roots)) {
      const rel = relative(root, physical);
      if (!rel || rel.startsWith('..') || isAbsolute(rel)) continue;
      if (!cache.has(root)) cache.set(root, loadRules(root));
      const posix = rel.split(sep).join('/');
      for (const rule of cache.get(root)) {
        if (governed.some(g => g.root === root && g.rule.name === rule.name)) continue;
        if (rule.patterns.some(p => p.test(posix))) {
          governed.push({ file: physical.split(sep).join('/'), rule, root, rulePath: join(root, '.claude', 'rules', rule.name).split(sep).join('/') });
        }
      }
    }
  }
  return governed;
}

function countCompactions(transcript) {
  try {
    return readFileSync(transcript, 'utf8').split('"subtype":"compact_boundary"').length - 1;
  } catch {
    return 0;
  }
}

function ownTranscript(payload) {
  const parent = payload.transcript_path;
  if (typeof parent !== 'string' || !parent) return null;
  if (!payload.agent_id) return parent;
  return join(dirname(parent), payload.session_id ?? basename(parent, '.jsonl'), 'subagents', `agent-${payload.agent_id}.jsonl`);
}

function claim(stateDir, key, root, rule) {
  const id = createHash('sha256').update(`${key}\0${root}\0${rule}`).digest('hex').slice(0, 32);
  try {
    writeFileSync(join(stateDir, `${id}.json`), JSON.stringify({ key, root, rule, at: new Date().toISOString() }), { flag: 'wx' });
    return true;
  } catch {
    return false;
  }
}

export function fitRule(file, rule, budget, rulePath) {
  const head = `\`${file}\` lo gobierna \`${rulePath}\`; leerlo por Bash no carga la regla. Este es su texto:`;
  const full = `${head}\n\n${rule.body}`;
  if (full.length <= budget) return full;
  const lines = rule.body.split('\n');
  const cuts = [];
  let offset = 0;
  lines.forEach((line, index) => {
    if (index > 0 && /^#{2,3} /.test(line)) cuts.push({ index, offset });
    offset += line.length + 1;
  });
  const pointer = line => `[Sigue en ${rulePath} desde la línea ${line}: léelo con Read.]`;
  for (const cut of cuts.reverse()) {
    const text = `${head}\n\n${rule.body.slice(0, cut.offset).trimEnd()}\n\n${pointer(rule.bodyLine + cut.index)}`;
    if (text.length <= budget) return text;
  }
  const bare = `${head}\n\n${pointer(rule.bodyLine)}`;
  return bare.length <= budget ? bare : null;
}

export function contextFor(payload, stateDir, projectDir) {
  if (payload?.tool_name !== 'Bash') return '';
  const command = payload.tool_input?.command;
  if (typeof command !== 'string' || !command) return '';
  const cwd = typeof payload.cwd === 'string' ? payload.cwd : process.cwd();
  const governed = governedReads(command, cwd, projectDir);
  if (!governed.length) return '';
  mkdirSync(stateDir, { recursive: true });
  const transcript = ownTranscript(payload);
  const key = `${payload.session_id ?? 'unknown'}:${payload.agent_id ?? 'main'}#${transcript ? countCompactions(transcript) : 0}`;
  const parts = [];
  let used = 0;
  for (const { file, rule, root, rulePath } of governed) {
    const text = fitRule(file, rule, MAX_OUTPUT - used - 2, rulePath);
    if (text === null) break;
    if (!claim(stateDir, key, root, rule.name)) continue;
    parts.push(text);
    used += text.length + 2;
  }
  return parts.join('\n\n');
}

const stateDir = () => process.env.RULES_HOOK_STATE_DIR || join(tmpdir(), 'claude-rules-on-bash-read');
const projectDir = () => {
  const dir = process.env.CLAUDE_PROJECT_DIR;
  return dir && existsSync(dir) ? realpathSync.native(dir) : null;
};

function selfTest() {
  const base = realpathSync.native(mkdtempSync(join(tmpdir(), 'rules-hook-')));
  const failures = [];
  const check = (title, ok) => {
    console.log(`self-test: ${ok ? 'ok   ' : 'FALLA'} ${title}`);
    if (!ok) failures.push(title);
  };
  try {
    const repo = join(base, 'mi repo');
    mkdirSync(join(repo, '.claude', 'rules'), { recursive: true });
    mkdirSync(join(repo, 'app', 'Actions'), { recursive: true });
    writeFileSync(join(repo, '.claude', 'rules', 'actions.md'), '---\npaths:\n  - "app/Actions/**/*.php"\n---\n\n# Regla de acciones\n\nTexto.\n');
    writeFileSync(join(repo, 'app', 'Actions', 'Foo.php'), '<?php\n');
    writeFileSync(join(repo, 'otro.txt'), 'x\n');
    execFileSync('git', ['init', '-q', repo], { stdio: 'ignore' });
    const state = join(base, 'state');
    const run = command => {
      const r = spawnSync(process.execPath, [SELF], {
        input: JSON.stringify({ tool_name: 'Bash', tool_input: { command }, cwd: base, session_id: 's1' }),
        encoding: 'utf8',
        env: { ...process.env, RULES_HOOK_STATE_DIR: state, CLAUDE_PROJECT_DIR: '' },
      });
      try {
        return JSON.parse(r.stdout).hookSpecificOutput.additionalContext;
      } catch {
        return '';
      }
    };
    const file = join(repo, 'app', 'Actions', 'Foo.php').split(sep).join('/');
    check('sed -n con ruta entre comillas y espacios entrega la regla', run(`sed -n 1,5p "${file}"`).includes('Regla de acciones'));
    check('la segunda lectura no repite la regla', run(`cat "${file}"`) === '');
    check('un archivo sin regla calla', run(`cat "${join(repo, 'otro.txt').split(sep).join('/')}"`) === '');
    if (process.platform === 'win32') {
      const gitBash = '/' + file[0].toLowerCase() + file.slice(2);
      rmSync(state, { recursive: true, force: true });
      check('ruta /c/ de Git Bash con variable', run(`F="${gitBash}"; head -20 "$F"`).includes('Regla de acciones'));
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
  console.log(`self-test: ${failures.length} fallas.`);
  process.exit(failures.length ? 1 : 0);
}

const isEntryPoint = process.argv[1] !== undefined && realpathSync.native(process.argv[1]) === realpathSync.native(SELF);
if (isEntryPoint) {
  if (process.argv.includes('--self-test')) selfTest();
  else {
    try {
      const context = contextFor(JSON.parse((await readStdin()) || '{}'), stateDir(), projectDir());
      if (context) process.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context } })}\n`);
    } catch {
      // Un hook roto nunca interfiere con la herramienta.
    }
    process.exitCode = 0;
  }
}
