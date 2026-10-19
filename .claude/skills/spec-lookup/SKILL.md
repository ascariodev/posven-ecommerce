---
name: spec-lookup
description: Leer sólo la sección que hace falta de una spec o un plan (docs/specs, docs/plans de cada repo o del espacio de quien coordina) sin cargar el documento entero. Úsala cuando una tarea necesita lo que una spec dice sobre un mecanismo, una decisión o una fase, o para saber si algo ya se diseñó.
argument-hint: "[tema, o archivo y número de sección]"
model: sonnet
effort: low
---

# Consulta de spec

Specs y planes son un documento fechado por rasgo. Primero se elige el documento, después la
sección; ninguno se lee entero por costumbre.

Ubicaciones:

- `posveapi/docs/specs/`, `posveapi/docs/plans/`
- `posvenapp/docs/specs/`, `posvenapp/docs/plans/`
- `posven-ecommerce/docs/specs/`, `posven-ecommerce/docs/plans/`
- en el espacio de quien coordina, si existe: `posven/.claude/docs/specs/`,
  `posven/.claude/docs/plans/` (lo que cruza repos, y el histórico de nómina, contabilidad e
  imprenta digital)

## 1. Elegir el documento

```bash
P="<padre>"   # carpeta padre de los repos
grep -Hm1 '^# ' "$P"/posveapi/docs/specs/*.md "$P"/posvenapp/docs/specs/*.md "$P"/posven-ecommerce/docs/specs/*.md "$P"/.claude/docs/specs/*.md 2>/dev/null
```

Si el tema no aparece en los títulos, `grep -ril "<término>"` sobre esas carpetas.

## 2. Normativo o descriptivo

Un `-design.md` dice lo que debe pasar; un plan ya ejecutado cuenta lo que se hizo, y su
"Cierre" puede registrar desvíos. El encabezado dice el estado:

```bash
sed -n '1,12p' "$SPEC"
```

Si el código contradice una spec normativa vigente, el código es el defecto salvo que la tarea
sea cambiar la decisión. Una spec vieja cuyo rasgo ya evolucionó se lee como retrato de su fecha.

## 3. Una sección

```bash
grep -n '^## \|^### ' "$SPEC"                          # índice
awk '/^## 4\./{f=1} f&&/^## 5\./{exit} f' "$SPEC"      # sección completa
awk '/^### 6\.1/{f=1} f&&/^### 6\.2/{exit} f' "$SPEC"  # subsección
```

Si el documento no numera sus secciones, usa el `grep -n` y lee el rango con Read (`offset`,
`limit`). Los números de línea se calculan cuando hacen falta; no se escriben dentro de una spec.

## Cuándo

- Antes de implementar una tarea de un plan que cita una spec.
- Cuando código y documento no coinciden, antes de decidir quién gana.
- Nunca para reconstruir el documento entero: una tarea que lo necesita entero está mal partida.
