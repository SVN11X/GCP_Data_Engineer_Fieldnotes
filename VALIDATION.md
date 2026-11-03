# Validación de la ampliación

Revisión: 2026-11-03. Base real del repositorio: `dc1b5a7e99d9c8b014cdfa806f67d9e833753d07`.

## Pruebas automáticas

Se completaron `npm run build`, `npm test` y `npm run validate` con Node.js. Pasaron las 13 pruebas:

- Selección exacta, sin crédito parcial ni alternativas duplicadas.
- Reparto ponderado por dominio y ausencia de importados en el simulacro.
- Puntuación que incluye preguntas sin responder.
- Eventos tardíos y cambios de política de lateness.
- Modelo de lectura con particiones y clustering, unidades y límites.
- Restauración de progreso y conservación del plazo de un simulacro previo.
- Procedencia de las correcciones importadas existentes.
- Predicciones de los 12 talleres y ausencia de mutación de sus entradas.
- Selección de estado reciente independiente del orden y replay idempotente.
- Granularidad de joins, contratos de calidad y filtrado por autorización.
- Bloqueo por dependencias, ciclos inválidos, snapshots incompletos y denominadores vacíos de métricas.
- Simulacros Foundation, Applied y mixed de 10/20/40/50 preguntas; 17 multiselecciones en el Applied completo.
- Compatibilidad de respaldos antiguos y validación de pasos de talleres nuevos.

El validador comprueba 449 IDs de preguntas únicos, numeración importada continua, 40 lecciones/19 objetivos, 150 términos, 22 servicios, 12 talleres, referencias primarias de las explicaciones técnicas, relaciones de la ruta de estudio, activos relativos y sintaxis de los scripts. Las 25 imágenes y la detección de los diez placeholders se conservan.

Además se contrastó contra la base Git que el importado permanece idéntico byte por byte, los 50 escenarios previos solo añaden el nivel Foundation, todos los IDs previos de lecciones siguen existiendo y los 101 términos anteriores son idénticos.

## Comprobación de fuentes

La página de certificación, guía estándar v4.2, guía de renovación, destinos de formación y documentación técnica se consultaron durante la ampliación. Las 102 URL del registro respondieron al GET público del comprobador el 2026-11-03. El registro de disponibilidad es `content/source-audit.json`; un HTTP 200 no certifica todas las afirmaciones de una web externa.

## Navegador

Comprobado en la vista de escritorio de 1363 × 936 píxeles CSS:

- Centro de recursos: seis bloques de estudio, ocho recursos y 22 filas de decisión de servicios.
- Comparación separada del estándar y la renovación.
- Se ejecutaron los 12 talleres en la interfaz y se comprobaron sus resultados, incluyendo activación con teclado.
- La búsqueda global encuentra talleres y recursos además del contenido anterior.
- Taller de deduplicación: predicción, resultado calculado 45, cuatro pasos, bloqueo de finalización hasta completar y conservación tras recargar.
- Lección nueva de granularidad SQL: explicación desplegable, enlaces a talleres y doce términos interactivos.
- Diálogo de vocabulario con definición, traducción al español y pronunciación disponible.
- Filtro Applied: 50 preguntas.
- Simulacro Applied de 50: ítem multiselección, dos respuestas conservadas tras recargar, mismo plazo, finalización y cómputo de preguntas sin responder.
- Sin desbordamiento horizontal en las vistas revisadas. No se observaron errores de la aplicación en el registro consultado; el entorno emitió avisos de su extensión de navegador.

Se conservan reglas adaptativas para móvil y se revisaron los nuevos grids, anchos mínimos, navegación y tablas desplazables. Esta ampliación no tuvo una prueba visual nueva en una ventana móvil: la interfaz del navegador de comprobación no expone cambio de viewport. No se presenta la revisión CSS como una prueba visual móvil.

## Límites de la entrega

No se ejecutaron servicios ni consultas en Google Cloud. Los talleres son modelos locales con reglas explícitas, no mediciones de la plataforma. El SQL opcional necesita el entorno correspondiente para ejecutarse.

Las 349 claves importadas mantienen su estado anterior de revisión; no se verificaron todas individualmente en esta ampliación. La pronunciación depende de las voces del navegador.

No se hizo push ni despliegue en el GitHub remoto desde esta sesión. El workflow publica `dist/` después de aplicar la entrega y hacer push a `main` o `master`, si Settings → Pages → Source está en GitHub Actions. El parche y el ZIP se verifican contra una aplicación limpia de la base Git indicada.
