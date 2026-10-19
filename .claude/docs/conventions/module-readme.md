# Contrato del README de módulo

Un README de módulo es la ficha que un agente carga antes de tocar el módulo: estructura fija,
un hecho por línea, sin narrativa. Cómo se escribe sin afirmar cosas falsas lo fija la regla
`module-readme` (`.claude/rules/module-readme.md`).

## Dónde vive

| Repo | README | Plantilla | Tests |
|---|---|---|---|
| posveapi | `docs/modules/<modulo>/README.md` | `docs/conventions/README.template.md` | `tests/Feature/<Dominio>/` |
| posvenapp | `<carpeta>/README.md` (p. ej. `store/README.md`, `database/README.md`) | `docs/conventions/README.template.md` | `tests/unit/`, `__tests__/` |
| posven-ecommerce | `features/<dominio>/README.md`, `lib/marketplace/README.md` | `docs/conventions/README.template.md` | `__tests__/` de la feature o de `lib/` (`*.test.ts`, `*.test.tsx`) |

En posveapi, `docs/` fuera de `docs/modules/`, `docs/conventions/`, `docs/specs/` y `docs/plans/`
es la documentación de usuario (GitBook, `docs/SUMMARY.md`): no lleva este contrato.

## Dónde vive cada dato

Cada dato en un solo lugar; los demás lo citan.

| Dato | Dónde vive | Los demás |
|---|---|---|
| Forma de campos de un Resource, payload o modelo TS | `input`/`output` de su capacidad en el frontmatter | lo nombran por nombre |
| Lista de exports | `exports` del frontmatter y la sección 4, idénticas | |
| Firma de un export | sección 4 | lo citan por nombre |
| Enunciado de una regla de negocio | tabla `RN-` de la sección 2 | test y código la citan por id |
| Origen de una regla | la spec que la decidió | el README la escribe en presente |
| Justificación de una regla | sección 8 | |
| Versión de una dependencia | `composer.json` / `package.json` | la sección 6 nombra la ruta, nunca la versión |
| Qué cubre una prueba | el nombre del test | la sección 9 la nombra en una línea |
| Historial, plan, fecha | git | nadie lo copia |

## Frontmatter

En la línea 1, antes de cualquier prosa. Todo valor de texto entre comillas.

- `module`: nombre de la carpeta o del módulo de `routes/Modules/`.
- `path`: ruta relativa a la raíz del repo, sin barra inicial.
- `type`: `feature` | `infra` | `integration` | `util`.
- `exports`: sólo nombres (clases de Action, Repository, Controller, Resource; en posvenapp
  slices, hooks, funciones).
- `depends_on`: rutas de lo que consume.
- `tests`: directorio o patrón de sus tests.
- `verified_against`: **obligatoria**. Rutas leídas al escribir la ficha; con ellas
  `docs-check.mjs` marca el README como rancio cuando esas rutas cambian después.
- `verified_at` (opcional): sha corto de `git rev-parse --short HEAD` al verificar.
- `capabilities`: una entrada por pregunta que el módulo responde:
  `intent` (pregunta en español llano), `intent_aliases` (como se pide de verdad, sin acentos),
  `entrypoint` (`Clase::metodo`, `GET /api/...` o `funcion()`), `file`, `input`, `output`
  (nombre y forma de campos inline, única copia escrita a mano), `source` (tabla, API externa,
  SQLite, store), `rules` (ids `RN-`).

El frontmatter describe el código: si falta un export real, se agrega.

## Reglas de negocio

- `RN-<MODULO>-<nn>`, estable; un número retirado no se reutiliza. El id nuevo se reserva en el
  plan (tabla "Identificadores que estrena"), nunca "el máximo del README más uno".
- Una afirmación verificable en presente por regla, **240 caracteres como máximo** en la celda
  del enunciado. Lo que no entra son dos reglas, o justificación (sección 8), o enumeración
  (prosa tras la tabla).
- Cada regla nombra el test que la hace cumplir; sin test, queda `pendiente` y se dice.
- Un universal ("toda", "nunca") se comprueba enumerando contraejemplos antes de escribirlo.
- Desacuerdo entre código y regla: gana la regla, salvo que la tarea sea cambiarla.

## Secciones, en este orden

1. **Propósito**: 2 o 3 líneas, 600 caracteres como máximo: qué resuelve y qué no hace.
2. **Reglas de negocio**: tabla `Regla | Enunciado | Test que la hace cumplir`.
3. **Dónde hacer cambios**: tabla `Tipo de cambio | Dónde va | Además hay que`, una fila por
   cambio que el módulo recibe de verdad; "Además hay que" nombra archivos, claves o símbolos de
   este módulo (p. ej. "agregar el permiso a `AccountingMenuSeeder`").
4. **API pública**: una entrada por export con firma completa y ruta. En posveapi, endpoints con
   método, ruta, permiso y Request/Resource.
5. **Estructura interna**: `Pieza | Archivo | Responsabilidad`.
6. **Dependencias**: por ruta, sin versiones.
7. **Ejemplo de uso**: un fragmento real (llamada HTTP, uso de la Action o del hook).
8. **Restricciones**: invariantes, efectos colaterales (eventos, colas, broadcast al TPV,
   asientos contables), una por línea.
9. **Pruebas**: el comando y una línea por archivo de test con su ruta.

Una sección sin contenido conserva su encabezado con "Ninguna.".

## Mantenimiento

- Sólo estado actual: sin bitácora, versiones, fechas ni ids de plan.
- Un cambio de API reescribe la sección, no agrega al final. Borrar un export lo saca de la
  sección 4 y de `exports` en el mismo commit.
- El README se actualiza en el mismo commit que el código del módulo.
- Tras tocar `capabilities`, `node .claude/scripts/generate-index.mjs <repo>` regenera
  `docs/CAPABILITIES.md` del repo, que se commitea junto.
