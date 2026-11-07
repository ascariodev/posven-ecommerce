---
name: aplicar-mejoras
description: Aplica las mejoras propuestas (M-n) de un plan, eligiendo el modelo de cada una según su complejidad, con revisión y un commit por mejora. Úsala cuando el usuario pida aplicar, implementar o hacer las mejoras o sugerencias que quedaron pendientes de un plan.
argument-hint: "[nombre-de-la-tarea] [M-1 M-3 | baja | media | todas]"
model: sonnet
effort: low
---

Aplica las mejoras de `## Mejoras propuestas` de un plan. Argumentos: $ARGUMENTS

**Qué plan:** el nombrado, buscado en `<repo>/docs/plans/`, en el espacio de quien coordina
(`posven/.claude/docs/plans/`, si existe) y sus `terminados/`. Sin nombre: el plan con el que
se trabajó en esta sesión o, si no hay, el más reciente con `- [ ] M-` pendientes. Si no se
puede elegir el plan, pregunta.
**Qué mejoras:** las indicadas (`M-1 M-3`), las de un nivel (`baja`, `media`) o todas las
pendientes.

Eres el coordinador: analizas y no escribes el código, trabajas con los reportes cortos de los
subagentes. La corrida es continua: las dudas y lo que pide plan se resuelven según la regla
`plan-composition` ("Dudas y planes nuevos durante la ejecución"). Nunca `cd`: `git -C <árbol>`
y rutas absolutas.

## Criterios de complejidad
Copia única de la clasificación: la citan `ejecutar-plan`, `cerrar-fase` y la plantilla del plan.
Si una mejora no está clasificada o su clasificación parece vieja, clasifícala ahora con
`graphify affected --graph <padre>/.graphify-workspace/<repo>/graphify-out/graph.json`
(`<padre>`: carpeta padre de los repos; skill `discovery`) y un grep acotado.

| Criterio | Baja | Media | Alta |
|---|---|---|---|
| Archivos afectados, sin tests | 1–2 | 3–5 | más de 5 |
| Toca contrato API-TPV u otro público, esquema de BD, lógica fiscal, `company_id`, seguridad o integración externa | no | no | sí |
| Solución evidente | sí | mayormente | requiere investigar |
| Tests que cubren la zona | sí | parcial | no |

La mejora toma el **nivel más alto** que alcance en cualquier criterio; ante la duda, sube uno.

| Nivel | Acción |
|---|---|
| Baja o media | `implementador-fase` con `model: sonnet` |
| Alta, hasta ~5 archivos | `implementador-fase` con `model: opus` |
| Alta y más de ~5 archivos | No la implementes: escribe su plan `propuesto` (skill `planificar`, sin esperar aprobación) y sigue |

Formato de cada línea: el de `## Mejoras propuestas` en `.claude/docs/plans/_plantilla.md`.

## Antes de empezar
1. Por cada repo de las mejoras elegidas, el árbol es el worktree de la tarea, nunca el checkout
   principal; si ya se cerró, se crea con `crear` del script de `.claude/CLAUDE.comun.md` §2 (pregunta
   la rama si no es la del plan). `git -C <árbol> rev-parse --abbrev-ref HEAD` y
   `git -C <árbol> status --short` limpio.
2. Lee `docs/conventions/lessons.md` de cada repo que toca.
3. Muestra una tabla corta (id, mejora, repo, nivel, modelo) de lo que vas a aplicar; las que
   piden plan nuevo, dilo ahí. Si alguna es de posveapi, comprueba tú si Docker está arriba y
   pregunta sólo si autorizo `--no-verify`; sin esa pregunta, sigue sin esperar.

## Por cada mejora, en orden
1. Arma su brief según la regla `plan-composition` (archivos con ancla, pasos concretos, comando
   de terminado): la línea de la mejora trae el escenario, la ubicación la resuelves tú con el
   grafo y un Grep dirigido. Despacha `implementador-fase` con el brief pegado en el prompt, el
   id `M-<n>`, el repo, el árbol, la rama y el `model` de la tabla, explícito.
   - `BLOQUEADO`: analiza el motivo y vuelve a despachar con el brief corregido; si resultó más
     grande que su nivel, reclasifícala y, si es alta de más de ~5 archivos, escribe su plan
     `propuesto` y sigue con la siguiente.
   - Sus "Dudas resueltas" van a `<tarea>.dudas.md`.
2. Corre la verificación proporcional del repo (`.claude/CLAUDE.comun.md` §5) con salida resumida.
3. Despacha `revisor-fase` con la ruta del plan, el id, el árbol y las "Dudas resueltas". Sus
   problemas se convierten en pasos concretos para el implementador; hasta 2 rondas, sin la
   tercera con opus de `ejecutar-plan`. Si no pasa, revierte sus archivos en el
   árbol (`git -C <árbol> checkout -- <rutas>`, y borra los que creó), déjala `[ ]` con la nota
   en `<tarea>.dudas.md` y sigue con la siguiente.
4. Marca la mejora `[x]` en el plan, registra una lección si hubo retrabajo (regla
   `lessons-authoring`) y haz **un commit por mejora** en su repo: archivos por ruta, mensaje de
   una línea que nombre la tarea y el id, sin atribución y sin push. El cambio del plan y de
   `<tarea>.dudas.md` va en el commit de su repo (el del espacio de quien coordina,
   `posven/.claude`, si el plan vive ahí).
5. Informa en una línea (`M-<n> aplicada (<modelo>, <sha7>)`) y sigue.

Las sugerencias nuevas del revisor que pasan el filtro de la regla `plan-composition` se agregan
como nuevas `M-<n>` clasificadas; no se aplican en esta corrida salvo que el usuario lo pida.

## Al terminar
Resume en máximo 6 líneas: mejoras aplicadas con su modelo y commit, las pendientes y por qué,
los planes `propuesto` que escribiste, y pasos de deploy si alguna los requiere. Presenta
`<tarea>.dudas.md` con cada duda y la opción tomada. Propón en una línea
el merge con el script (`merge`, `publicar` y `cerrar`, `.claude/CLAUDE.comun.md` §2); no lo corras sin
el sí.
