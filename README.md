# Data Engineer Fieldnotes

Página de estudio para **Google Cloud Professional Data Engineer**, en inglés, con ayuda de vocabulario y frases en español. Sitio estático para GitHub Pages: no necesita servidor propio, claves, cuentas adicionales ni dependencias de npm.

## Qué incluye

- **40 lecciones ampliadas**, con explicaciones, escenarios y ejercicios de recuperación activa, que cubren los 19 objetivos numerados de la guía estándar, agrupados en cinco dominios (22%, 25%, 20%, 15%, 18%).
- Una guía de decisión de **22 servicios**, incluyendo nueve opciones de almacenamiento, procesamiento, ingesta, gobierno, orquestación y operación.
- Las **349 preguntas adjuntas**, conservando numeración, alternativas, clave de origen, explicaciones disponibles y procedencia.
- **100 escenarios originales** (50 de fundamentos y 50 aplicados) con una explicación de cada alternativa y referencias primarias. Son material de aprendizaje, no preguntas oficiales de Google.
- **150 términos y frases en inglés**: significado, traducción al español, ejemplo y pronunciación mediante las voces disponibles en el navegador.
- Búsqueda, filtros, favoritos, repaso de errores, tarjetas de vocabulario y progreso local exportable.
- Práctica cronometrada de 10, 20, 40 o 50 preguntas. El tiempo y las respuestas sobreviven a una recarga.
- **12 talleres guiados** con predicciones, cálculo local sobre datos sintéticos, explicación de resultados y progreso persistente: deduplicación, granularidad de joins, calidad, replay, permisos, recuperación, métricas ML y autorización en RAG. No ejecutan servicios de Google Cloud.
- Un centro **Study resources** con los formatos estándar y de renovación separados, seis bloques de estudio, rutas oficiales, cursos y notas comunitarias con su alcance indicado.
- **102 referencias**, clasificadas por procedencia y con comprobación HTTP documentada.
- Laboratorios sobre eventos tardíos, ventanas y reducción de lectura con particiones y clustering; cuatro patrones explicados de arquitectura.
- Descarga desde la propia página del paquete JSON completo de las notas Markdown y de la guía de decisión para estudiar o trabajar con una IA.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo o usa el repositorio donde quieras guardar este proyecto.
2. Extrae el ZIP. Sube **el contenido de `data-engineer-fieldnotes/` a la raíz del repositorio**, no el ZIP. Conserva `.github/workflows/pages.yml` y todas las carpetas. Puedes hacerlo con Git o arrastrando los archivos en GitHub; asegúrate de incluir la carpeta `.github`.
3. En el repositorio, abre **Settings → Pages → Build and deployment → Source → GitHub Actions**.
4. Confirma que la rama se llame `main` o `master`. El workflow se ejecuta con cada push a esas ramas; también puedes iniciarlo en **Actions → Validate and publish GitHub Pages → Run workflow**.
5. Espera a que terminen `build` y `deploy`. La URL pública aparecerá en el deployment `github-pages` y en Settings → Pages.

Se publica únicamente `dist/`. Las rutas de recursos son relativas, por lo que el sitio funciona tanto en una página personal como debajo de `/nombre-del-repositorio/`. La navegación usa fragmentos `#learn/...` y no necesita redirecciones de servidor al recargar.

Si GitHub pide aprobar la ejecución inicial de Actions o habilitar Pages, completa ese paso en la configuración del repositorio. Esta ampliación se preparó desde el repositorio `SVN11X/GCP_Data_Engineer_Fieldnotes`, base `dc1b5a7e99d9c8b014cdfa806f67d9e833753d07`. El ZIP y el parche no cambian por sí solos el remoto: es necesario aplicarlos y hacer push para que se ejecute el workflow.

## Aplicar el parche de esta ampliación

El parche de correo `fieldnotes-expanded-knowledge.patch` se verificó sobre la base `dc1b5a7e99d9c8b014cdfa806f67d9e833753d07`. En una copia limpia del repositorio que contenga esa base:

```bash
git am /ruta/fieldnotes-expanded-knowledge.patch
git push
```

Si trabajas en una rama distinta de `main` o `master`, integra primero el cambio mediante tu flujo habitual de revisión; el despliegue se dispara al actualizar esas ramas. Si tu copia tiene cambios posteriores que se solapan, revisa los conflictos antes de continuar. El ZIP completo es la alternativa para obtener todos los archivos finales sin aplicar el parche.

## Probar y editar

El sitio ya viene generado en `dist/`. Para una revisión local con un servidor estático:

```bash
python -m http.server 8000 --directory dist
```

Abre `http://localhost:8000/`.

Para reconstruir y verificar con Node.js 22 o superior:

```bash
npm run build
npm test
npm run validate
```

No ejecutes `npm install`: el proyecto no tiene dependencias npm.

Los archivos de `content/` son las fuentes editables. Después de editarlos, ejecuta `npm run build` para actualizar `dist/assets/data.js`, `dist/data/study-pack.json`, `dist/data/study-notes.md` y `dist/data/field-guide.md`. No edites solo `data.js`: se vuelve a generar.

## Interpretar las respuestas y sus fuentes

La clave de un tercero no se considera automáticamente correcta. La página distingue:

| Estado importado | Cantidad | Significado |
| --- | ---: | --- |
| Source key only | 298 | Clave y explicación de la fuente, sin validación independiente completa. |
| Editorial review | 13 | Revisión explícita con documentación relacionada. |
| Key corrected | 3 | Se conserva la clave original y se explica la corrección. |
| Key disputed | 15 | Problema técnico o ambigüedad; no se puntúa como una respuesta validada. |
| Missing diagram | 8 | La pregunta depende de al menos una imagen ilegible. |
| Legacy wording | 11 | Nombres, sintaxis o recetas históricas que requieren revisión actual. |
| Conditional answer | 1 | La respuesta depende de supuestos no establecidos en el enunciado. |

Las preguntas #217, #228 y #231 piden dos alternativas pero solo traían una marcada; se documentó la corrección sin borrar la clave de origen. Las 26 preguntas sin explicación original tienen una explicación editorial o una nota técnica de limitación.

Se conservan los 25 archivos de imagen. **Diez tienen solo 9 × 6 píxeles**, por lo que no contienen diagramas legibles. Esto afecta las preguntas #11, #34, #36, #39, #40, #41, #81 y #155. La interfaz avisa y permite inspeccionar los originales; no inventa su contenido. Las cuatro alternativas SQL de #243 tienen transcripción editorial después de inspección visual.

Los enlaces oficiales de un ítem sin revisar son **lectura relacionada**, no una afirmación de que Google respalde esa clave. Los enlaces de procedencia llevan a la página original de ExamBase. Algunos documentos actuales usan nombres diferentes de los conservados en la guía, como Knowledge Catalog y managed Apache Spark; el sitio explica esa relación.

El simulacro usa exclusivamente los **100 escenarios originales** y permite elegir fundamentos (50), aplicado (50) o mixto (100). Su reparto sigue pesos aproximados del temario; para 40 preguntas es 9/10/8/6/7. El nivel aplicado incluye **17 preguntas de selección múltiple** de dos alternativas, con puntuación exacta y sin crédito parcial. También se conserva la selección múltiple del banco importado. No se presenta este material como una réplica completa del examen ni su puntuación como una garantía de aprobación.

## Progreso, privacidad y pronunciación

Los pasos, predicciones y finalización autoevaluada de los talleres se incluyen en el respaldo. Los respaldos anteriores de versión 1 siguen siendo compatibles y conservan IDs de lecciones, preguntas y vocabulario.

El progreso se guarda en `localStorage` de cada navegador y origen. **Sources & review → Export my progress** crea un respaldo JSON; **Restore progress** lo recupera. Un cambio de dominio, otro dispositivo, el modo privado o borrar datos del navegador puede hacer necesario restaurar ese respaldo. Los sitios publicados no sincronizan el progreso mediante GitHub.

No hay analítica, rastreadores, scripts de CDN ni llamadas a servicios de IA. La pronunciación usa Speech Synthesis y depende de las voces y condiciones del navegador; algunas voces del sistema pueden requerir conexión.

## Actualizar desde otro archivo del extractor

La importación original está incluida, así que esto no es necesario para usar o publicar la página. Si luego tienes otro ZIP compatible:

```bash
python scripts/import_questions.py "/ruta/resultado_exambase.zip"
python scripts/review_import.py
npm run build
npm test
npm run validate
```

La revisión de imágenes usa Pillow. El importador solo conserva imágenes locales, sanitiza el HTML y no ejecuta scripts del archivo. **Las notas editoriales están vinculadas a la numeración y al contenido de este archivo específico**: si cambia el conjunto de preguntas, revisa y adapta `review_import.py` antes de aplicarlo. No apliques automáticamente correcciones por número a un examen distinto.

## Fuentes principales

- [Certificación oficial](https://cloud.google.com/learn/certification/data-engineer?hl=en)
- [Guía estándar](https://services.google.com/fh/files/misc/professional_data_engineer_exam_guide_english.pdf)
- Las referencias de Google Cloud, Apache Beam y GitHub están en `content/sources.json` y en las secciones **Study resources** y **Sources & review**.
- [Ruta oficial de Google Skills](https://www.skills.google/paths/16) y [ruta para Partners](https://partner.skills.google/paths/85). Las URL antiguas de Skills Boost redirigen a esos destinos.
- La revisión, sus límites y la correspondencia de objetivos están en `KNOWLEDGE_REVIEW.md`.

## Comprobar enlaces externos

La comprobación de enlaces es independiente de las pruebas sin red. Para actualizar `content/source-audit.json`:

```bash
python scripts/check-sources.py
npm run build
```

Un HTTP 200 no valida todo el contenido del recurso. Las notas personales y los cursos complementarios no respaldan por sí solos una respuesta técnica. Los importados mantienen sus estados de revisión anteriores; la ampliación no certifica automáticamente sus claves.

Contenido original redactado para estudio. Material importado aportado por el usuario; su procedencia se conserva y los derechos de terceros no se sustituyen por una licencia del código de esta aplicación.
