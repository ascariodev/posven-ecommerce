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

1. **Fundamentar**, sin cargar documentos enteros:
   - La spec con `spec-lookup`, sección por sección. Lo que deja abierto se pregunta; sin spec y
     con decisiones de diseño pendientes, primero `design-phase`.
   - `docs/conventions/lessons.md` de cada repo que toca.
   - Para el código existente, la skill `discovery` o un subagente `Explore` que consulte primero
     el grafo (`graphify query|explain|path ... --graph
     <padre>/.graphify-workspace/<repo>/graphify-out/graph.json`, con `<padre>` la carpeta padre
     de los repos, o `cross-repo/graph.json` si la tarea cruza backend y TPV) y devuelva solo archivos relevantes y cómo encajan.
     `graphify affected` por cada símbolo o campo de contrato que el plan cambia o quita: sus
     llamadores son archivos de alguna fase. Si el grafo parece rancio, dilo y pregunta antes de
     reconstruirlo.
2. Crea el plan desde `.claude/docs/plans/_plantilla.md` en `<repo>/docs/plans/<tarea>.md`; si
   cruza repos, en el espacio de quien coordina (`posven/.claude/docs/plans/<tarea>.md`, si existe;
   si no, un plan por repo).
3. Divide en fases según `.claude/rules/plan-composition.md` (léela a mano: crear el plan no
   la dispara). Cada fase nombra su repo, sus archivos, su "Terminado cuando" con el comando de
   verificación del repo y su commit (conventional commit en español, sin atribución).
4. Marca con `[riesgo]` las fases que la regla indica y hazlas más chicas.
5. Revisa el plan contra la regla y divide lo que no cumpla. Barre contradicciones entre fases o
   con las Restricciones.
6. "Contexto mínimo" solo con lo indispensable para arrancar una sesión nueva: spec, repos,
   árboles y ramas, restricciones y archivos principales. Solo la fase 1 va detallada; las demás,
   en 2–3 líneas.
7. No implementes nada. Muéstrame una tabla resumen (fase, repo, nº de archivos, riesgo), dime
   qué fases quedaron en el límite y espera mi aprobación. Aprobado, propón el commit del plan en
   su repo.
