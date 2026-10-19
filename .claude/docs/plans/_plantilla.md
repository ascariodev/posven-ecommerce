# Plan: <nombre de la tarea>

**Objetivo:** <qué debe quedar funcionando al final, en 1–2 líneas>
**Estado:** en curso · Fase actual: 1
<!-- El hook plan-state busca "en curso" en esta línea. Al terminar el plan: "terminado". -->
<!-- Mantén el plan corto: detalla solo la fase siguiente; las lejanas, en 2–3 líneas.
     Criterios de tamaño y cuándo se separa una fase: regla plan-composition. -->

## Contexto mínimo
<!-- Solo lo que una sesión nueva necesita saber para arrancar. -->
- Spec: `<ruta#sección>` o "sin spec"
- Repos y ramas: `<repo>` en `<árbol, ruta absoluta>`, rama `<rama>` (una línea por repo)
- Restricciones: <invariantes que toca: fiscal, multiempresa por company_id, contrato API-TPV,
  migraciones aditivas en SQLite...>
- Archivos principales: `...`

## Fases
<!-- Una fase = una sesión: máx. ~5 archivos sin contar tests, un solo objetivo, un criterio
     verificable, el repo funcionando al terminar, y un solo repo. Backend antes que TPV.
     Marcar con [riesgo] las fases con incertidumbre alta: se despachan con opus. -->

### [ ] Fase 1 — <nombre>
- **Repo:** <posveapi | posvenapp | posven-ecommerce | posven/.claude>
- **Alcance:** ...
- **Archivos:** `...`
- **Terminado cuando:** <test que pasa / comportamiento verificable, con el comando>
- **Commit:** `<tipo(área): resumen en español>`

### [ ] Fase 2 — <nombre>
- **Repo:** ...
- **Alcance:** ...
- **Terminado cuando:** ...

## Decisiones
<!-- Fecha — decisión — motivo. Esto reemplaza lo que se perdería al compactar. -->
- 

## Notas para la próxima sesión
<!-- Se sobrescribe al cerrar cada fase: dónde quedamos, qué falta, qué ojo tener. -->
- 

## Mejoras propuestas
<!-- Defectos que pueden ocurrir hoy y NO se implementaron (filtro en la regla plan-composition);
     se aplican con /aplicar-mejoras. Clasificación según posven/.claude/skills/aplicar-mejoras/SKILL.md.
     Descartada: `- [-] M-<n>` con `Descartada: <motivo>`.
- [ ] M-1: <qué mejorar, en una línea> (repo: <repo>)
      Complejidad: baja | media | alta · Archivos: N · Riesgo: <contrato API-TPV / BD / fiscal / seguridad / ninguno> → sonnet | opus | plan nuevo
-->
