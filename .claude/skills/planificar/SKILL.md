---
name: planificar
description: Crea el plan por fases de una tarea grande en posveapi, posvenapp, posven-ecommerce o que cruza repos. Úsala cuando el usuario quiera planificar, diseñar el paso a paso o dividir en fases una funcionalidad, flujo, migración o refactor, antes de implementar.
argument-hint: <nombre-de-la-tarea> <descripción>
model: opus
effort: high
---

Vamos a planificar esta tarea: $ARGUMENTS

Si no llegaron argumentos, toma la tarea de lo que el usuario acaba de pedir y propón un nombre
corto en kebab-case. Si la tarea no está clara, pregunta antes de explorar.

Todo el análisis se hace aquí: la ejecución sólo implementa. Un plan que deja algo por
investigar, decidir o ubicar hace que el implementador analice (tokens) o pregunte (paradas). La
vara: cada fase se puede implementar sin abrir un archivo que no nombra ni elegir entre dos
caminos.

1. **Fundamentar**, sin cargar documentos enteros:
   - La spec con `spec-lookup`, sección por sección. Sin spec y con decisiones de diseño
     pendientes, primero `design-phase`.
   - `docs/conventions/lessons.md` de cada repo que toca: las lecciones que aplican se citan por
     id en las Restricciones o en la fase.
   - Para el código existente, el grafo primero (`graphify query|explain|path ... --graph
     <padre>/.graphify-workspace/<repo>/graphify-out/graph.json`, con `<padre>` la carpeta padre
     de los repos, o `cross-repo/graph.json` si la tarea cruza backend y TPV), con la skill
     `discovery` o un subagente `Explore` que lo consulte antes de grepear y devuelva sólo
     archivos, líneas y cómo encajan. Después, Read por rangos de lo que el grafo señaló.
     `graphify affected` por cada símbolo o campo de contrato que el plan cambia o quita: cada
     llamador queda en el `Archivos` de alguna fase. Si el grafo parece rancio, dilo y pregunta
     antes de reconstruirlo; donde no alcanza, Grep dirigido.
   - Las **Vías**, la **Transición** y los **Arrastres** de la regla `.claude/rules/plan-cobertura.md` (léela a
     mano), buscadas por el efecto en el grafo y con Grep, no sólo por `affected`.
2. **Cerrar las dudas antes de escribir.** Junta todo lo que el código y la spec no resuelven
   (comportamiento, nombres visibles, casos borde, compatibilidad, datos existentes, vías que
   quedarían fuera, orden del deploy) y pregúntalo
   en una sola tanda, cada pregunta con su opción recomendada primero. Lo que el usuario no
   contesta o delega se decide con la recomendada. Toda respuesta va a "Decisiones". El plan no
   queda con "por definir", "evaluar", "investigar" ni "si hace falta".
3. Crea el plan desde `.claude/docs/plans/_plantilla.md` en `<repo>/docs/plans/<tarea>.md`; si
   cruza repos, en el espacio de quien coordina (`posven/.claude/docs/plans/<tarea>.md`, si existe;
   si no, un plan por repo).
4. Divide en fases según `.claude/rules/plan-composition.md` (léela a mano: crear el plan no
   la dispara). **Toda fase lleva su brief completo** según la regla, no sólo la primera: repo,
   archivos con ancla, pasos concretos, "Terminado cuando" con el comando del repo y commit
   (conventional commit en español, sin atribución). Marca `[riesgo]` donde la regla lo indica y
   agrega la fase `[pantalla]` si el plan cambia una pantalla.
5. **Tamaño del plan:** si pasa del límite de la regla (líneas o fases), divídelo en planes
   encadenados (`<tarea>-a`, `<tarea>-b`...), cada uno con su objetivo verificable y su línea
   "Depende de". Se presentan juntos y se aprueban de una vez.
6. Revisa el plan contra la regla: brief completo en cada fase, sin verbos de análisis en los
   pasos, sin contradicciones entre fases ni con las Restricciones, cada llamador de `affected`
   cubierto, y "Decisiones" con todo lo resuelto en el paso 2. Después despacha el agente
   `revisor-plan` (`model: opus`) con la ruta de cada plan y las ramas, sin tus conclusiones;
   corrige cada problema que reporte y vuelve a despacharlo si cambiaste fases (máximo 2 rondas).
   Lo que decidas no corregir va a "Decisiones" con el motivo.
7. No implementes nada. Muéstrame una tabla resumen (plan, fase, repo, nº de archivos, riesgo),
   las líneas de cada plan, las vías que quedan fuera, lo que pide la transición en el deploy y
   las decisiones tomadas con la opción recomendada sin que yo las contestara, y espera mi
   aprobación. Aprobado, propón el commit del plan en su repo.
