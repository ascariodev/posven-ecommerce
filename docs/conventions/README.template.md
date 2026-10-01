---
module: ""                  # p. ej. "search"
path: ""                    # p. ej. "features/search"
type: ""                    # "feature" | "infra" | "integration" | "util"
exports: []
depends_on: []
tests: ""                   # en __tests__/, p. ej. "features/cart/__tests__/*.test.ts"
verified_against: []        # rutas leídas al escribir la ficha; obligatoria
capabilities:
  - intent: ""
    intent_aliases: [""]
    entrypoint: ""          # "funcion()" o "<Componente />"
    file: ""
    input: ""
    output: ""
    source: ""              # API de posveapi vía BFF, cookie, URL
    rules: [""]
---

# Módulo `<nombre>`

## 1. Propósito

<!-- 2 o 3 líneas: qué resuelve para quien busca, qué NO hace. 600 caracteres máximo. -->

## 2. Reglas de negocio

| Regla | Enunciado | Test que la hace cumplir |
|---|---|---|
| `RN-<MODULO>-01` |  |  |

## 3. Dónde hacer cambios

| Tipo de cambio | Dónde va | Además hay que |
|---|---|---|
|  |  |  |

## 4. API pública

<!-- Componentes, funciones de servidor y tipos exportados: firma completa con tipos y ruta. -->

## 5. Estructura interna

| Pieza | Archivo | Responsabilidad |
|---|---|---|

## 6. Dependencias

<!-- Por ruta, sin versiones (viven en package.json). -->

## 7. Ejemplo de uso

```tsx

```

## 8. Restricciones

<!-- Montos sin cálculo en el frontend, sin llamadas del navegador a posveapi, contrato en
     lib/marketplace/. Una por línea. -->

## 9. Pruebas

- Comando: el de la sección Verificación de `posven-ecommerce/CLAUDE.md`
- `features/<dominio>/<archivo>.test.ts`: <qué cubre, en una línea>

<!--
Borrar este bloque al terminar. Copiar a features/<dominio>/README.md o a
lib/marketplace/README.md, con el frontmatter en la línea 1.
Contrato: posven/.claude/docs/conventions/module-readme.md.
-->
