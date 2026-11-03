# Validación realizada

## Verificaciones automáticas

- Sintaxis de `app.js`, `core.js` y del paquete de datos generado.
- 399 IDs únicos: 349 preguntas importadas con numeración continua y 50 escenarios originales.
- Correspondencia de los 19 objetivos con las 25 lecciones.
- Claves de respuesta consistentes con alternativas y cantidad requerida en los ítems puntuables.
- Conservación separada de las tres claves originales corregidas.
- Todas las preguntas tienen explicación de origen, explicación editorial o nota de limitación, y referencias relacionadas.
- 25 imágenes locales, con detección explícita de los diez archivos de 9 × 6 píxeles.
- Sanitización del HTML importado y presencia de los recursos enlazados.
- Siete pruebas de comportamiento: selección exacta, reparto de dominios, puntuación, eventos tardíos, lectura particionada, restauración de progreso y procedencia de correcciones.

## Verificación en navegador

- Vista de escritorio, apertura de lecciones y términos bilingües.
- Guardado de vocabulario y conservación de lecciones completadas tras recargar.
- Restauración de un respaldo JSON mediante el selector de archivos real del navegador.
- Búsqueda por número y evaluación múltiple de #228, con explicación y enlaces.
- Simulacro corto: respuestas guardadas, navegación, reanudación tras recarga y resultados con preguntas no respondidas.
- Eventos tardíos: comparar 0 y 3 minutos cambia la aceptación de D y los totales; reinicio completo del modelo.
- Revisión visual inicial en vistas equivalentes a móvil de 360 píxeles CSS y tablet de 768 píxeles CSS, sin desbordamiento horizontal. Se ajustaron después el punto de colapso de la navegación y el tamaño del título; la repetición de esa revisión quedó bloqueada por la política del navegador de pruebas para marcos anidados.

## Límites

No se publicó en un repositorio GitHub porque no se indicó un destino remoto. El workflow está preparado, pero su ejecución en GitHub y la URL pública dependen de subir este proyecto y habilitar Pages en el repositorio elegido.

La documentación oficial se consultó durante la preparación. No se ha validado individualmente toda la clave de terceros. Las categorías de revisión e imágenes faltantes permanecen visibles. La pronunciación depende de las voces instaladas o disponibles en el navegador.
