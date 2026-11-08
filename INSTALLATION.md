# Instalación — actualización completa V2

Esta entrega conserva las 349 preguntas importadas y sus 25 imágenes originales, además de todas las mejoras. No apliques ambos parches.

## Si no aplicaste la entrega anterior

Usa `GCP_PDE_WEBSITE_KNOWLEDGE_UPDATE_V2.patch`. Es un parche completo, generado desde un commit real sobre `904616979cded694b99245cc2ea585a650fab861`, la base original de `main`. No contiene una retirada temporal del banco.

Dentro de una copia limpia del repositorio, en PowerShell:

```powershell
git switch main
git pull --ff-only
git status --short
git rev-parse HEAD
git am "$env:USERPROFILE\Downloads\GCP_PDE_WEBSITE_KNOWLEDGE_UPDATE_V2.patch"
npm run build
npm test
npm run validate
```

## Si ya aplicaste el primer parche

Usa únicamente `GCP_PDE_CORRECCION_349_PREGUNTAS_OCR.patch`. Parte del commit anterior `2294a70c8f5ad7923e70a7862c5010ef91672bf9` y deja el mismo contenido final que el parche completo V2.

```powershell
git am "$env:USERPROFILE\Downloads\GCP_PDE_CORRECCION_349_PREGUNTAS_OCR.patch"
npm run build
npm test
npm run validate
```

Los dos parches se generan con `git format-patch --full-index --binary` y se comprueban con `git am` sobre sus respectivas bases. Conserva tus cambios locales antes de aplicar. Si tu rama tiene cambios posteriores incompatibles, resuelve sobre esa versión; no fuerces la aplicación ni uses `reset --hard`. `git am --abort` cancela una aplicación con conflictos.

## Requisitos y publicación

Se requiere Node.js 22 o posterior. No se necesita `npm install`: no hay dependencias adicionales. Después de revisar el resultado, `git push origin main` activa el workflow existente de GitHub Pages. El sitio publicado sigue siendo estático.

Para revisar el ZIP completo, descomprímelo en una carpeta nueva. Para revisar localmente por HTTP:

```powershell
python -m http.server 8000 --directory dist
```

La carga de JSON bajo demanda requiere HTTP; abrir `index.html` con `file://` no es suficiente. Se mantienen las rutas anteriores y las nuevas de retos, sesiones breves, comparación y progreso.

## Preguntas, imágenes y progreso

El banco contiene 473 preguntas: las 349 importadas y 124 originales. Las imágenes de texto o código tienen texto seleccionable y un control para copiarlo; “View original image” permite consultar el archivo conservado. Los diagramas mantienen su presentación visual. Las diez imágenes diminutas de 9×6 se conservan tal como llegaron.

La clave local de progreso se mantiene. Los favoritos e intentos importados vuelven a sus preguntas activas, incluso al restaurar una exportación de la primera entrega. Las sesiones breves y las lecciones completas se siguen registrando por separado.

La preservación del banco está registrada en `AGENTS.md`. Las transcripciones se editan como alternativas en `content/image-text.json`, sin modificar ni borrar los archivos originales. Ejecuta compilación, pruebas y validación tras cualquier cambio.
