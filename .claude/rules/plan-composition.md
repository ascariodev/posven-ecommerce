---
paths:
  - "**/docs/plans/**"
  - ".claude/docs/plans/**"
---

# Composición de fases en un plan

Copia única del criterio: la aplican `planificar`, `siguiente-fase`, `ejecutar-plan` e
`implementador-fase`.

## Dónde vive

`<repo>/docs/plans/<tarea>.md`. Si cruza repos, en el espacio de quien coordina
(`posven/.claude/docs/plans/<tarea>.md`, si existe; si no, un plan por repo). Se crea desde
`.claude/docs/plans/_plantilla.md`. Cerrado, va a `terminados/` de su misma carpeta.

## Tamaño de una fase

Cumple todo:

1. Máximo ~5 archivos modificados, sin contar tests.
2. Un solo objetivo: si el nombre necesita un "y", son dos fases.
3. Un criterio de terminado verificable, idealmente un test con su comando.
4. El repo queda funcionando: compila y los tests existentes pasan.

## Cuándo se separa aunque quepa

1. **Otro repo**: una fase commitea en un solo repo (posveapi, posvenapp, posven-ecommerce y,
   para quien coordina, posven/.claude). El backend va primero; el TPV tolera el campo ausente.
2. **Reversión aislada**: una migración, o un cambio de endpoint o de payload que el TPV consume.
3. **Decisión sin confirmar**: una parte depende de algo que el usuario no decidió.

## Qué va junto

Los cambios que dependen entre sí o comparten test o fixture, y el código de un módulo con su
README. Prueba rápida: si para revisar la fase N hace falta el diff de la N+1, son una sola.

## Riesgo

`[riesgo]` en el título si toca integridad fiscal, multiempresa (`company_id`), el contrato
API-TPV, migraciones, pagos o dinero real, o código que no se exploró a fondo. Esas fases se
hacen más chicas y se implementan con opus.

## Mejoras propuestas

Lo que surge y no se implementa (sugerencias del revisor, pendientes del implementador) va a
`## Mejoras propuestas` del plan como `- [ ] M-<n>` clasificada, nunca como fase, sólo si es un
defecto que puede ocurrir hoy, escrito con su escenario (entrada o estado y resultado erróneo).
Un test, un documento o un ajuste de una línea se hace en el mismo commit o se descarta; lo
defensivo, lo hoy inalcanzable, el estilo y la optimización sin medición se descartan. Sin este
filtro la lista no converge: cada revisión agrega lo que la anterior destapó.

Una mejora que se decide no hacer queda como `- [-] M-<n>` con `Descartada: <motivo>`. La
clasificación y su aplicación viven en la skill `aplicar-mejoras`; una mejora alta de más de ~5
archivos se convierte en plan nuevo.
