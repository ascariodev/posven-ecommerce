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

1. Toma la primera fase sin marcar (`### [ ]`) y lee "Contexto mínimo", "Decisiones" y "Notas para
   la próxima sesión". Lee `docs/conventions/lessons.md` del repo de la fase.
2. Confirma árbol y rama: el árbol es el worktree de la tarea en ese repo (si no existe, `crear`
   del script de `.claude/CLAUDE.comun.md` §2), nunca el checkout principal, y
   `git -C <árbol> rev-parse --abbrev-ref HEAD` es la rama del plan.
3. Resúmeme en 3–5 líneas qué vas a hacer y qué archivos vas a tocar.
4. **Revisión de tamaño, antes de tocar código:** comprueba que la fase sigue cumpliendo
   `.claude/rules/plan-composition.md`. Si no, o si hay dependencias que el plan no preveía,
   NO empieces: propón cómo dividirla, actualiza el plan cuando lo apruebe y toma la primera
   subfase.
5. Implementa SOLO esa fase. Descubrimiento con el grafo primero (`.claude/CLAUDE.comun.md` §3):
   `graphify query|explain|path ... --graph <padre>/.graphify-workspace/<repo>/graphify-out/graph.json`
   (`<padre>`: carpeta padre de los repos; o `cross-repo/graph.json` si la pregunta cruza backend
   y TPV), y `graphify affected` cruzado
   con el diff acumulado del plan (skill `discovery`) antes de cambiar o quitar un símbolo
   exportado o un campo del contrato API-TPV. Después, Grep dirigido y lectura por rangos. Si el
   grafo no coincide con el código, dilo; no se actualiza entre fases.
   Lee a mano las `.claude/rules/` de los archivos que vas a crear.
6. **Durante la implementación**, detente y avísame si:
   - Necesitas modificar archivos que no estaban previstos.
   - Llevas dos intentos fallidos con el mismo problema.
   - La sesión ya se siente larga (muchas lecturas o salidas de comandos).
   En esos casos, propón cerrar lo estable con `/cerrar-fase` y mover el resto a una fase nueva.
7. Al terminar, verifica el "Terminado cuando" con el comando proporcional del repo y avísame con
   su salida real. No pases a la siguiente fase ni hagas commit: eso es `/cerrar-fase`.
