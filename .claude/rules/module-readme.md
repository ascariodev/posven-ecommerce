---
paths:
  - "**/docs/modules/**/README.md"
  - "**/docs/conventions/README.template.md"
  - ".claude/docs/conventions/module-readme.md"
  - "posvenapp/*/README.md"
  - "posvenapp/**/README.md"
  - "posven-ecommerce/features/*/README.md"
  - "posven-ecommerce/lib/marketplace/README.md"
  - "features/*/README.md"
  - "lib/marketplace/README.md"
---

# Escritura de un README de módulo

El contrato (frontmatter, secciones, reglas `RN-`) vive en
`.claude/docs/conventions/module-readme.md`. Esto es cómo se escribe una ficha que no
afirme cosas falsas: un README puede cumplir el contrato y aun así ser falso.

1. **Toda afirmación de las secciones 3 a 9 se puede señalar con `archivo:línea` leído en esta
   tarea.** Antes de commitear se relee con el código al lado, nunca de memoria.
2. **Sin narrativa de plan**: nada de "Task N", "fase N", "todavía no", "por ahora", "cuando
   exista". Una regla que vale hoy se escribe como decisión con su porqué.
3. **El ejemplo de la sección 7 es real**: rutas, nombres y parámetros que existen hoy.
4. **`exports` y la sección 4 son la misma lista**, en las dos direcciones y en el mismo commit.
5. **Mínimo no es incompleto**: frontmatter completo, Propósito, reglas con su test, al menos una
   capacidad, al menos una fila real en "Dónde hacer cambios", y la sección 4 con exactamente lo
   de `exports`. "Ninguna." sólo en las secciones 5 a 9 que de verdad no tienen nada.
6. **`verified_against` lleva las rutas que se leyeron**; sin ella `docs-check.mjs` no puede
   detectar la ficha rancia.
7. **El enunciado de una regla `RN-` no pasa de 240 caracteres.**
8. Tras tocar `capabilities`, `node .claude/scripts/generate-index.mjs <repo>` y se
   commitea `docs/CAPABILITIES.md` junto.
