# Agents

## Nombre
Descubrir instrucciones reales y mantenerlas ligadas a evidencia.

## Alcance
`AGENTS.md`, `agents/rules/`, reglas legacy, skills y memoria del proyecto.

## Justificacion
- [AGENTS.md](../../AGENTS.md) dirige a `agents/rules`, conserva la consulta de `.agents/rules` si existe y solicita revisar `.agents/skills` y `memory-bank`.
- Antes de crear este conjunto no existian esas carpetas; este cambio crea `agents/rules`, no crea skills ni un banco de memoria.

## Guia
- Leer las reglas y aplicar las cuyo alcance coincida con la tarea; consultar skills y memoria indicadas por AGENTS cuando existan.
- Si una ubicacion no existe o no puede leerse, indicarlo sin inventar instrucciones ni afirmar que se revisaron.
- Mantener las reglas en Markdown con nombre, alcance, justificacion enlazada al repo, guia accionable y verificacion.
- Diferenciar hechos actuales, riesgos pendientes y recomendaciones al modificar una regla; una prohibicion o recomendacion no prueba que el defecto haya sido corregido.
- Actualizar AGENTS al cambiar la ubicacion de reglas. No suponer que VS Code descubre automaticamente cualquier carpeta llamada `agents/rules`; la referencia de AGENTS es explicita.
- No crear skills o memoria vacios solo para completar una estructura. No realizar commits, pushes ni abrir PRs sin una peticion que autorice esas acciones.

## Verificacion
Desde la raiz, ejecutar `bash -n agents/check-rules.sh` y `bash agents/check-rules.sh`: comprueba cinco secciones, al menos un enlace de evidencia por regla, sus destinos y la referencia de AGENTS. Incluye reglas no trackeadas, que `git diff` omite. No comprueba la veracidad semantica de cada afirmacion.

Para higiene sin crear commits, ejecutar `git diff --check`, `git diff --cached --check` y `git status --short`. No hacer `git add .` ni incluir cambios ajenos por defecto; una validacion de estructura no autoriza stage, commit o push.

## Validacion practica
Se agrego [check-rules.sh](../check-rules.sh) y se ejecuto sobre las ocho reglas reales, con cero errores. Se revisaron diff, index y archivos no trackeados sin alterar el index ni crear un commit. Evidencia en [verification.md](../../verification.md#validacion-practica-de-reglas).