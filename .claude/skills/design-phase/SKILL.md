---
name: design-phase
description: Diseñar lo que todavía no tiene spec (un rasgo nuevo, una decisión abierta, una discrepancia que hay que resolver antes de tocar código) y dejarlo escrito en docs/specs/. Úsala cuando el trabajo necesita una decisión de diseño y no un plan, y cuando planificar se topa con algo que la spec no cubre.
argument-hint: "[la pregunta o el rasgo a diseñar]"
model: opus
effort: high
---

# Diseñar antes de planificar

Tramo anterior a `planificar`: se decide lo que no está escrito, con la aprobación del usuario
como compuerta, y queda la spec que el plan va a citar.

## 1. Anuncia el camino antes de preguntar

Dilo en una línea antes de la primera pregunta, para que el usuario lo pueda cambiar:

| Camino | Qué es | Qué produce |
|---|---|---|
| **sondeo** | pregunta de viabilidad: ¿se puede? | una recomendación; nota corta en la spec si vale la pena |
| **acotado** | cambio delimitado sobre un flujo que ya existe en el repo | diseño corto en el chat; spec de una o dos secciones si toca contrato o reglas de negocio |
| **arquitectónico** | subsistema nuevo, contrato que otros consumen, cambio que cruza API y TPV | spec completa, aprobada sección por sección |

La complejidad escondida sube de camino (se anuncia y se retoma desde §2); nada baja. Ante la
duda, el más pesado.

## 2. Entender antes de proponer

- **Una pregunta por mensaje** mientras se entiende; opción múltiple cuando se pueda.
- **`spec-lookup`** sobre lo que ya está escrito y **`discovery`** sobre lo que ya existe: un
  diseño que reinventa una capacidad existente es un defecto.
- Si cruza repos, identifica en el grafo cross-repo el par productor/consumidor y el orden de
  deploy (backend primero, consumidor tolerante al campo ausente).
- **Dos o tres enfoques** con lo que cuesta y lo que cierra cada uno, y **una recomendación**.
- YAGNI: fuera todo lo que no pide el objetivo.

## 3. La compuerta no escala con el tamaño

Lo que escala es el artefacto; la aprobación del usuario no se salta en ningún camino.

- Presentar el diseño y empezar a implementarlo en el mismo turno es saltarse la compuerta.
- El arquitectónico se presenta por secciones (arquitectura, datos y contrato, flujo, errores,
  verificación), con aprobación por sección.
- Una decisión abierta se cierra con el usuario y queda escrita; un default elegido en silencio
  salta la compuerta.

## 4. La salida

- Ubicación: `<repo>/docs/specs/YYYY-MM-DD-<tema>-design.md`; si cruza repos, en el
  espacio de quien coordina (`posven/.claude/docs/specs/`, si existe; si no, una spec por repo).
  Se enmienda la spec del rasgo si ya existe; no se abre otra
  paralela del mismo tema.
- Secciones numeradas `## N.` para citarlas sueltas. Encabezado con fecha, estado (borrador,
  aprobado) y repos que toca.
- Lo construido para un sondeo se etiqueta como desechable en el mensaje y en la spec.
- La spec se commitea en su repo (conventional commit en español, `docs(<área>): ...`) cuando el
  usuario la aprueba; en posveapi, posvenapp o posven-ecommerce, pregunta antes si la rama actual es la correcta.

## 5. Autorrevisión antes de la compuerta

1. **Marcadores**: ningún "por definir", nombre provisional ni cifra de ejemplo.
2. **Contradicciones** entre secciones.
3. **Alcance**: si no entra en un plan, la spec dice cómo se descompone (criterio en la regla
   `.claude/rules/plan-composition.md`), y eso se aprueba con el resto.
4. **Ambigüedad**: un requisito con dos lecturas se resuelve; la que quede escrita la implementa
   alguien que no estuvo en esta conversación.

Lo que no puedas cerrar solo va junto, en un mensaje, al presentar para aprobación.

## 6. Estado terminal: `planificar`

Un diseño aprobado va a `planificar`. Esta skill no implementa ni escribe fases. Un acotado
aprobado en el chat, sin contrato ni reglas nuevas, puede ir directo a implementación con
`close-task` al final, si el usuario lo prefiere.

| Excusa | Realidad |
|---|---|
| "Es chico, no necesita aprobación" | Escala el artefacto, nunca la compuerta. |
| "Presento y arranco, lo va a aprobar" | Eso es saltarse la compuerta. |
| "Junto cinco preguntas para no interrumpir" | Vuelven tres respuestas y dos malentendidos. |
| "El default es obvio" | Se cierra con el usuario y queda escrito. |
