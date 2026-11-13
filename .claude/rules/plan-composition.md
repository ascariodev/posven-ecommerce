---
paths:
  - "**/docs/plans/**"
  - ".claude/docs/plans/**"
---

# Composición de un plan

Copia única del criterio para `planificar`, la ejecución y los agentes de fase.

## Dónde vive y cuánto mide

`<repo>/docs/plans/<tarea>.md`; si cruza repos, `posven/.claude/docs/plans/<tarea>.md` (si no
existe, un plan por repo). Se crea desde `.claude/docs/plans/_plantilla.md`; cerrado, va con su
`<tarea>.dudas.md` a `terminados/`. Tope: ~250 líneas y 8 fases (objetivo ~200), Contexto
mínimo hasta ~30 líneas y cada fase ~15-25. Lo que pasa se divide en planes encadenados con su
línea "Depende de", porque quien coordina relee el plan entero.

## Brief de fase

El implementador no analiza: ejecuta el brief. Cada fase trae, resuelto al planificar:

1. **Archivos** con ruta y ancla (`archivo:línea`, método o símbolo), incluidos los llamadores
   de `graphify affected`, el README del módulo y los tests.
2. **Pasos** en imperativo y concretos: firmas, nombres, columnas, valores, mensajes, la regla
   `.claude/rules/` de cada archivo nuevo y las lecciones `L-n` que aplican. Ningún verbo de
   análisis ("revisar", "evaluar", "decidir", "investigar", "si hace falta").
3. **Terminado cuando** con el comando exacto y lo que debe dar, y **Commit**.

Las líneas Vías, Transición y Arrastres del Contexto mínimo y la fase `[pantalla]`: regla
`plan-cobertura`.

## Tamaño y separación de fases

Una fase cumple todo: máximo ~5 archivos sin contar tests; un solo objetivo (si el nombre
necesita un "y", son dos); un criterio verificable, idealmente un test; el repo queda compilando
y en verde. Se separa aunque quepa si es **otro repo** (una fase commitea en uno solo; el
backend va primero y el TPV tolera el campo ausente) o si necesita **reversión aislada** (una
migración, o un endpoint o payload que el TPV consume). Va junto lo que depende entre sí o
comparte test o fixture, y un módulo con su README: si revisar la fase N pide el diff de la
N+1, son una sola.

`[riesgo]` en el título si toca integridad fiscal, multiempresa (`company_id`), el contrato
API-TPV, migraciones, pagos o dinero real: esas fases se hacen más chicas y van con opus.

## Dudas y planes nuevos durante la ejecución

La ejecución no se detiene por una duda: se toma la opción recomendada (la que respeta el plan,
las Restricciones y el contrato vigente y es más fácil de revertir; nunca cambia un contrato
público ni el API-TPV que el plan no prevé, eso va a plan nuevo) y se anota en
`<tarea>.dudas.md` junto al plan (`- Fase N: <duda> → <opción> (alternativa: <otra>)`), que se
presenta al usuario al terminar. Lleva `[comportamiento]` tras `Fase N:` la duda cuya opción
cambia lo que ve o recibe un usuario, el TPV u otro consumidor (mensaje, código HTTP, dato,
campo), deja una vía o un caso sin cubrir o acepta un riesgo (pérdida, duplicado, ventana de
fallo); firmas, nombres internos y forma de los tests van sin marca. Las `[comportamiento]` se
presentan primero y el merge espera el sí del usuario sobre ellas. Un arreglo que no cabe en la fase ni en una mejora se escribe
como plan nuevo con Estado `propuesto` y el contexto ya reunido, se anota ahí y la ejecución
sigue; ese plan se ejecuta cuando el usuario lo pida.

## Mejoras propuestas

Lo que surge y no se implementa va a `## Mejoras propuestas` como `- [ ] M-<n>` clasificada,
nunca como fase, sólo si es un defecto que puede ocurrir hoy, con su escenario (entrada o estado
y resultado erróneo). Un test, un documento o un ajuste de una línea va en el mismo commit o se
descarta; lo defensivo, lo inalcanzable, el estilo y la optimización sin medición se descartan,
porque sin este filtro la lista no converge. Descartada: `- [-] M-<n>` con `Descartada:
<motivo>`. Clasificación y aplicación: skill `aplicar-mejoras`.
