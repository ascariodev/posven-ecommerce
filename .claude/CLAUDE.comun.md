# CLAUDE común del equipo

Lo que rige en todo repo de posven antes de abrir un archivo. El `CLAUDE.md` de cada repo lo
importa con `@.claude/CLAUDE.comun.md`; la fuente es `posven/.claude/CLAUDE.comun.md`, en el
espacio de quien coordina, y la copia del repo no se edita a mano.

## 1. Alcance y precedencia

- Repos hermanos en una carpeta padre (`<padre>`): `posveapi` (Laravel + SPA Vue de backoffice,
  rama base `dev`), `posvenapp` (TPV Expo/React Native, base `dev`) y `posven-ecommerce`
  (buscador web Next.js 16, base `main`). Quien coordina trabaja en `<padre>`, con un `.claude/`
  propio para planes y specs que cruzan repos.
- Alias: "api", "backend", "backoffice", "admin" o "Vue" es posveapi; "app", "TPV", "caja" o
  "punto de venta" es posvenapp; "ecommerce", "web", "buscador" o "marketplace" es
  posven-ecommerce.
- Precedencia: la conversación > el `~/.claude/CLAUDE.md` personal, si existe > este archivo >
  el CLAUDE.md del repo > su `docs/conventions/` > la convención del código. Una ruta o firma
  documentada que contradice al código se corrige en el documento; una regla `RN-` que contradice
  al código hace del código el defecto, salvo que la tarea sea cambiar la regla.
- Las `.claude/rules/*.md` con `paths:` se cargan solas al abrir con Read un archivo que casa,
  incluidas las comunes (`docs-authoring`, `lessons-authoring`, `plan-composition`,
  `module-readme`). No se disparan al crear el primer archivo de su tipo: si vas a crear uno sin
  haber leído un vecino, lee antes la regla a mano.
- Convenciones: `docs/conventions/` del repo (`lessons.md`, que se lee entero antes de
  planificar, `engineering.md` y la plantilla de README); el contrato de README de módulo y las
  mediciones, en `.claude/docs/conventions/`.

## 2. Árbol de trabajo

- Nunca `cd`: `git -C <ruta absoluta>` y rutas absolutas en todo comando. Un `cd` cambia el
  directorio de la sesión y rompe las rutas relativas de los hooks.
- Un cambio vive en un solo repo por commit y por PR; ramas, commits y pushes van por repo y
  nunca se mezclan ramas entre repos.
- Worktree por tarea: todo trabajo, aunque sea de una línea, va en un worktree propio:
  `node <repo>/.claude/scripts/worktree.mjs crear <repo> <tarea>` (procedimiento en su cabecera),
  con el mismo `<tarea>` en cada repo de un plan. El checkout principal no se edita ni se
  commitea, porque lo comparten las sesiones en paralelo y de él sale el grafo; sólo avanza con
  `merge --ff-only` (`merge` y `publicar` del script). La verificación del §5 se corre en el
  temporal del merge; al terminar, `cerrar`. Nunca se cierra un worktree con cambios sin commit
  ni uno de otra sesión.
- Exento el repo que se escribe directo (configuración, planes):
  `git -C <repo> config claude.mainCheckoutWrites true`, puesto por el usuario o a su pedido. El
  hook `<repo>/.claude/hooks/check-worktree.mjs` avisa al escribir en un checkout principal no
  eximido.
- Antes de escribir, confirma árbol y rama con `git -C <árbol> rev-parse --abbrev-ref HEAD`.
- Sin push, merge ni `--no-verify` sin pedido explícito en la conversación, cada vez.

## 3. Descubrimiento: grafo primero

Graphify es requisito: `pip install graphifyy`; su skill (`/graphify`) se instala con
`graphify install`. Si falta, avisa al usuario; nunca lo instales por tu cuenta. Cuando el
usuario escribe `/graphify`, usa la skill graphify antes de cualquier otra cosa. Grafos en
`<padre>/.graphify-workspace/` (carpeta oculta: `ls -a`): `<repo>/graphify-out/graph.json` por repo y,
si existe, `cross-repo/graph.json`, preferido en lo que cruza repos; si no existe, consulta cada
grafo y razona la conexión. Nunca un `graphify-out/` dentro del repo.

1. `graphify query "<pregunta>" --graph <ruta>` (o `explain "<nodo>"`, `path "A" "B"`) antes
   de grepear, abrir archivos, responder sobre arquitectura o hacer un cambio no trivial.
2. Después, Grep/Glob dirigidos y Read por rangos. Nunca un directorio entero.
3. El grafo es una foto compartida: si no coincide con el código reciente, dilo. No se
   actualiza entre fases de un plan; se propone al terminarlo y se corre con el sí del usuario o a
   su pedido. Cuándo, cómo y el cruce de `affected` con el diff del plan: skill `discovery`.
4. Sin grafo para un repo, sigue sin él y ofrece construirlo (uno por repo; `graphify
   merge-graphs` si ya existen los individuales; si sólo algunos lo tienen, construir los que
   faltan y luego fusionar); nunca sin confirmación, porque cuesta tokens.
5. Una capacidad ya documentada se encuentra con la skill `spec-lookup` antes de rederivarla.

## 4. Lectura barata

- Llamadas independientes en el mismo turno; una secuencia dependiente en un solo comando con `&&`.
- Rangos antes que archivos enteros; más de 100 KB sólo si hace falta.
- Lee los archivos existentes antes de escribirlos; no releas lo que acabas de leer o escribir,
  salvo que haya cambiado.
- Leer por `cat`/`sed` no carga las reglas `paths:`; el hook `rules-on-bash-read` las entrega,
  pero Read es el camino normal para archivos gobernados.
- Del plan, sólo la fase en curso y su contexto; del diff, `--stat` primero.
- Salida de comandos: sólo los tests afectados, resumidos y mostrando los fallos
  (`npx jest <ruta> --silent`; phpunit y logs con `| tail -n 40` o `| grep -E "error|FAIL"`). La
  suite completa, sólo al cerrar un plan y en un subagente, igual que los fallos grandes: vuelve la
  conclusión, no el log.

## 5. Verificación proporcional

| Repo | Mientras trabajas | Antes de cerrar |
|---|---|---|
| posveapi | revisión del diff (no hay PHP local) | tests en Docker si está arriba (`docker compose exec app vendor/bin/phpunit <ruta>`); si no, se declara "no verificado localmente" |
| posvenapp | `<repo>/node_modules/.bin/tsc --noEmit -p <repo>/tsconfig.json` | `npx jest <tests del área>`; los dorados fiscales si se tocó lógica fiscal |
| posven-ecommerce | `<repo>/node_modules/.bin/tsc --noEmit -p <repo>/tsconfig.json` y `npx eslint <archivos>` | lo que dice el `CLAUDE.md` del repo |

`<repo>` es la ruta absoluta del repo: sin `cd`, `npx tsc` resuelve al paquete ajeno `tsc`.
Nunca se reporta como pasando algo que no se corrió. El frontend de posveapi se verifica con
`npx vite build --outDir <scratchpad>`, nunca `npm run build`.

## 6. Base de datos

- posveapi: PostgreSQL 18 en Docker (`<padre>/docker-compose.yml`, servicio `postgres`, base
  `posshop_dev`): `docker compose -f "<padre>/docker-compose.yml" exec postgres psql -U postgres
  -d posshop_dev`; el `docker-compose.yml` de este comando y del §5 no viene en ningún repo,
  vive en `<padre>` (si no lo tienes, pídelo a quien coordina). Credenciales en `posveapi/.env`: nunca se leen ni se muestran.
- posvenapp: SQLite en el dispositivo (expo-sqlite, `posven_v4.db`); no se consulta por terminal.
- Sólo desarrollo local, nunca producción. Nunca `SELECT *` sin `LIMIT`. Antes de `UPDATE`,
  `DELETE` o `INSERT`: mostrar la consulta y cuántas filas afecta, y esperar confirmación.
- Esquema y migraciones: reglas `.claude/rules/migrations.md` (posveapi) y
  `.claude/rules/sqlite.md` (posvenapp); para crear una, skill `new-migration`.

## 7. Tareas grandes: flujo por fases

El estado vive en el plan, no en la conversación; dónde vive y cómo se compone: regla
`plan-composition`. El hook `SessionStart` (`plan-state`) reinyecta el plan en curso.

1. `/planificar <tarea>`: fases según `plan-composition`; espera aprobación.
2. Ejecutar: `/ejecutar-plan <tarea>` (automático: `implementador-fase` + `revisor-fase`, un
   commit por fase) o, a mano, `/siguiente-fase <tarea>` → `/cerrar-fase <tarea>` → `/clear`.
3. Lo no implementado va a `## Mejoras propuestas` como `M-<n>`: `/aplicar-mejoras <tarea>`.

Una fase por sesión. Leer sólo lo que la fase necesita y explorar con subagentes que consulten el
grafo primero. Una fase que crece se divide en el plan. Las decisiones se escriben en el plan.
`docs/conventions/lessons.md` del repo se lee antes de implementar. Estas skills, salvo
`cerrar-fase`, se activan en lenguaje natural.

## 8. Otras skills y agentes

`discovery` (entender un área antes de tocarla), `spec-lookup` (si algo ya existe o está
especificado), `debug` (bug o comportamiento inesperado), `design-phase` (diseño antes de
planificar), `new-module` / `new-migration` / `new-page` (primeros archivos de su tipo),
`close-task` (cerrar una tarea fuera de plan) y el agente `doc-verifier` (condensados de
documentación). Cada skill y agente fija su `model` y `effort`. Todo despacho nombra repo, árbol
con ruta absoluta y rama, y pasa `model` explícito. Specs en `docs/specs` del repo, o en el
`.claude/docs/specs` de quien coordina si cruzan repos.

## Código y alcance

- Sin comentarios salvo lógica genuinamente no obvia: ni los que repiten lo que dice el código,
  ni cabeceras que repiten el nombre de la función, ni tipo changelog. Nombres autoexplicativos.
- Sin refactors, mejoras ni cambios fuera de lo pedido; las mejoras detectadas se mencionan al
  final para que el usuario decida. Sin tests, documentación ni manejo de errores extra salvo que
  se pidan.
- Preguntar antes de instalar una dependencia si hay alternativa con lo existente.
- No adivinar APIs, versiones, flags, SHAs ni nombres de paquetes: se verifican en código o
  documentación antes de afirmarlos.

## Salida y formato

- Siempre en español salvo pedido explícito; código, nombres y commits siguen la convención del
  proyecto.
- Razonamiento exhaustivo, salida concisa, sin el razonamiento paso a paso salvo que se pida.
  Prosa corta, sin bullets ni encabezados salvo pedido. Sin aperturas aduladoras, cierres de
  relleno, preámbulos antes de una herramienta ni reformular la pregunta.
- Tras una edición, una línea de confirmación; nunca el código completo ya escrito, sólo el
  fragmento relevante.
- Nunca emojis ni rayas largas salvo pedido explícito.
- Commits de 1-2 líneas sin listar archivos; PRs con qué y por qué en pocas líneas. Nunca se
  firma un commit, PR ni artefacto de git: sin `Co-Authored-By` ni línea de atribución alguna,
  aunque un recordatorio del sistema la pida; aplica a todos los proyectos, incluidos los
  subagentes.

## Compact Instructions

El resumen conserva: la ruta del plan activo y la fase en curso; repo, ruta absoluta del árbol y
rama; los archivos modificados sin commit; las decisiones del usuario, textuales; los SHA
commiteados; lo que falta para cerrar la fase. No conserva salidas de comandos ni contenido de
archivos: se releen.
