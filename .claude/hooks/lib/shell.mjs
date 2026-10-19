// shell.mjs: lo mínimo para que los hooks entiendan un comando de Git Bash en Windows.
// splitSegments corta en |, ||, &&, ; y saltos de línea respetando comillas; words separa un
// segmento en palabras sin comillas; toNativePath traduce /c/Users/... a C:/Users/...

export function splitSegments(command) {
  const segments = [];
  let current = '';
  let quote = null;
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote) {
      current += ch;
      if (ch === '\\' && quote === '"' && i + 1 < command.length) current += command[++i];
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === '\\' && i + 1 < command.length) {
      current += ch + command[++i];
      continue;
    }
    const two = command.slice(i, i + 2);
    if (two === '&&' || two === '||') {
      segments.push(current);
      current = '';
      i++;
      continue;
    }
    if (ch === '|' || ch === ';' || ch === '\n') {
      segments.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  segments.push(current);
  return segments.map(s => s.trim()).filter(Boolean);
}

export function words(segment) {
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

export function toNativePath(path) {
  if (process.platform !== 'win32' || typeof path !== 'string') return path;
  const drive = /^\/([a-zA-Z])(\/|$)/.exec(path);
  return drive ? `${drive[1].toUpperCase()}:/${path.slice(3)}` : path;
}

export const isAbsolutePath = path => /^([a-zA-Z]:[\\/]|\/)/.test(path);
