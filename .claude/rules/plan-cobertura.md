---
paths:
  - "**/docs/plans/**"
  - ".claude/docs/plans/**"
---

# Cobertura de un plan

Lo que el plan resuelve al planificar para no dejar huecos que la ejecución descubre tarde. Lo
aplican `planificar`, el agente `revisor-plan` y la ejecución.

## Contexto mínimo: Vías, Transición y Arrastres

- **Vías:** toda entrada que produce el efecto que el plan agrega o cambia (un consumo de stock:
  venta en línea, lote, nota de crédito, orden de entrega, ajuste; un campo de una entidad: cada
  formulario, importador y sync que la escribe) y todo lector del estado nuevo (reportes, cierre,
  sync completo e incremental). Se buscan por el efecto, no por el símbolo: `graphify affected`
  da quién llama a lo que cambia, no las otras rutas que hacen lo mismo. Cada vía va al
  `Archivos` de una fase o a "Decisiones" con el motivo de quedar fuera.
- **Transición:** el estado de partida. Datos existentes (filas sin el campo, tablas que nacen
  vacías), el TPV con versión o caché anterior hasta su próxima carga completa, y el orden del
  deploy (`migrate`, `queue:restart`, OTA, resync) con qué pasa si una pieza llega antes que
  otra. Lo que se resuelve en código va a una fase; un paso manual de deploy, sólo sin
  alternativa en código y anotado en "Decisiones".
- **Arrastres:** lo que otros planes dejaron para este. Se leen el `<tarea>.dudas.md`,
  "Decisiones", "Notas" y "Mejoras propuestas" de cada plan de "Depende de" y de los planes de la
  misma spec, buscando `[arrastre: <este plan>]` y, en los escritos antes de la marca, el nombre
  o la letra del plan ("queda para el plan C"). Cada arrastre va a una fase o a "Decisiones" con
  el motivo de pasarlo de nuevo.

Quien deja algo para un plan posterior (al planificar, en una duda, en una nota o al cerrar)
escribe `[arrastre: <plan>]` en esa línea, con el nombre del plan o su letra en la spec.

## Fase `[pantalla]`

Un plan que cambia una pantalla termina con una fase `[pantalla]`: escenario por vía tocada
(entorno local, empresa y datos de prueba de seeds o fixtures, pasos, resultado esperado). La
corre quien coordina en el navegador, no el implementador; si no hay entorno o datos para
correrla, el cierre la informa como "no verificado en pantalla" con el escenario para el usuario.
