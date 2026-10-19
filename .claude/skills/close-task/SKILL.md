---
name: close-task
description: Cerrar una tarea en posveapi, posvenapp o posven-ecommerce contra la definición de terminado (verificación proporcional, README de módulo, lecciones, deploy y commit). Úsala antes de commitear una tarea fuera de plan y siempre que estés por reportar trabajo como terminado.
model: sonnet
effort: medium
---

# Cerrar una tarea

Recorre las casillas en orden. Cada una admite dos respuestas: se hace el trabajo, o la tarea se
detiene y se reporta. Declarar una deuda en el reporte y seguir no es una tercera opción.

## 1. Siempre

1. **Descubrimiento hecho**: grafo consultado antes de tocar (y `graphify affected` antes de
   cambiar o quitar algo exportado o un campo de contrato con el TPV). Si no se pudo, se dice.
2. **Verificación proporcional** (tabla de `.claude/CLAUDE.comun.md` §5), con la salida real:
   - posvenapp: `npx tsc --noEmit` limpio y `npx jest` sobre los tests del área; dorados si fue
     fiscal.
   - posveapi: tests en Docker si está arriba; si no, la entrega dice "no verificado
     localmente". Frontend con `npx vite build --outDir <scratchpad>`.
   - posven-ecommerce: la verificación de `posven-ecommerce/CLAUDE.md`.
   Nada se reporta como pasando si no se corrió.
3. **Reglas del área releídas**: si tocaste archivos gobernados por `.claude/rules/` que no
   abriste con Read, lee la regla ahora y confirma que el diff la cumple.
4. **Diff revisado entero** (`git -C <repo> diff`): nada fuera del alcance pedido, sin
   comentarios de bitácora, sin código muerto nuevo, sin archivos de scratch.
5. **Alcance**: las mejoras detectadas fuera de lo pedido no se aplican; se listan al final.

## 2. Cuando aplique

- **Contrato API-TPV cambiado** (Resource, payload de sync, `broadcastWith`): el consumidor del
  otro repo se ajusta en su propio commit, y el orden de deploy (backend primero) se dice.
- **Módulo con README** (`docs/modules/<m>/README.md` en posveapi, `<carpeta>/README.md` en
  posvenapp, `features/<dominio>/README.md` y `lib/marketplace/README.md` en posven-ecommerce):
  frontmatter y reglas `RN-` al día en el mismo commit (regla `module-readme`).
- **Migración nueva** (posveapi): el cierre dice `php artisan migrate` para el deploy.
- **Menú o permiso nuevo**: el cierre dice qué `*MenuSeeder` correr.
- **Evento, job o listener en cola cambiado**: el cierre dice `php artisan queue:restart`.
- **Migración SQLite nueva** (posvenapp): aditiva, con `version` siguiente y su test.
- **Error que califica como lección** (se repetiría en otra parte): entrada en
  `docs/conventions/lessons.md` del repo en esta misma tarea.

## 3. Commit

- Un commit por cambio lógico, en el repo que corresponde; nunca mezclando repos.
- Formato del repo: conventional commits en español, `tipo(área): resumen` (p. ej.
  `fix(cashea): estados de carga por accion en el bloque de pago`), una línea corta.
- Sin `Co-Authored-By`, sin "Generated with", sin atribución de ninguna clase.
- Archivos por ruta (`git -C <repo> add <rutas>`), nunca `-A` en un repo con trabajo ajeno sin
  commitear.
- Fuera de un plan, el commit se propone y se espera aprobación. En posveapi el hook pint falla
  sin PHP: `--no-verify` se pide cada vez.
- El commit va en el worktree de la tarea, nunca en el checkout principal. Sin push ni merge sin
  pedido explícito; pedido el merge, `merge`, `publicar` y `cerrar` del script de
  `.claude/CLAUDE.comun.md` §2.
- Trabajo parcial no se commitea: se para y se reporta el estado. Si la tarea sigue en otra
  sesión, es una tarea grande: se propone pasarla a un plan con `planificar`.
- Dentro de un plan por fases no se usa esta skill: cierra `/cerrar-fase`.

## 4. Reporte

Una línea de qué se hizo, la salida de la verificación (o "no verificado localmente"), los pasos
de deploy que aplican, lo que quedó sin commitear y las mejoras detectadas fuera de alcance.
