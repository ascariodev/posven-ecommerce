---
paths:
  - "**/docs/conventions/lessons.md"
---

# Lecciones

## Qué califica

Un error que se repetiría en otra parte del repo o en otra tarea. Un error puntual que el commit
ya corrigió no es lección.

## Formato

`## L-<nn>` (estable, nunca reutilizado; un id podado se recupera con
`git log -S 'L-nn' -- docs/conventions/lessons.md`) + la regla en dos o tres líneas, sin
narrativa ni culpables + una línea `aplicada en: <ruta entre comillas invertidas>` o
`aplicada en: pendiente: <quién o qué plan lo construye>`. `pendiente` sin dueño no vale.

## Promover es el punto

Una lección que se puede hacer cumplir mecánicamente (regla de `.claude/rules/`, test, hook,
casilla de `close-task`) se promueve en la misma tarea o en una nombrada, y `aplicada en:` dice a
dónde fue.

## Poda

Se lee antes de implementar cada fase, así que cabe en una pantalla: máximo ~40 líneas.
Al cerrar un plan (última fase en `cerrar-fase` o final de `ejecutar-plan`) se podan las entradas ya promovidas cuya
aplicación sobrevivió el plan, previa comprobación de que su `aplicada en:` contiene la exigencia.
No se podan las `pendiente`, ni una promovida que registra además una deuda abierta, ni la que
sólo sostiene un documento que alguien tendría que recordar: ésa es su único enforcement.
`node .claude/scripts/docs-check.mjs` lista candidatas y `aplicada en:` rotas.
