---
name: debug
description: Diagnosticar un fallo hasta su causa y no hasta su síntoma (reproducir, leer el error entero, rastrear hacia atrás, arreglar la causa). Úsala ante un bug reportado, un test que falla, un descuadre fiscal, un dato que no sincroniza o un fallo con aspecto de infraestructura.
argument-hint: "[el fallo]"
model: opus
effort: high
---

# Diagnosticar un fallo

Un fallo se diagnostica a causa raíz en la misma tarea: no se rodea repitiendo el comando ni
reinstalando a ciegas, y no se etiqueta como preexistente sin evidencia.

## Las cuatro fases, en orden

### 1. Reproducir

El comando, la pantalla o la petición exacta que lo produce, con el mismo resultado dos veces.
Si falla sólo a veces, lo que se reproduce es la condición (orden de tests, concurrencia, la
coalescencia de 300 ms del persist, el worker de cola, datos de una empresa concreta).

Dónde se puede reproducir acá:

- posvenapp: `npx jest tests/unit/<archivo>.test.ts` con un caso que falla; la lógica fiscal y de
  store es pura y se reproduce sin la app.
- posveapi: sin PHP local. Con Docker arriba, `docker compose exec app vendor/bin/phpunit
  --filter <test>`; sin Docker, se reproduce leyendo el flujo con datos concretos y se pide al
  usuario la prueba en `srvdebposven` si hace falta. Nunca se inventa una salida.
- posven-ecommerce: se reproduce con la página en el servidor de desarrollo (`launch.json`,
  configuración `posven-ecommerce`).
- Eventos por socket o jobs: el síntoma puede ser el worker con la clase vieja (falta
  `queue:restart`), no el código.

### 2. Leer el error entero antes de cambiar nada

Mensaje, tipo, stack hasta el primer marco propio, causa encadenada y lo que se imprime antes y
después. La primera línea dice dónde se manifestó, no dónde nació. Resume en una frase qué se
esperaba, qué se recibió y dónde.

### 3. Rastrear hacia atrás desde el síntoma

Parte del valor equivocado y pregunta quién lo produjo, salto a salto, hasta donde deja de estar
equivocado. Cada salto se verifica contra el código o una corrida, nunca contra el recuerdo.
`graphify path` y `explain` sirven para los saltos que cruzan archivos o repos (un campo que
el TPV lee y la API dejó de mandar).

### 4. Arreglar la causa

Un `try/catch` que traga el error, un default que tapa el `undefined`, un reintento o un
`?? 0` en un monto ponen el síntoma en verde sin tocar la causa. Si el arreglo no se explica
con la cadena de la fase 3, no es el arreglo. En aritmética fiscal, además, el arreglo pasa por
los dorados.

## La compuerta

El reporte dice primero qué causaba el fallo (el mecanismo, no el archivo) y después qué se
cambió. Un arreglo que no explica por qué aparecía el síntoma es una coincidencia con pruebas
verdes. Si la causa es un error que se puede repetir en otra parte, destila la lección en
`docs/conventions/lessons.md` del repo (regla `lessons-authoring`).

## Excusas que no valen

| Excusa | Realidad |
|---|---|
| "Ya sé qué es" | Eso es ir hacia adelante desde la sospecha. Rastrea hacia atrás. |
| "Con la primera línea del error alcanza" | Dice dónde se manifestó; la causa está más abajo. |
| "Pasa a veces, lo reintento" | Un flake es un defecto con horario: reproduce su condición. |
| "Es preexistente" | Sin el rastreo de la fase 3, esa etiqueta no existe. |
| "En producción es distinto" | Esa diferencia (datos, cola, versión desplegada) es la condición a reproducir. |
