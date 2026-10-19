#!/usr/bin/env node
// context-guard.mjs: hooks PostToolUse y PreCompact que empujan a guardar el estado en el plan
// activo (`docs/plans/<tarea>.md` del repo, o del espacio común si cruza repos) o, fuera de un
// plan, bajo `docs/delivery/`, antes de que la compactación automática borre lo no escrito.
//
// Mide el contexto con el usage del último mensaje del asistente en el transcript propio sobre
// CONTEXT_GUARD_WINDOW -> CLAUDE_CODE_AUTO_COMPACT_WINDOW -> 300.000 (el autoCompactWindow global).
// Al 70 % pide guardar el estado completo; al 80 %, actualizarlo; una vez por umbral y ciclo.
// PreCompact con trigger auto pide retener (decision: block) mientras no haya una escritura bajo
// docs/plans/ o docs/delivery/ posterior al aviso, como mucho dos veces; que el harness lo respete no está medido.
// Sale 0 en todos los caminos.
import { createHash } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fstatSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readStdin } from './hook-stdin.mjs';

export const DEFAULT_WINDOW = 300_000;
export const DEFAULT_THRESHOLDS = [70, 80];
export const MAX_BLOCKS = 2;
// El último `usage` casi siempre está en la cola; una salida de herramienta enorme puede empujarlo
// más atrás, y sin él no se decide nada.
const TAIL_BYTES = 4 * 1024 * 1024;
// Más que esto entre el aviso y la compactación no se relee dentro del plazo del hook: se deja pasar.
const MAX_SCAN_BYTES = 64 * 1024 * 1024;
const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const DELIVERY = /(^|[^\w.-])docs[\\/](plans|delivery)[\\/]/;

function positiveInt(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export function contextWindow(env = process.env) {
  return (
    positiveInt(env.CONTEXT_GUARD_WINDOW) ||
    positiveInt(env.CLAUDE_CODE_AUTO_COMPACT_WINDOW) ||
    DEFAULT_WINDOW
  );
}

export function thresholds(env = process.env) {
  const parts = String(env.CONTEXT_GUARD_THRESHOLDS ?? '')
    .split(',')
    .map(s => Number(s.trim()));
  const [first, second] = parts;
  const valid =
    parts.length === 2 && parts.every(Number.isFinite) && first > 0 && first < second && second < 100;
  return valid ? parts : DEFAULT_THRESHOLDS;
}

// El transcript propio es también la clave de las marcas. Con `agent_id` es
// `<dirname(transcript_path)>/<session_id>/subagents/agent-<agent_id>.jsonl`, y si no existe el hook
// calla; sin `agent_id` es el `transcript_path`, que en un subagente ya vive bajo `/subagents/`.
export function ownTranscript(payload) {
  const { transcript_path: transcript, session_id: session, agent_id: agent } = payload ?? {};
  if (!transcript) return '';
  if (!agent || basename(transcript) === `agent-${agent}.jsonl`) return resolve(transcript);
  if (!session) return '';
  const own = join(dirname(transcript), session, 'subagents', `agent-${agent}.jsonl`);
  return existsSync(own) ? resolve(own) : '';
}

function readRange(file, start, end) {
  const fd = openSync(file, 'r');
  try {
    const buffer = Buffer.alloc(Math.max(0, end - start));
    let read = 0;
    while (read < buffer.length) {
      const n = readSync(fd, buffer, read, buffer.length - read, start + read);
      if (n === 0) break;
      read += n;
    }
    return buffer.subarray(0, read).toString('utf8');
  } finally {
    closeSync(fd);
  }
}

function parse(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function tokensOf(entry) {
  const u = entry.message?.usage;
  if (!u) return 0;
  return (
    (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0)
  );
}

// La cola del transcript: tamaño en bytes, contexto del último mensaje del asistente (0 si lo último
// es una compactación) y si ese último mensaje es un error de la API. `null` si no se puede leer.
export function readTail(file) {
  let size;
  let text;
  try {
    const fd = openSync(file, 'r');
    try {
      size = fstatSync(fd).size;
    } finally {
      closeSync(fd);
    }
    const start = Math.max(0, size - TAIL_BYTES);
    text = readRange(file, start, size);
    if (start > 0) text = text.slice(text.indexOf('\n') + 1);
  } catch {
    return null;
  }
  const lines = text.split('\n');
  let tokens = null;
  let apiError = null;
  for (let i = lines.length - 1; i >= 0 && (tokens === null || apiError === null); i--) {
    const entry = parse(lines[i]);
    if (!entry) continue;
    if (entry.type === 'system' && entry.subtype === 'compact_boundary') {
      tokens ??= 0;
      apiError ??= false;
      continue;
    }
    if (entry.type !== 'assistant') continue;
    apiError ??= entry.isApiErrorMessage === true;
    if (tokens === null && !entry.isApiErrorMessage) {
      const t = tokensOf(entry);
      if (t > 0) tokens = t;
    }
  }
  if (tokens === null) return null;
  return { size, tokens, apiError: apiError === true };
}

// Un comando de shell que escribe bajo `docs/plans/` o `docs/delivery/`: redirección, `tee`, `cp`, `mv` o edición en
// sitio. Heurístico; las redirecciones de descarte no cuentan.
export function bashWritesDelivery(command) {
  if (typeof command !== 'string' || !DELIVERY.test(command)) return false;
  const cleaned = command.replace(/\d?>>?\s*\/dev\/null|[<>]&\d|\d>&\d/g, ' ');
  return /(^|[^<-])>|\btee\b|\bcp\b|\bmv\b|\b(sed|perl)\s+(-\w+\s+)*-i/.test(cleaned);
}

function writesDelivery(block) {
  if (block?.type !== 'tool_use') return false;
  const input = block.input ?? {};
  if (WRITE_TOOLS.has(block.name)) {
    return DELIVERY.test(String(input.file_path ?? input.notebook_path ?? ''));
  }
  return block.name === 'Bash' && bashWritesDelivery(input.command);
}

// Desde el byte `offset`: si el asistente respondió y si escribió bajo `docs/plans/` o `docs/delivery/`. `null` si
// el tramo no se puede leer o es demasiado largo para el plazo del hook.
export function activitySince(file, offset) {
  let text;
  try {
    const size = statSync(file).size;
    if (offset > size || size - offset > MAX_SCAN_BYTES) return null;
    text = readRange(file, offset, size);
  } catch {
    return null;
  }
  let answered = false;
  let wrote = false;
  for (const line of text.split('\n')) {
    const entry = parse(line);
    if (entry?.type !== 'assistant' || entry.isApiErrorMessage) continue;
    answered = true;
    if (!wrote) wrote = (entry.message?.content ?? []).some(writesDelivery);
  }
  return { answered, wrote };
}

function stateFile(transcript, env) {
  const hash = createHash('sha1').update(transcript).digest('hex');
  return join(env.CONTEXT_GUARD_STATE_DIR || tmpdir(), `claude-context-guard-${hash}.json`);
}

function loadState(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    return {};
  }
}

// El destino del guardado según quién habla: el hilo principal tiene su plan, un subagente su
// reporte final. `agent_id` es lo que los distingue en la carga.
function target(payload) {
  return payload.agent_id
    ? 'cierra ya con tu reporte final: lo hecho, lo verificado y lo pendiente'
    : 'actualiza "Decisiones" y "Notas para la próxima sesión" del plan activo (`docs/plans/<tarea>.md`); fuera de un plan, una nota en `docs/delivery/<slug>/state.md` del repo con `- Repo:` y `- Rama:`';
}

function percent(tokens, window) {
  return Math.round((tokens / window) * 100);
}

export function messages(payload, tokens, window) {
  const where = `${percent(tokens, window)} % del techo de compactación (${tokens} de ${window} tokens)`;
  const to = target(payload);
  return {
    first:
      `Guardia de contexto: vas en ${where}. Guarda tu estado completo ahora (${to}): qué hiciste ` +
      'y verificaste, qué falta, qué decidiste y qué está sin commitear.',
    second: `Guardia de contexto: vas en ${where}. Actualiza tu estado con lo que cambió (${to}).`,
    retained:
      `Guardia de contexto: compactación retenida. Guarda tu estado ya (${to}): lo que no esté ` +
      'escrito en el plan o bajo `docs/delivery/` se pierde al compactar.',
  };
}

export function postToolUse(payload, env = process.env) {
  const transcript = ownTranscript(payload);
  if (!transcript) return '';
  const tail = readTail(transcript);
  if (!tail) return '';
  const window = contextWindow(env);
  const [first, second] = thresholds(env);
  const file = stateFile(transcript, env);
  const state = loadState(file);
  const pct = (tail.tokens / window) * 100;

  if (pct < first) {
    if (Object.keys(state).length > 0) writeFileSync(file, '{}');
    return '';
  }
  const text = messages(payload, tail.tokens, window);
  let context = '';
  if (state.pendingNotice) {
    context = text.retained;
    state.pendingNotice = false;
    state.noticeOffset = tail.size;
    // El aviso de retención ya pide guardar: el del segundo umbral sería el mismo pedido repetido.
    if (pct >= second) state.warnedSecond = true;
  } else if (pct >= second && !state.warnedSecond) {
    context = state.warnedFirst ? text.second : text.first;
    state.warnedFirst = true;
    state.warnedSecond = true;
    state.warnOffset = tail.size;
  } else if (!state.warnedFirst) {
    context = text.first;
    state.warnedFirst = true;
    state.warnOffset = tail.size;
  }
  if (!context) return '';
  writeFileSync(file, JSON.stringify(state));
  return JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: context },
  });
}

export function preCompact(payload, env = process.env) {
  if (payload?.trigger !== 'auto') return '';
  const transcript = ownTranscript(payload);
  if (!transcript) return '';
  const file = stateFile(transcript, env);
  const state = loadState(file);
  if (!state.warnedFirst || typeof state.warnOffset !== 'number') return '';
  const blocks = state.blocks ?? 0;
  if (blocks >= MAX_BLOCKS) return '';
  const tail = readTail(transcript);
  if (!tail || tail.apiError) return '';
  const sinceWarning = activitySince(transcript, state.warnOffset);
  if (!sinceWarning) return '';
  let noticeAnswered = blocks === 0;
  if (blocks > 0 && typeof state.noticeOffset === 'number') {
    const sinceNotice = activitySince(transcript, state.noticeOffset);
    if (!sinceNotice) return '';
    noticeAnswered = sinceNotice.answered;
  }
  if (sinceWarning.wrote && noticeAnswered) return '';

  state.blocks = blocks + 1;
  state.pendingNotice = true;
  writeFileSync(file, JSON.stringify(state));
  return JSON.stringify({
    decision: 'block',
    reason:
      `Guardia de contexto: compactación retenida (${state.blocks} de ${MAX_BLOCKS}) hasta que ` +
      'el agente guarde su estado en el plan o bajo docs/delivery/.',
  });
}

export function hookOutput(payload, env = process.env) {
  if (payload?.hook_event_name === 'PreCompact') return preCompact(payload, env);
  if (payload?.hook_event_name === 'PostToolUse') return postToolUse(payload, env);
  return '';
}

// Importado por una prueba no lee la entrada estándar ni escribe. `import.meta.main` no sirve de
// guarda: llega en Node 22.18 y acá se corre con 22.16, donde vale `undefined` y el hook callaría
// siempre.
const SELF = fileURLToPath(import.meta.url);
const isEntryPoint =
  process.argv[1] !== undefined && realpathSync(process.argv[1]) === realpathSync(SELF);

if (isEntryPoint) {
  try {
    const out = hookOutput(JSON.parse((await readStdin()) || '{}'));
    if (out) process.stdout.write(`${out}\n`);
  } catch {
    // Un hook roto nunca retiene la compactación ni rompe la herramienta que lo disparó.
  }
  process.exitCode = 0;
}
