#!/usr/bin/env node
// Hook PreToolUse sobre Bash y PowerShell: pide confirmación sólo cuando un comando de base de
// datos (psql, sqlite3, artisan tinker o artisan db*) puede escribir o borrar; las lecturas siguen
// las reglas allow normales. Reemplaza a las reglas "ask" que preguntaban también por cada SELECT.
// Busca las palabras de escritura en el comando entero y no sólo en el segmento de psql, porque un
// heredoc deja el SQL en otras líneas: un falso positivo sólo cuesta una pregunta.
// Un SQL que llega desde archivo (-f, \i, <, .read) no se puede leer aquí y siempre pregunta.
// Nunca bloquea: pregunta o calla. Cualquier fallo propio sale con 0 y sin salida.
//
// Uso: node .claude/hooks/db-write-guard.mjs < carga.json
//      node .claude/hooks/db-write-guard.mjs --self-test

import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { readStdin } from './hook-stdin.mjs';

const SELF = fileURLToPath(import.meta.url);

const DB_COMMAND = /\b(?:psql|sqlite3)\b|\bartisan\s+(?:tinker|db\b|db:|migrate:(?:fresh|reset|rollback|refresh)\b)/i;
const ALWAYS_ASK = [
  [/\bartisan\s+(?:db:wipe|db:seed|migrate:(?:fresh|reset|rollback|refresh))\b/i, 'borra o reescribe datos'],
  [/\bartisan\s+db(?:\s|$)/i, 'abre una consola SQL interactiva'],
  [/\bartisan\s+tinker\b(?![^|;&]*(?:--execute|\s-e\b))/i, 'abre tinker interactivo'],
  [/\bpsql\b[^|;&]*\s(?:-f|--file)\b|\\i\b|\\copy\b|\bsqlite3\b[^|;&]*\.(?:read|import|restore)\b/i, 'ejecuta SQL desde archivo'],
];
const FILE_REDIRECT = /\b(?:psql|sqlite3)\b[^|;&]*\s<\s*[^<]/i;
const QUOTED = /"(?:\\.|[^"\\])*"|'[^']*'/g;
const SQL_WRITE = /\b(?:insert|update|delete|drop|truncate|alter|create|grant|revoke|copy|merge|call|vacuum|reindex|cluster|refresh|into|upsert)\b|\bcomment\s+on\b|\bdo\s+\$/i;
const PHP_WRITE = /->\s*(?:save|forceDelete|increment|decrement|attach|detach|sync|syncWithoutDetaching|push|restore|updateOrCreate|firstOrCreate|updateQuietly|saveQuietly|fill)\s*\(|\b(?:DB::(?:statement|unprepared)|Artisan::call|Schema::|dispatch(?:Sync)?)\b/i;

export function reasonToAsk(command) {
  if (typeof command !== 'string' || !DB_COMMAND.test(command)) return null;
  for (const [pattern, reason] of ALWAYS_ASK) if (pattern.test(command)) return reason;
  if (FILE_REDIRECT.test(command.replace(QUOTED, '""'))) return 'ejecuta SQL desde archivo';
  if (SQL_WRITE.test(command) || PHP_WRITE.test(command)) return 'puede escribir o borrar datos';
  return null;
}

function selfTest() {
  const failures = [];
  const check = (title, ok) => {
    console.log(`self-test: ${ok ? 'ok   ' : 'FALLA'} ${title}`);
    if (!ok) failures.push(title);
  };
  const compose = 'docker compose -f "C:/x/docker-compose.yml" exec -T postgres psql -U postgres -d posshop_dev';
  check('SELECT no pregunta', reasonToAsk(`${compose} -c "select id, updated_at from users limit 5;"`) === null);
  check('varios -c de lectura no preguntan', reasonToAsk(`${compose} -At -c "select 1" -c "select count(*) from created_items"`) === null);
  check('DELETE pregunta', reasonToAsk(`${compose} -c "DELETE FROM users WHERE id=1"`) !== null);
  check('update en minúsculas pregunta', reasonToAsk(`docker exec posveapi_postgres psql -c "update products set x=1"`) !== null);
  check('heredoc con INSERT pregunta', reasonToAsk(`${compose} <<'SQL'\nINSERT INTO t VALUES (1);\nSQL`) !== null);
  check('psql -f pregunta', reasonToAsk(`${compose} -f /tmp/x.sql`) !== null);
  check('redirección < pregunta', reasonToAsk(`${compose} < dump.sql`) !== null);
  check('un < entre comillas no es redirección', reasonToAsk(`${compose} -c "select id from users where id < 10"`) === null);
  check('SELECT INTO pregunta', reasonToAsk(`${compose} -c "select * into copia from users"`) !== null);
  check('tinker de lectura no pregunta', reasonToAsk(`docker compose exec app php artisan tinker --execute="dump(App\\Models\\User::count());"`) === null);
  check('tinker con ->save() pregunta', reasonToAsk(`docker compose exec app php artisan tinker --execute="$u=User::find(1); $u->name='x'; $u->save();"`) !== null);
  check('tinker con ::create( pregunta', reasonToAsk(`docker compose exec app php artisan tinker --execute="Tpv::create([])"`) !== null);
  check('tinker interactivo pregunta', reasonToAsk('docker compose exec app php artisan tinker') !== null);
  check('db:show no pregunta', reasonToAsk('docker compose exec app php artisan db:show') === null);
  check('db:wipe pregunta', reasonToAsk('docker compose exec app php artisan db:wipe --force') !== null);
  check('migrate:fresh pregunta', reasonToAsk('docker compose exec app php artisan migrate:fresh') !== null);
  check('migrate a secas no es de este hook', reasonToAsk('docker compose exec app php artisan migrate --force') === null);
  check('un grep sin base de datos calla', reasonToAsk('grep -rn "delete" app/') === null);
  check('sqlite3 .import pregunta', reasonToAsk('sqlite3 a.db ".import x.csv t"') !== null);
  console.log(`self-test: ${failures.length} fallas.`);
  process.exit(failures.length ? 1 : 0);
}

const isEntryPoint = process.argv[1] !== undefined && realpathSync.native(process.argv[1]) === realpathSync.native(SELF);
if (isEntryPoint) {
  if (process.argv.includes('--self-test')) selfTest();
  else {
    try {
      const payload = JSON.parse((await readStdin()) || '{}');
      const reason = reasonToAsk(payload?.tool_input?.command);
      if (reason) {
        process.stdout.write(`${JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'ask',
            permissionDecisionReason: `Comando de base de datos que ${reason}.`,
          },
        })}\n`);
      }
    } catch {
      // Un hook roto nunca interfiere con la herramienta.
    }
    process.exitCode = 0;
  }
}
