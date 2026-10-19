---
name: cerrar-fase
description: Revisa y cierra la fase actual de un plan, guarda el estado y hace commit. Solo se invoca manualmente con /cerrar-fase.
argument-hint: <nombre-de-la-tarea>
model: sonnet
effort: low
disable-model-invocation: true
---

Cierra la fase actual del plan `$ARGUMENTS` (si no llegaron argumentos, el plan con el que se
trabajó en esta sesión). Nunca `cd`: `git -C <árbol>` y rutas absolutas.

1. Descubrimiento hecho: el grafo se consultó antes de tocar y `graphify affected`, cruzado con
   el diff del plan, corrió antes de cambiar o quitar algo exportado o un campo de contrato
   (skill `discovery`). Si no se pudo, se dice en el cierre. El grafo no se actualiza entre fases:
   si era la última, propón actualizar el de cada repo tocado y el cross-repo si cruzó repos; no
   lo hagas solo.
2. Corre la verificación proporcional del repo (`.claude/CLAUDE.comun.md` §5) con salida resumida:
   posvenapp tsc y jest del área, más los dorados si fue fiscal; posveapi phpunit en Docker o "no
   verificado localmente"; posven-ecommerce lo que dice su CLAUDE.md. Si algo falla, avísame antes
   de seguir.
3. Despacha `revisor-fase` con la ruta del plan, la fase y el árbol. Si devuelve CAMBIOS
   NECESARIOS, muéstrame los problemas y espera mi decisión.
4. En el plan:
   - Marca la fase `[x]` y actualiza "Fase actual" en la línea de Estado.
   - Agrega a "Decisiones" lo decidido en esta sesión que afecte fases futuras.
   - Reescribe "Notas para la próxima sesión": dónde quedamos, qué falta, trampas encontradas.
   - Si apareció trabajo nuevo que es parte del objetivo, agrégalo como fase nueva o dentro de
     una existente.
   - Las sugerencias del revisor y los pendientes que no se aplicaron y pasan el filtro de la
     regla `plan-composition` van a `## Mejoras propuestas` como `- [ ] M-<n>`, clasificadas con
     los criterios de la skill `aplicar-mejoras`. No las implementes.
   - Si era la última fase: Estado `terminado` y mueve el plan a `terminados/` de su carpeta
     (créala si no existe). Poda de `lessons.md` las lecciones ya promovidas, según la regla
     `lessons-authoring`.
5. Si hubo un error que costó retrabajo, agrega una lección a `docs/conventions/lessons.md` del
   repo (formato en la regla `lessons-authoring`). Si algo aprendido aplica a todo el proyecto,
   propón en una línea llevarlo a un CLAUDE.md o a una rule.
6. Pasos de deploy que aplican (migración de posveapi, `*MenuSeeder`, `queue:restart`, orden
   backend antes que TPV): nómbralos en el cierre.
7. Commit en el repo de la fase: archivos por ruta (`git -C <árbol> add <rutas>`, nunca `-A`),
   el mensaje `Commit:` de la fase, sin atribución. En posveapi, `--no-verify` solo si lo autoricé
   en esta sesión. Sin push.
8. Termina con: "Listo. Haz /clear y luego /siguiente-fase $ARGUMENTS" (o "Plan terminado" si era
   la última fase, más la tabla de mejoras pendientes y "se aplican con /aplicar-mejoras
   $ARGUMENTS" si las hay, y la propuesta de merge y cierre de los worktrees con el script de
   `.claude/CLAUDE.comun.md` §2).
