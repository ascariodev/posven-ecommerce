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

Eres **el coordinador**: analizas, despachas, revisas, registras y haces commit. **No escribes
el código** ni pegas diffs ni contenido de archivos en tu conversación. El implementador sólo
implementa: todo análisis que haga falta en la ejecución es tuyo o del revisor. La ejecución es
continua: las dudas y los arreglos que piden plan se resuelven según la regla `plan-composition`
("Dudas y planes nuevos durante la ejecución"), sin preguntar. Nunca `cd`: `git -C <árbol>` y
rutas absolutas.

## Antes de empezar
1. Lee el plan una vez (Contexto mínimo, Decisiones, fases) y `docs/conventions/lessons.md`
   de cada repo que toca.
2. Por cada repo del plan, el árbol es su worktree de la tarea (si no existe, `crear` del script
   de `.claude/CLAUDE.comun.md` §2), nunca el checkout principal: `git -C <árbol> rev-parse
   --abbrev-ref HEAD` es la rama del plan y `git -C <árbol> status --short` está limpio. Si no
   cuadra, o si el plan de su "Depende de" no está `terminado`, pregunta: son las únicas otras
   preguntas permitidas.
3. Si hay fases de posveapi, comprueba tú si Docker está arriba (`docker compose -f
   "<padre>/.claude/entorno/docker-compose.yml" ps`) y pregunta sólo esto: ¿autorizo
   `--no-verify` para los commits de este plan (el hook de pint falla sin PHP)? Va a "Decisiones"
   y vale sólo para este plan.
4. Anuncia en 2–3 líneas cuántas fases pendientes hay y el orden.

## Bucle: por cada fase pendiente (`### [ ]`), en orden
1. **Preparar el brief:** comprueba que la fase cumple el brief de la regla `plan-composition`
   contra lo que dejaron las fases anteriores (diff y "Decisiones"): un ancla que se movió, una
   firma que quedó distinta o un archivo que falta lo resuelves tú con el diff, el grafo
   (`<padre>/.graphify-workspace/`, no se actualiza entre fases; skill `discovery`) o un Grep
   dirigido, y lo pasas como "Ajustes".
2. **Implementar:** despacha `implementador-fase` con repo, árbol, rama y, pegados en el prompt,
   el texto de la fase, las Restricciones del Contexto mínimo, las Decisiones que la tocan y los
   Ajustes. Fase `[riesgo]`: `model: opus`; si no, `model: sonnet`. Pasa siempre `model`. La
   fase `[pantalla]` no se despacha: la corres tú en el navegador con su escenario (regla
   `plan-cobertura`), anotas en "Notas" lo que viste y un fallo se corrige como un
   `CAMBIOS NECESARIOS` sobre la fase que lo causó.
   - `HECHO`: sigue al paso 3. Sus "Dudas resueltas" van a `<tarea>.dudas.md`.
   - `BLOQUEADO`: analiza tú el motivo y vuelve a despachar con el brief corregido. Si lo que
     falta cambia el alcance, la parte nueva va a un plan `propuesto` y la fase sigue con lo
     suyo.
3. **Verificar:** corre la verificación proporcional del repo (`.claude/CLAUDE.comun.md` §5) con
   salida resumida. Un fallo que no causó el plan se anota en `<tarea>.dudas.md` y se sigue.
4. **Revisar:** despacha `revisor-fase` con la ruta del plan, la fase, el árbol y las "Dudas
   resueltas" del implementador, con el mismo `model` que el implementador. Si la fase condensa
   documentación, despacha además `doc-verifier`.
   - `LISTO`: sigue al paso 5. Las dudas que marque van a `<tarea>.dudas.md`.
   - `CAMBIOS NECESARIOS`: convierte cada problema en un paso concreto (archivo, ancla, qué
     cambiar) y despacha `implementador-fase` con eso. Hasta 2 rondas; una tercera, con opus.
     Una corrección de pocas líneas en un archivo la compruebas tú con `git -C <árbol> diff --
     <archivo>`; con varios archivos o un cambio de diseño, vuelve al revisor (mediciones `M-01`).
5. **Cerrar**, siguiendo `cerrar-fase` salvo la revisión: fase `[x]`, línea de Estado,
   "Decisiones" (incluidas las firmas distintas del plan), "Notas para la próxima sesión", lección
   si hubo retrabajo, y **un commit por fase** con el `Commit:` de la fase, archivos por ruta,
   sin atribución y sin push. Antes, registra en `## Mejoras propuestas` las "Sugerencias menores"
   del revisor que pasan el filtro de la regla `plan-composition`, clasificadas con los criterios
   de `aplicar-mejoras`. No las implementes.
6. Informa en **una línea** (`Fase N/M lista: <nombre> (<sha7>)`) y sigue sin esperar.

## Cuándo parar (y sólo entonces)
- La acción siguiente es irreversible y el plan no la prevé: borrar datos, tocar producción,
  actualizar un snapshot fiscal, push o merge.
- Una fase no pasa la revisión tras la ronda con opus y las siguientes dependen de ella. Si no
  dependen, revierte sus archivos (`git -C <árbol> checkout -- <rutas>` y borra los que creó),
  déjala `[ ]` con la nota en `<tarea>.dudas.md` y sigue.

Al parar: deja el plan y `<tarea>.dudas.md` al día, explica en máximo 5 líneas qué pasó y qué
necesitas, y espera. Cuando responda, retoma desde la fase pendiente.

## Al terminar el plan
Estado `terminado`, plan y `<tarea>.dudas.md` a `terminados/` de su carpeta, poda de lecciones
ya promovidas, commit, y resumen en máximo 8 líneas: fases, commits, decisiones relevantes,
lecciones nuevas y pasos de deploy en orden. Después presenta `<tarea>.dudas.md`: primero las
`[comportamiento]`, cada duda con la opción tomada, y los planes `propuesto` que se escribieron. Si hay mejoras pendientes, una
tabla corta (id, mejora, repo, complejidad, modelo) y que se aplican con `/aplicar-mejoras
<tarea>`. Cierra proponiendo en una línea, en este orden, el merge de cada repo con el script
(`merge`, `publicar` y `cerrar`, `.claude/CLAUDE.comun.md` §2) y actualizar el grafo de cada repo
tocado, y el cross-repo si el plan cruzó repos (skill `discovery`); nada de eso sin el sí, y el
merge, además, sólo tras el sí del usuario sobre las dudas `[comportamiento]`.
