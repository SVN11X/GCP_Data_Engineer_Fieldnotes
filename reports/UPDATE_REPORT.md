# Informe de actualización V2 — Google Cloud PDE Fieldnotes

La página se actualizó sobre `main`, commit `904616979cded694b99245cc2ea585a650fab861`. Se mantuvo la arquitectura estática sin dependencias: JavaScript, CSS, JSON generado y rutas hash compatibles con GitHub Pages. No se ha publicado ni enviado ningún cambio al remoto.

## Resultado implementado

| Área | Resultado |
| --- | --- |
| Contenido | 52 lecciones en inglés, 12 nuevas, distribuidas entre los 19 objetivos de la guía estándar. |
| Práctica | 473 preguntas: las 349 importadas intactas y 124 escenarios originales; se conservan claves, estados, explicaciones y filtros. |
| Imágenes de preguntas | Las 25 originales intactas; diez alternativas de texto/código y una tabla semántica con acceso a cada imagen original. |
| Vocabulario | 161 términos, con definiciones accesibles y apoyo en español; se conservan tarjetas, pronunciación y favoritos. |
| Comparación | 28 servicios, cinco parejas sugeridas, selección libre de dos servicios y filtros por función. |
| Arquitecturas | Cuatro diagramas originales: streaming, batch, CDC y acceso delegado a un lago; nodos explicables, rechazo y reinicio. |
| Seguimiento | Temas pendientes, marcas de revisión, lecciones completadas, errores recientes, talleres y exportación/restauración. |
| Interfaz | Portada que explica el objetivo; tres retos visuales de dos minutos; sesiones guiadas de cuatro pasos para las 52 lecciones; diseño responsive y temas claro/oscuro. |
| Rendimiento | Catálogo inicial de 227.232 bytes; contenido por dominio y sección, índice local bajo demanda y peticiones reutilizadas. |
| Procedencia | Auditoría de metadatos del ZIP, enlaces a las fuentes, revisión anterior diferenciada y registro de 14 afirmaciones comprobadas. |

Se conservan las funcionalidades originales útiles: las 40 lecciones previas, 100 preguntas originales, 150 términos previos, 12 talleres, los laboratorios, el reparto ponderado de preguntas, la evaluación de selección múltiple, el temporizador y los datos locales. Las rutas anteriores se mantienen, incluidas las de las 349 preguntas importadas.

## Entrada clara y atención

La portada permite comenzar desde cero, probar un cambio concreto o retomar una sesión de unos cinco minutos. Cada lección explica la situación, por qué importa y una idea aplicable. Las sesiones breves muestran un paso a la vez: problema, regla, decisión y recuerdo. Guardan el punto de lectura y la respuesta al interrumpirse. La terminación de una sesión breve se registra por separado de la lección completa.

Los tres retos usan escenas originales de SVG y HTML con resultados calculados: duplicados (70 → 60 unidades ilustrativas), filtros (300 → 7 GB en el modelo fijado) y validación (cuatro → dos filas publicadas). Los controles cambian el resultado, los registros y la explicación. No se utilizan animaciones continuas, audio automático ni cuenta regresiva en el recorrido breve; se respeta el movimiento reducido.

Las referencias aportadas orientaron el patrón de aprendizaje por pasos con una acción junto a su explicación. [DESIGN_NOTES.md](DESIGN_NOTES.md) documenta los enlaces, el alcance real de inspección y las decisiones de diseño. No se copiaron sus videos, código ni ilustraciones.

## Investigación y calidad

El ZIP privado contiene 15.169 fragmentos: 13.315 textos exactos distintos y 1.854 repeticiones. Hay 1.113 URL de origen. Ningún registro declara verificación automática. La cobertura de videos es declarada por el índice; la precisión de transcripción queda pendiente. Los documentos y paquetes HTML parciales y los 41 cuestionarios parciales no se convierten en contenido verificado.

La investigación alimentó explicaciones y ejercicios originales. Se comprobó documentación primaria para las distinciones importantes: Kafka/Pub/Sub; procesamiento/entrega/efectos externos; ejecución Spark; tipos de tablas BigLake/Iceberg; mutaciones de esquema; costos de consultas; reintentos Airflow; transferencia de datos; métricas de streaming; selección de almacenamiento e identidades. Los archivos `content/verification.json` y `KNOWLEDGE_REVIEW.md` delimitan esa revisión. Las lecciones anteriores conservan su fecha, sin afirmar una revalidación completa.

Se detectaron y trataron tres confusiones relevantes: los cambios de nombres entre la guía y la documentación; la diferencia entre tablas BigLake externas y tablas Iceberg administradas; y el uso indiscriminado de “exactly once” para límites que tienen contratos distintos. No se afirma haber detectado todas las contradicciones semánticas del corpus.

Las 115 URL de referencia respondieron. Eso confirma disponibilidad; no certifica automáticamente cada afirmación del material. El inventario completo de lecciones, objetivos y fuentes está en [CONTENT_INVENTORY.md](CONTENT_INVENTORY.md).

## Preservación de las preguntas y sus imágenes

El usuario confirmó que el dueño le facilitó las 349 preguntas importadas e indicó que nunca se retiren, al igual que sus imágenes. La entrega V2 conserva los 349 registros y las 25 imágenes originales, sin cambios de bytes respecto de la base original. También conserva los scripts previos de importación y revisión. `AGENTS.md` y `content/imported-preservation.json` registran esta condición y los hashes que comprueba la validación.

Se incorporaron alternativas de presentación para diez imágenes de texto/código y una tabla, correspondientes a las preguntas #9, #28, #44, #207, #213, #243 y #248. La transcripción se revisó visualmente, conserva la sintaxis de la fuente y es seleccionable, copiable y buscable. No modifica los enunciados, claves ni archivos originales. Cada alternativa permite consultar y ampliar la imagen fuente.

Tres diagramas, una barra visual y diez imágenes diminutas permanecen como imágenes. Las diez miniaturas de 9×6 afectan ocho preguntas y no permiten recuperar detalles; no se inventó contenido. La tabla mantiene las tres agrupaciones y once filas de componentes visibles. [IMAGE_TEXT_AUDIT.md](IMAGE_TEXT_AUDIT.md) enumera los 25 archivos, sus preguntas y el tratamiento aplicado.

Las 349 importadas son una colección distinta de los 41 cuestionarios parciales del paquete Path 16. Sus estados de revisión y discrepancias originales siguen visibles. Los favoritos e intentos guardados en la primera entrega se recuperan como registros activos, sin duplicarse ni convertirse automáticamente en respuestas verificadas.

## Validación

`npm run build`, `npm test` y `npm run validate` pasan. Son 30 pruebas de comportamiento, además de la validación de contenido, rutas, archivos, referencias, geometría de diagramas y presupuestos de carga. La medición inicial incluye 427.377 bytes sin comprimir de HTML y recursos. El banco y sus respuestas se cargan por dominio y colección; el inicio conserva un catálogo compacto.

La revisión real en navegador cubrió las 12 lecciones nuevas, búsqueda, comparación, rutas aceptadas/rechazadas, una pregunta nueva, reanudación y puntuación de una sesión cronometrada, un taller conservado, procedencia y marcas de revisión. Se inspeccionaron escritorio, móvil de 360 px y tablet de 768 px, modos claro y oscuro y la subruta de GitHub Pages. En la corrección se comprobaron además los filtros de colección, las cuatro opciones SQL de #243 al reabrirla, el texto copiable de #213, la tabla de #248, sus imágenes originales ampliadas, la búsqueda por un valor de esa tabla y el diagrama de #63. Los cuerpos de móvil y tablet no tuvieron desbordamiento horizontal. [VALIDATION.md](../VALIDATION.md) registra el alcance concreto.

La entrega incluye un parche completo V2 desde la base original, una corrección opcional para quien aplicó el primer parche y un ZIP de todos los archivos versionados. Ambos parches se generan desde commits reales y se comprueban con `git am`. Se comprueba `git am` sobre una copia limpia de la base y se compara su árbol con el commit entregado. La recepción de entrega registra los hashes; las instrucciones están en [INSTALLATION.md](../INSTALLATION.md).

## Limitaciones y pendientes

- El corpus privado conserva investigación incompleta: estados interactivos, recursos parciales y precisión de transcripción. Se muestran como pendientes.
- La revisión no sustituye un laboratorio real de Google Cloud. Los ejemplos y modelos locales no ejecutan servicios ni estiman una factura real.
- Las 40 lecciones previas conservan su revisión anterior. Conviene revisarlas individualmente al ampliar el contenido.
- Las 349 preguntas suministradas conservan sus estados originales; una alternativa de texto legible no certifica técnicamente una clave. Los escenarios propios pueden ampliarse con nuevos casos y laboratorios.
- No se hizo una auditoría completa con lectores de pantalla ni una matriz exhaustiva de navegadores. Sí se verificaron controles de teclado, foco, tamaños responsive y contraste visual de las vistas revisadas.
- Los archivos bajo demanda necesitan HTTP y acceso al sitio; no se promete funcionamiento offline completo ni apertura directa mediante `file://`.
- Los valores de precio, las cuotas, las regiones y la compatibilidad concreta de un despliegue deben confirmarse en su documentación vigente. La actualización evita promesas universales de rendimiento o disponibilidad.
- La publicación en GitHub Pages corresponde a aplicar el parche y ejecutar el workflow existente; no se modificó el remoto durante este trabajo.
