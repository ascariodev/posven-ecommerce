---
paths:
  - "CLAUDE.md"
  - "**/CLAUDE.md"
  - ".claude/skills/**"
  - ".claude/agents/**"
  - ".claude/rules/**"
  - "**/.claude/rules/**"
  - ".claude/docs/conventions/**"
  - "**/docs/conventions/**"
  - "**/docs/modules/**"
---

# Escritura de documentación de agentes

Rige al escribir `CLAUDE.md`, reglas, skills, agentes, convenciones y README de módulo. Lo que se
carga entero se paga en cada lectura: cada línea sostiene una obligación.

1. **Cada mecanismo se explica en un solo lugar** (su regla, su skill, la cabecera de su script)
   y los demás lo citan por ruta. Una skill o un agente cita la regla, nunca la reformula: la
   copia sin enmendar es donde la regla vieja sigue vigente.
2. **El porqué en una frase**, y sólo cuando sin él la regla se aplicaría mal.
3. **Sin fechas, cifras de corridas, historia ni ids de plan**, salvo en los campos que su formato
   exige (`lessons.md`, `measurements.md`, `verified_at`). La historia vive en git.
4. **Las secciones numeradas que se citan desde fuera no se renumeran**: se condensa dentro del
   ítem o se deja un puntero.
5. **`CLAUDE.md` admite sólo lo que rige antes de leer cualquier archivo y las prohibiciones de
   acción**; lo acotable por ruta va a `.claude/rules/` con su `paths:`. Excepción: lo que rige al
   **crear** el primer archivo de un tipo va a una skill (`new-module`, `new-migration`), porque
   crear no dispara la regla.
6. **Español neutro, sin voseo, sin emojis ni rayas largas.** Roles ("quien coordina", "quien
   revisa") y no nombres de persona, salvo para atribuir una decisión.
7. **Toda afirmación sobre el árbol se comprueba** (`archivo:línea` leído, comando corrido) antes
   de escribirla. Tope orientativo: una regla, hasta ~60 líneas; una skill, hasta ~150; lo que no
   entra se parte o se cita. `node .claude/scripts/docs-check.mjs` avisa.
