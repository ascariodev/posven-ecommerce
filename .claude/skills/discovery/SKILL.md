---
name: discovery
description: Encontrar código, símbolos y arquitectura en posveapi, posvenapp o posven-ecommerce antes de grepear o proponer código nuevo. Úsala ante cualquier pregunta de cómo funciona algo, dónde vive una capacidad o qué se rompe si se cambia un símbolo.
argument-hint: "[capacidad o símbolo]"
model: sonnet
effort: medium
---

# Descubrimiento

Es el §3 de `.claude/CLAUDE.comun.md` hecho procedimiento. Se aplica en todo momento de la
conversación, no sólo en la primera pregunta.

Grafos (carpeta oculta en la carpeta padre de los repos, `<padre>`;
`G=<padre>/.graphify-workspace`):

| Pregunta sobre | `--graph` |
|---|---|
| posveapi (backend o SPA Vue) | `$G/posveapi/graphify-out/graph.json` |
| posvenapp (TPV) | `$G/posvenapp/graphify-out/graph.json` |
| posven-ecommerce (buscador web) | `$G/posven-ecommerce/graphify-out/graph.json` (se construye a pedido; si no existe, Grep y Glob) |
| algo que cruza API y TPV (payload, sync, evento) | `$G/cross-repo/graph.json` |

## Cuál orden

- **"¿Dónde consigo X?"** (una capacidad, un endpoint, el módulo dueño de algo) → orden de
  capacidad.
- **"¿Quién llama a esto? ¿Qué se rompe si lo cambio?"** (ya puedes nombrar el símbolo) → orden
  de símbolo.

Una pregunta de capacidad que se vuelve de símbolo cambia de orden en ese momento.

## Orden de capacidad

1. **Índice de capacidades** del repo, si existe: `docs/CAPABILITIES.md` (lo genera
   `node .claude/scripts/generate-index.mjs <repo>` desde el frontmatter de los README de módulo).
2. **README del módulo** (`docs/modules/<modulo>/README.md` en posveapi, `<carpeta>/README.md` en
   posvenapp, `features/<dominio>/README.md` y `lib/marketplace/README.md` en posven-ecommerce),
   por la sección que la pregunta pide: "Dónde hacer cambios", reglas `RN-`, API.
   Si el módulo tiene README, se abre siempre; nunca entero si es grande.
3. **Specs** con la skill `spec-lookup` si la capacidad se diseñó hace poco.
4. **Grafo**: `graphify query "<término>" --graph <ruta>` con uno o dos términos acotados, sólo
   para orientarse: una pregunta larga en lenguaje natural arranca de coincidencias sueltas y el
   tope de `--budget` (2000 tokens) la corta en ruido. En cuanto aparece un símbolo, pasa al orden
   de símbolo.
5. **Búsqueda directa**: Grep/Glob dirigidos, lectura por rangos, lecturas independientes en el
   mismo turno.

## Orden de símbolo

1. **Grafo**:

   ```bash
   graphify explain "<Simbolo>" --graph <ruta>    # aristas y quién lo usa
   graphify affected "<Simbolo>" --graph <ruta>   # antes de cambiarlo: qué se rompe, tests incluidos
   graphify query "<término>" --graph <ruta>      # término vago; --dfs sólo existe en query
   graphify path "A" "B" --graph <ruta>           # cómo se conectan dos nodos
   ```

   `explain` y `affected` primero; `query` no reemplaza a ninguno de los dos. Si el nombre es
   ambiguo, el grafo lista los ids candidatos: reintenta con el id (o la ruta relativa al repo),
   nunca caigas a Grep por eso. Para un método privado, ancla la consulta en la clase o el
   componente que lo contiene.
2. **Lectura de lo que devolvió el grafo**: el grafo dice quién usa qué, no cómo (si una consulta
   filtra por un campo, qué valor pasa). Eso se lee por rangos en las líneas que `affected` o
   `explain` citaron, no grepeando el repo.
3. **README del módulo** donde aterrizó el grafo.
4. **Búsqueda directa**, acotada a los archivos que devolvió el grafo salvo que el nodo no exista.

Al despachar un subagente que explora, el texto nombra el símbolo de partida y el comando
(`explain`/`affected` con su `--graph`), no sólo "consulta el grafo", y cita esta skill.

## Fallback y límites

- Grep es la entrada correcta para una cadena literal (un mensaje de error, una clave de config)
  o cuando el grafo no tiene el nodo; no hace falta anunciarlo.
- Antes de cambiar o quitar algo exportado o un campo de un Resource, `graphify affected` (y en
  el grafo cross-repo si lo consume el TPV). Dentro de un plan, cruza además el diff acumulado de
  la rama, que incluye lo sin commit:
  `git -C <árbol> diff --name-only -G'<Simbolo>' $(git -C <árbol> merge-base <rama base> HEAD)`.
  El grafo no ve los llamadores que agregaron las fases anteriores; esos archivos se leen igual.
- El grafo es una foto, compartida por todas las sesiones, y no se actualiza solo. Si no coincide
  con el código reciente, dilo. Nunca se actualiza entre fases de un plan; sí al terminarlo (lo
  proponen `ejecutar-plan` y `cerrar-fase`) o a pedido del usuario. Por cada repo tocado, primero
  comprueba que el checkout principal esté en su rama base y al día con el remoto
  (`.claude/CLAUDE.comun.md` §2); si no lo está, dilo y no actualices ese grafo hasta que el usuario decida:

  ```bash
  git -C "<padre>/<repo>" rev-parse --abbrev-ref HEAD   # dev o main
  git -C "<padre>/<repo>" status -sb | head -1          # sin "behind"
  GRAPHIFY_OUT="<padre>/.graphify-workspace/<repo>/graphify-out" graphify update "<padre>/<repo>"
  ```

  Sólo AST, sin LLM. Sin `GRAPHIFY_OUT` escribe `graphify-out/` dentro del repo: bórralo. Lee el
  checkout principal, así que un plan hecho en un worktree se refleja recién cuando su rama llega
  ahí. Si el plan cruzó repos, rehaz el cross-repo con los tres grafos:
  `graphify merge-graphs <api> <app> <ecommerce> --out "<padre>/.graphify-workspace/cross-repo/graph.json"`.
- Si `graphify` no está disponible, dilo en una línea y sigue con README y búsqueda directa; no
  se da el grafo por consultado.
