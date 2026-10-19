# .claude de este repo

Configuración de Claude Code del equipo: `CLAUDE.comun.md` (reglas comunes), `agents/`, `hooks/`,
`rules/`, `skills/` y `scripts/`. La fuente vive en el espacio de trabajo `posven/.claude`; aquí
hay copias.

## Requisitos

- Node 20 o superior y git.
- Python y graphify: `pip install graphifyy`. Después `graphify install --platform claude`, que
  copia la skill de graphify a la configuración de Claude Code (en Windows, `claude` a propósito:
  los comandos son de Git Bash y el valor por omisión sería `windows`).

## Generar el grafo

Las skills consultan el grafo antes de leer código. Se guarda fuera del repo, en el directorio
padre de este clon (nunca dentro: se borra `graphify-out/` si aparece aquí):

```bash
GRAPHIFY_OUT="<padre>/.graphify-workspace/<repo>/graphify-out" graphify update "<padre>/<repo>"
```

Resultado: `<padre>/.graphify-workspace/<repo>/graphify-out/graph.json`. Sólo AST, sin LLM. El
procedimiento completo está en `.claude/skills/discovery/SKILL.md`.

## Comprobar

```bash
node .claude/scripts/setup.mjs
```

Sólo comprueba y dice qué falta; sale 1 si algo falta.

## Flujo diario

1. Todo trabajo va en un worktree propio (`.claude/CLAUDE.comun.md` §2).
2. Una tarea grande se planifica con la skill `planificar`: fases con su criterio de terminado.
3. Se ejecuta con `ejecutar-plan` (automático) o fase por fase con `siguiente-fase`
   (`.claude/CLAUDE.comun.md` §7).
4. Al terminar cada fase se verifica con el comando proporcional del repo y se commitea.

## Archivos sincronizados

`.claude/sync.lock.json` lista las copias que vienen de la fuente común. No se editan a mano: un
cambio se propone a quien coordina (PR o aviso), que lo adopta desde `posven/.claude` con
`node scripts/sync-repos.mjs <repo> <árbol> --adoptar <archivo>` (el script no viaja a los repos)
y lo propaga a los tres. Lo personal va en `.claude/settings.local.json` o `CLAUDE.local.md`, que
el `.gitignore` del repo excluye.
