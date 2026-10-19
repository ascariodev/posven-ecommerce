---
name: ejecutar-plan
description: Ejecuta un plan por fases aprobado de principio a fin sin parar, delegando cada fase a un subagente con contexto limpio, revisándola y haciendo commit por fase. Úsala cuando el usuario pida ejecutar, implementar o correr el plan completo o todas las fases.
argument-hint: <nombre-de-la-tarea>
model: sonnet
effort: medium
---

Ejecuta el plan `$ARGUMENTS` completo (`<repo>/docs/plans/$ARGUMENTS.md` o, en el
espacio de quien coordina, `posven/.claude/docs/plans/$ARGUMENTS.md`). Si no llegaron
argumentos, usa el plan activo (Estado "en curso"); si hay más de uno o ninguno, pregunta cuál.

Eres **el coordinador**: despachas, revisas, registras y haces commit. **No escribes el código**
ni pegas diffs ni contenido de archivos en tu conversación: trabajas con los reportes cortos de
los subagentes. Nunca `cd`: `git -C <árbol>` y rutas absolutas.

## Antes de empezar
1. Lee el plan una vez (Contexto mínimo, Decisiones, lista de fases) y `docs/conventions/lessons.md`
   de cada repo que toca.
2. Por cada repo del plan, el árbol es su worktree de la tarea (si no existe, `crear` del script
   de `.claude/CLAUDE.comun.md` §2), nunca el checkout principal: `git -C <árbol> rev-parse --abbrev-ref
   HEAD` es la rama del plan y `git -C <árbol> status --short` está limpio. Si algo no cuadra,
   pregunta.
3. Si hay fases de posveapi, en una sola pregunta: ¿autorizo `--no-verify` para los commits de
   este plan (el hook de pint falla sin PHP)? ¿Docker está arriba para phpunit? La respuesta va a
   "Decisiones" y vale solo para este plan.
4. Anuncia en 2–3 líneas cuántas fases pendientes hay y el orden.

## Bucle: por cada fase pendiente (`### [ ]`), en orden
1. **Implementar:** despacha `implementador-fase` con la ruta del plan, el número de fase, el
   repo, el árbol y la rama. Fase `[riesgo]`: `model: opus`; si no, `model: sonnet`. Pasa siempre
   `model` explícito.
   El grafo (`<padre>/.graphify-workspace/`, en la carpeta padre de los repos) no se actualiza
   entre fases (skill `discovery`): lo que crearon fases anteriores se ubica por "Decisiones" y
   el diff.
2. **Según su Estado:** un reporte sin línea **Grafo:**, o que cambió un símbolo o campo de
   contrato sin su `graphify affected` cruzado con el diff del plan, vuelve al implementador en
   esa misma ronda.
   - `HECHO`: sigue al paso 3.
   - `DIVIDIR`: si la división es clara y no cambia el alcance, aplícala en el plan (anótala en
     "Decisiones") y vuelve al paso 1 con la primera subfase. Si cambia el alcance, para.
   - `CONSULTA` o `BLOQUEADO`: para (ver "Cuándo parar").
3. **Verificar:** corre la verificación proporcional del repo (`.claude/CLAUDE.comun.md` §5) con salida
   resumida.
4. **Revisar:** despacha `revisor-fase` con la ruta del plan, la fase y el árbol. Si la fase
   condensa documentación, despacha además `doc-verifier`.
   - `LISTO`: sigue al paso 5.
   - `CAMBIOS NECESARIOS`: despacha `implementador-fase` con los problemas. Máximo **2 rondas
     de corrección** por fase; si sigue fallando, para.
5. **Cerrar**, siguiendo `cerrar-fase` salvo la revisión, que ya hiciste: fase `[x]`, línea de
   Estado, "Decisiones" (incluidas las firmas que quedaron distintas del plan) y "Notas para la
   próxima sesión" con lo que reportó el subagente, lección si hubo retrabajo, y **un commit por
   fase** con el `Commit:` de la fase, archivos por ruta, sin atribución y sin push.
   Antes del commit, **registra las mejoras no aplicadas**: las "Sugerencias menores" del revisor
   y los pendientes del implementador que no son parte del plan y pasan el filtro de la regla
   `plan-composition` van a `## Mejoras propuestas` como `- [ ] M-<n>`, clasificadas con los
   criterios de la skill `aplicar-mejoras`. No las implementes.
6. Informa en **una línea** (`Fase N/M lista: <nombre> (<sha7>)`) y sigue sin esperar.

## Cuándo parar (y solo entonces)
- Un subagente reporta `CONSULTA` o `BLOQUEADO`, o una división que cambia el alcance.
- Una fase no pasa la revisión tras 2 rondas de corrección.
- Los tests fallan y la causa está fuera de la fase actual.
- Algo requiere una decisión irreversible no prevista (borrar datos, cambiar un contrato público
  o el contrato API-TPV, actualizar un snapshot fiscal, tocar producción).

Al parar: deja el plan actualizado con dónde quedaste, explica en máximo 5 líneas qué pasó y qué
necesitas, y espera. Cuando responda, retoma desde la fase pendiente.

## Al terminar el plan
Estado `terminado`, plan a `terminados/` de su carpeta, poda de lecciones ya promovidas, commit,
y resumen en máximo 8 líneas: fases, commits, decisiones relevantes, lecciones nuevas y pasos de
deploy en orden. Si hay mejoras pendientes, lístalas en una tabla corta (id, mejora, repo,
complejidad, modelo) y recuerda que se aplican con `/aplicar-mejoras <tarea>`. Cierra proponiendo en una línea, en este orden, el merge de cada repo con
el script (`merge`, `publicar` y `cerrar`, `.claude/CLAUDE.comun.md` §2) y actualizar el grafo de cada repo
tocado, y el cross-repo si el plan cruzó repos (skill `discovery`); nada de eso sin el sí.
