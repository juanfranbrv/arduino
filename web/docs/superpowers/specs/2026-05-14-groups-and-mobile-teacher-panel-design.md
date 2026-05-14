# Diseño: grupos y panel móvil de seguimiento

## Contexto

El flujo actual del profesor no encaja con el uso real en clase:

- el panel de seguimiento permite marcar actividades fuera de orden;
- en móvil no está optimizado para uso rápido durante la clase;
- el modelo actual de grupos no refleja la organización real, porque ahora mismo todos los alumnos están en un único grupo;
- en una sesión hay como máximo 5 alumnos visibles a la vez;
- esos alumnos suelen trabajar en la misma unidad, pero cada uno puede ir por una actividad distinta dentro de esa unidad.

La necesidad inmediata es poder reorganizar alumnos entre grupos y, después, usar un panel de seguimiento que funcione bien en móvil.

## Objetivos

- Permitir crear grupos desde una pantalla específica de gestión.
- Permitir mover alumnos de un grupo a otro, uno a uno.
- Hacer que el panel de profesor trabaje sobre el grupo correcto, no sobre una lista global de alumnos.
- Mantener la unidad seleccionada fija mientras el profesor cambia de alumno.
- Mostrar para cada alumno el estado de las actividades de una unidad, impidiendo marcar actividades futuras.
- Priorizar velocidad, claridad y tocabilidad en móvil.

## No objetivos

- No se implementa movimiento masivo de alumnos.
- No se introduce drag and drop.
- No se rediseña todo el panel del profesor fuera del flujo de grupos y seguimiento.
- No se permite progreso arbitrario por actividades.

## Usuarios y escenario principal

Usuario principal: profesor en clase, usando el móvil.

Escenario principal:

1. El profesor entra en el panel.
2. Selecciona el grupo correcto.
3. Selecciona la unidad actual de trabajo.
4. Ve la lista corta de alumnos del grupo.
5. Toca un alumno.
6. Ve el estado de esa unidad para ese alumno.
7. Marca la actividad actual como completada u omitida.
8. Vuelve a la lista y pasa al siguiente alumno sin perder el contexto de unidad.

## Enfoques considerados

### 1. Actividad global para todo el aula

Ventaja:
- Muy rápido si todos avanzan al mismo ritmo.

Inconveniente:
- No encaja con el caso real, porque cada alumno puede estar en una actividad distinta dentro de la misma unidad.

### 2. Alumno primero, sin contexto fijo de unidad

Ventaja:
- Modelo simple.

Inconveniente:
- Obliga a reubicar mentalmente al profesor en cada cambio de alumno.
- Añade pasos repetitivos en móvil.

### 3. Unidad fija y alumno variable

Ventaja:
- Encaja con el trabajo real en clase.
- Conserva contexto estable.
- Reduce navegación y errores.

Esta es la opción elegida.

## Solución propuesta

La solución se divide en dos pantallas conectadas:

1. Pantalla de gestión de grupos.
2. Panel móvil de seguimiento por grupo, unidad y alumno.

## Pantalla de gestión de grupos

### Propósito

Corregir y mantener la organización de alumnos por grupos para que el seguimiento posterior tenga sentido.

### Estructura

La pantalla tendrá una sola columna en móvil.

Elementos:

- Cabecera con título `Grupos`.
- Botón `Crear grupo`.
- Selector `Grupo origen`.
- Selector `Grupo destino`.
- Lista de alumnos del grupo origen.

Cada fila de alumno mostrará:

- nombre del alumno;
- botón `Mover a [grupo destino]`.

### Comportamiento

- El profesor selecciona un grupo origen y un grupo destino.
- Solo se muestran alumnos del grupo origen.
- Al pulsar `Mover`, el alumno cambia de grupo.
- La lista se actualiza inmediatamente y el alumno desaparece del origen.

### Reglas

- No se puede mover un alumno a su mismo grupo.
- Si no hay grupo destino seleccionado, la acción de mover queda deshabilitada.
- El movimiento es individual, sin multiselección.

### Justificación de UX

Este flujo es más rápido que entrar en un grupo, abrir fichas individuales y salir varias veces. También es más claro en móvil que una tabla o un selector incrustado en cada fila.

## Panel móvil de seguimiento

### Propósito

Gestionar el progreso de una unidad para los alumnos de un grupo, manteniendo fija la unidad y cambiando rápidamente entre alumnos.

### Estructura general

Pantalla principal:

- selector de grupo;
- selector de unidad;
- lista de alumnos del grupo seleccionado.

La unidad elegida debe mantenerse fija mientras el profesor cambia de alumno.

Cada alumno se mostrará como tarjeta o fila alta, con:

- nombre;
- resumen breve del estado de la unidad.

Al tocar un alumno se abre una vista detallada de la unidad para ese alumno.

### Vista de detalle de alumno

Muestra:

- nombre del alumno;
- unidad actual;
- lista ordenada de actividades de esa unidad.

Cada actividad tendrá uno de estos estados:

- `Completada`;
- `Omitida`;
- `Actual`;
- `Bloqueada`.

### Regla de secuencia

Para cada alumno, solo una actividad pendiente puede estar activa a la vez: la primera no resuelta de la unidad.

Consecuencias:

- actividades anteriores resueltas: `Completada` u `Omitida`;
- primera no resuelta: `Actual`;
- actividades posteriores: `Bloqueada`.

El profesor no podrá marcar una actividad bloqueada.

### Acciones permitidas

Sobre la actividad `Actual`:

- marcar `Completada`;
- marcar `Omitida`.

Sobre una actividad ya resuelta:

- opcionalmente permitir volver a `Pendiente` si se quiere corregir un error.

Sobre una actividad `Bloqueada`:

- no hay acción disponible.

### Navegación

Desde el detalle del alumno:

- botón `Volver` a la lista del grupo;
- se conserva el grupo y la unidad seleccionados.

Esto permite recorrer alumnos sin perder contexto.

## Modelo de datos

### Grupos

Se reutiliza la entidad de grupos existente.

Necesidades:

- crear grupos nuevos;
- listar grupos;
- mover un alumno cambiando su `groupId`.

No hace falta un nuevo concepto de sesión si el grupo ya representa el conjunto correcto de alumnos para trabajar.

### Seguimiento

Se mantiene el modelo de evaluaciones por actividad y alumno.

La diferencia clave estará en la lógica de interfaz y validación:

- el frontend solo ofrecerá acciones sobre la actividad `Actual`;
- el backend debe validar que no se pueda marcar una actividad futura aunque alguien intente saltarse la interfaz.

## Validaciones de backend

La mutación de progreso debe reforzar la regla de negocio:

- obtener todas las actividades de la unidad para ese alumno;
- calcular la primera actividad no resuelta;
- rechazar cualquier intento de marcar otra actividad distinta como `completed` u `closed_incomplete`.

Esto evita depender solo del frontend.

## Adaptación a móvil

Principios:

- una sola columna;
- controles grandes;
- sin tablas;
- sin modales complejos si no son estrictamente necesarios;
- cabeceras cortas y contexto siempre visible;
- zonas táctiles amplias;
- navegación lineal y predecible.

Decisiones concretas:

- selectores de grupo y unidad arriba;
- lista de alumnos en tarjetas o filas grandes;
- detalle de alumno con botones grandes por actividad;
- evitar tres o más acciones secundarias visibles a la vez en cada fila.

## Estados vacíos y errores

### Pantalla de grupos

- si no hay grupos: mensaje y CTA para crear uno;
- si el grupo origen no tiene alumnos: lista vacía con mensaje claro.

### Seguimiento

- si el grupo no tiene alumnos: mensaje claro;
- si la unidad no tiene actividades: mensaje claro;
- si el profesor no tiene permisos: mensaje de acceso restringido;
- si falla un movimiento o una marca: feedback visible y no ambiguo.

## Testing

### Unitario

- cálculo de actividad actual por alumno;
- bloqueo de actividades futuras;
- movimiento de alumno entre grupos;
- mantenimiento de grupo/unidad seleccionados.

### Integración

- crear grupo y verlo disponible en selectores;
- mover alumno de un grupo a otro y comprobar que cambia de lista;
- marcar actividad actual y verificar que se desbloquea la siguiente;
- intentar marcar actividad futura y comprobar que se rechaza.

### Manual en móvil

- flujo completo con 5 alumnos;
- cambio rápido entre alumnos;
- legibilidad y tocabilidad;
- persistencia del contexto de unidad.

## Fases de implementación

### Fase 1

Pantalla de grupos:

- crear grupo;
- seleccionar origen y destino;
- mover alumnos entre grupos.

### Fase 2

Ajuste del panel de seguimiento:

- selector de grupo;
- selector de unidad;
- lista de alumnos del grupo.

### Fase 3

Detalle de unidad por alumno:

- estados `Completada`, `Omitida`, `Actual`, `Bloqueada`;
- acciones solo sobre la actividad actual.

### Fase 4

Refuerzo de backend:

- validación contra marcado fuera de orden.

## Decisiones cerradas

- Los alumnos se mueven uno a uno.
- Habrá como máximo 5 alumnos visibles por sesión.
- El contexto fijo del profesor será la unidad, no la actividad.
- Cada alumno puede estar en una actividad distinta de la misma unidad.
- El panel debe estar optimizado para móvil y uso rápido en clase.
