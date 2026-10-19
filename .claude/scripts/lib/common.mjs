// Lo que comparten generate-index, census y docs-check: raíz, listado de archivos por git, globs
// de reglas y un parser del subconjunto de YAML que usan los frontmatter de README y de reglas. Un
// solo parser para que dos scripts no lean distinto el mismo archivo.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Raíz: CLAUDE_PROJECT_DIR o dos niveles sobre scripts/. Si contiene los repos es el espacio de
// trabajo (posven/); si no, un repo suelto, cuyo nombre sale de un archivo propio de cada repo
// para que un worktree con otro nombre de carpeta se reconozca.
export const POSVEN = resolve(process.env.CLAUDE_PROJECT_DIR || join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..'));
export const REPOS = ['posveapi', 'posvenapp', 'posven-ecommerce'];
export const WORKSPACE = REPOS.some((r) => existsSync(join(POSVEN, r)));
const MARKERS = [['posveapi', 'artisan'], ['posven-ecommerce', 'next.config.ts'], ['posvenapp', 'app.json']];
const LOOSE_NAME = WORKSPACE ? null : (MARKERS.find(([, m]) => existsSync(join(POSVEN, m)))?.[0] ?? basename(POSVEN));
export const REPO_NAMES = WORKSPACE ? REPOS : [LOOSE_NAME];

export function repoDir(name) {
  if (name === '.claude') return join(POSVEN, '.claude');
  if (!WORKSPACE && name === LOOSE_NAME) return POSVEN;
  const dir = join(POSVEN, name);
  if (!existsSync(dir)) throw new Error(`no existe el repo: ${dir}`);
  return dir;
}

// Versionados y nuevos no ignorados: lo recién escrito también cuenta.
export function gitLs(dir, ...pathspecs) {
  try {
    return execFileSync('git', ['-C', dir, 'ls-files', '--cached', '--others', '--exclude-standard', '--', ...pathspecs], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    }).split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

export function lastCommitTime(dir, path) {
  try {
    const out = execFileSync('git', ['-C', dir, 'log', '-1', '--format=%ct', '--', path], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out ? Number(out) : null;
  } catch {
    return null;
  }
}

export function globToRegex(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') {
        re += '(?:.*/)?';
        i += 2;
      } else {
        re += '.*';
        i += 1;
      }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

export function readText(path) {
  return readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
}

function scalar(raw) {
  const v = raw.replace(/\s+#.*$/, '').trim();
  if (v === '') return '';
  if (v.startsWith('[')) {
    const inner = v.replace(/^\[/, '').replace(/\]$/, '').trim();
    return inner === '' ? [] : inner.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((s) => scalar(s));
  }
  const q = /^"(.*)"$/.exec(v) ?? /^'(.*)'$/.exec(v);
  return q ? q[1] : v;
}

// Subconjunto: `clave: valor`, `clave: [a, b]`, listas de escalares con `- x` y listas de mapas
// de un nivel con `- clave: valor` seguidas de claves indentadas. Devuelve null sin frontmatter.
export function parseFrontmatter(text) {
  const lines = text.split('\n');
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const data = {};
  let key = null;
  let item = null;
  for (const line of lines.slice(1, end)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const top = /^([A-Za-z_][\w-]*):(.*)$/.exec(line);
    if (top) {
      key = top[1];
      item = null;
      const v = top[2].trim();
      data[key] = v === '' ? [] : scalar(v);
      continue;
    }
    const listMap = /^\s+-\s+([A-Za-z_][\w-]*):(.*)$/.exec(line);
    if (listMap && key) {
      item = { [listMap[1]]: scalar(listMap[2]) };
      data[key].push(item);
      continue;
    }
    const listScalar = /^\s+-\s+(.*)$/.exec(line);
    if (listScalar && key) {
      data[key].push(scalar(listScalar[1]));
      item = null;
      continue;
    }
    const nested = /^\s+([A-Za-z_][\w-]*):(.*)$/.exec(line);
    if (nested && item) item[nested[1]] = scalar(nested[2]);
  }
  return data;
}

export function sections(text) {
  const out = new Map();
  let current = null;
  let fence = false;
  for (const line of text.split('\n')) {
    if (/^(```|~~~)/.test(line)) fence = !fence;
    const h = !fence && /^## (\d+)\.\s*(.*)$/.exec(line);
    if (h) {
      current = Number(h[1]);
      out.set(current, { title: h[2].trim(), body: [] });
    } else if (current !== null) out.get(current).body.push(line);
  }
  return out;
}

// README de módulo del repo: los que abren con frontmatter y declaran `module:`.
export function moduleReadmes(name) {
  const dir = repoDir(name);
  const candidates = name === 'posveapi'
    ? gitLs(dir, 'docs/modules/*/README.md')
    : gitLs(dir, '*/README.md', '**/README.md').filter((p) => !p.startsWith('docs/') && !p.includes('node_modules/'));
  return [...new Set(candidates)].sort().flatMap((rel) => {
    const text = readText(join(dir, rel));
    const fm = parseFrontmatter(text);
    return fm && fm.module !== undefined ? [{ rel, text, fm }] : [];
  });
}
