---
name: siguiente-fase
description: Retoma una tarea grande desde su plan por fases e implementa solo la siguiente fase pendiente. Úsala cuando el usuario quiera seguir, continuar o retomar un plan o la siguiente fase.
argument-hint: <nombre-de-la-tarea>
model: sonnet
effort: medium
---

Retoma el plan `$ARGUMENTS`: está en `<repo>/docs/plans/$ARGUMENTS.md` o, en el
espacio de quien coordina, en `posven/.claude/docs/plans/$ARGUMENTS.md`.

Si no llegaron argumentos, usa el plan activo que indicó el hook `plan-state` al iniciar la
sesión. Si hay más de uno, o ninguno, pregunta cuál.

La fase trae su brief completo (regla `plan-composition`): se implementa sin preguntar. Las
dudas y los arreglos que piden plan se resuelven según "Dudas y planes nuevos durante la
ejecución" de esa regla.

1. Toma la primera fase sin marcar (`### [ ]`) y lee "Contexto mínimo", "Decisiones" y "Notas para
   la próxima sesión". De `docs/conventions/lessons.md` del repo, sólo las `L-n` que cita el plan.
2. Confirma árbol y rama: el árbol es el worktree de la tarea en ese repo (si no existe, `crear`
   del script de `.claude/CLAUDE.comun.md` §2), nunca el checkout principal, y
   `git -C <árbol> rev-parse --abbrev-ref HEAD` es la rama del plan. Si el plan de su "Depende
   de" no está `terminado`, pregunta antes de seguir.
3. Resúmeme en 3–5 líneas qué vas a hacer y qué archivos vas a tocar, y sigue sin esperar.
4. Implementa SOLO esa fase, leyendo por rangos los archivos y anclas que nombra. Lee a mano las
   `.claude/rules/` de los archivos que vas a crear. Si un ancla no está donde dice el plan,
   ubícala con el grafo (`graphify query|explain ... --graph
   <padre>/.graphify-workspace/<repo>/graphify-out/graph.json`, `<padre>` la carpeta padre de los
   repos; o `cross-repo/graph.json`) o un Grep dirigido; no se actualiza entre fases. Antes de
   cambiar o quitar un símbolo exportado o un campo del contrato API-TPV que la fase no lista,
   `graphify affected` cruzado con el diff del plan (skill `discovery`).
5. Un archivo no previsto que es consecuencia directa de la fase se toca y se anota en
   `<tarea>.dudas.md`; lo que cambia el alcance va a una fase nueva del plan o a un plan
   `propuesto`. Si la sesión ya se siente larga, propón cerrar lo estable con `/cerrar-fase` y
   mover el resto a una fase nueva.
6. Al terminar, verifica el "Terminado cuando" con el comando proporcional del repo y avísame con
   su salida real y las dudas que anotaste. No pases a la siguiente fase ni hagas commit: eso es
   `/cerrar-fase`.
