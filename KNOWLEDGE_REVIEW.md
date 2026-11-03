# Revisión de la ampliación de conocimiento

Fecha de revisión: **2026-11-03**. Base Git real: `dc1b5a7e99d9c8b014cdfa806f67d9e833753d07`.

## Alcance y fuentes

La estructura sigue los 19 objetivos numerados de la guía estándar v4.2, con pesos aproximados 22/25/20/15/18. Los títulos de los dominios son etiquetas de estudio abreviadas, no una transcripción de Google. Cada lección incluye una decisión, supuestos, ejercicio de explicación y referencias primarias.

Se ampliaron las 25 lecciones existentes y se agregaron 15 profundizaciones. Los 50 escenarios aplicados nuevos cubren permisos efectivos, CDC, granularidad SQL, reintentos, panes acumulativos, ventanas, diagnóstico, gobierno, evaluación ML/RAG y recuperación. Cada alternativa tiene explicación. No son preguntas oficiales.

Las 102 fuentes tienen destino HTTPS y respondieron a GET público durante la comprobación. `content/source-audit.json` registra cada resultado; `scripts/check-sources.py` permite repetirla. La disponibilidad de un enlace no verifica todas las afirmaciones que pueda contener.

Los datos del examen y la distinción estándar/renovación se contrastaron con la página oficial y ambos PDF. Se corrigieron los destinos de Skills Boost a Google Skills, se identificó el nombre Well-Architected Framework y se verificó que el programa de Coursera sea de Google Cloud. La ruta para Partners requiere revisar la elegibilidad de formación; no constituye un requisito del examen.

No se proporcionó una URL concreta de fact sheet ni un curso concreto de Udemy. Se ofrece una guía de decisiones propia y un repositorio personal de GitHub identificado como lectura secundaria, con advertencia de información histórica. No se inventa una verificación de recursos no identificados.

## Matriz de objetivos

| Objetivo | Lecciones enlazadas |
| --- | --- |
| 1.1 | [Give each identity just enough access](dist/index.html#learn/least-privilege); [Trace identities across a private pipeline](dist/index.html#learn/identity-boundaries); [Protect the values, the keys and the boundary](dist/index.html#learn/protect-data); [Choose locations against residency and recovery](dist/index.html#learn/region-recovery-design) |
| 1.2 | [Make correctness part of the architecture](dist/index.html#learn/fidelity) |
| 1.3 | [Design for the next requirement](dist/index.html#learn/portability) |
| 1.4 | [Migrate with a validation and cutover plan](dist/index.html#learn/migration); [Move from a snapshot to a changing source](dist/index.html#learn/cdc-cutover) |
| 2.1 | [Define the source, sink and network path](dist/index.html#learn/pipeline-contract); [Separate Pub/Sub delivery, ordering and replay](dist/index.html#learn/pubsub-contracts) |
| 2.2 | [Choose the engine that fits the work](dist/index.html#learn/processing-engine); [Find the limit before adding Dataflow workers](dist/index.html#learn/dataflow-bottlenecks); [Reason about event time and late data](dist/index.html#learn/event-time); [Plan panes, late arrivals and corrected totals](dist/index.html#learn/beam-triggers); [Route failures without losing the evidence](dist/index.html#learn/bad-records); [Choose load, stream and merge behavior explicitly](dist/index.html#learn/write-contracts); [Enrich records with models, carefully](dist/index.html#learn/ai-enrichment) |
| 2.3 | [Deploy a pipeline you can safely replace](dist/index.html#learn/deploy-pipeline); [Gate publication on warehouse quality](dist/index.html#learn/dataform-quality) |
| 3.1 | [Start with the access pattern](dist/index.html#learn/storage-choice); [Treat retention and cost as separate controls](dist/index.html#learn/lifecycle) |
| 3.2 | [Model the warehouse around its queries](dist/index.html#learn/warehouse-model); [Read SQL at the grain of the business question](dist/index.html#learn/sql-grain) |
| 3.3 | [Make the lake usable, not just large](dist/index.html#learn/lake); [Compare lake access with warehouse access](dist/index.html#learn/biglake-access) |
| 3.4 | [Give distributed teams shared guardrails](dist/index.html#learn/governance) |
| 4.1 | [Make dashboards efficient and trustworthy](dist/index.html#learn/analytics); [Choose reusable results without losing freshness](dist/index.html#learn/materialized-freshness) |
| 4.2 | [Keep training and serving transformations consistent](dist/index.html#learn/features); [Evaluate models against the real failure cost](dist/index.html#learn/ml-evaluation); [Prepare documents for retrieval and generation](dist/index.html#learn/embeddings); [Evaluate retrieval and generated answers separately](dist/index.html#learn/rag-evaluation) |
| 4.3 | [Publish data products with an access contract](dist/index.html#learn/share) |
| 5.1 | [Pay for the work you actually need](dist/index.html#learn/resource-cost) |
| 5.2 | [Make every retry intentional](dist/index.html#learn/repeatability) |
| 5.3 | [Keep competing workloads from interfering](dist/index.html#learn/capacity) |
| 5.4 | [Diagnose the failure before scaling](dist/index.html#learn/observability); [Diagnose a query from its execution evidence](dist/index.html#learn/query-diagnosis) |
| 5.5 | [Design recovery against explicit objectives](dist/index.html#learn/recovery); [Prove the recovery plan with a runbook](dist/index.html#learn/recovery-runbook) |

## Talleres y límites de ejecución

| Taller | Qué permite comprobar |
| --- | --- |
| [Deduplicate without guessing the latest record](dist/index.html#workshops/dedup-latest) | Keep one deterministic latest observation per stable business key. |
| [Find the revenue multiplication](dist/index.html#workshops/join-grain) | Explain exactly how a one-to-many join changes an order-level sum. |
| [Reject invalid rows with an explicit contract](dist/index.html#workshops/quality-contract) | Test completeness, uniqueness and values as different quality properties. |
| [Replay a versioned batch twice](dist/index.html#workshops/merge-replay) | Show why a version-aware current-state operation is repeatable. |
| [Recover an event-time total](dist/index.html#workshops/late-corrections) | Compare the same delayed events under two explicit lateness policies. |
| [Compare logical reads under a fixed workload](dist/index.html#workshops/scan-comparison) | Keep data and selected columns fixed while changing query-aligned layout. |
| [Map the failing permission boundary](dist/index.html#workshops/identity-map) | Identify the actor that actually needs each operation. |
| [Make a failing assertion block publication](dist/index.html#workshops/quality-gate) | Trace task dependency effects without calling a cloud service. |
| [Calculate the recoverable-state age](dist/index.html#workshops/rpo-ledger) | Use completed recovery evidence rather than a scheduled backup label. |
| [Read a classifier’s business errors](dist/index.html#workshops/model-metrics) | Calculate precision and recall from interpretable counts. |
| [Filter evidence before generation](dist/index.html#workshops/authorized-retrieval) | Keep a relevant but forbidden passage out of model context. |
| [Translate the decision, not just the vocabulary](dist/index.html#workshops/read-constraints) | Extract simultaneous constraints from an English scenario. |

Los 12 talleres calculan resultados con modelos JavaScript locales y datos sintéticos. No ejecutan BigQuery, Beam, Dataflow ni servicios de Google Cloud. Los ejemplos SQL son opcionales; no se ejecutaron en una cuenta de Google Cloud. Para práctica real se enlaza la ruta oficial de Google Skills y se explican las condiciones de acceso.

## Compatibilidad y verificación

- Se conservaron sin cambios los bytes de `content/imported.json`: 349 preguntas, estados de revisión, claves de origen, correcciones previas y procedencia.
- Los 50 originales anteriores conservan su contenido e IDs; solo se añade el nivel Foundation.
- Se conservaron todos los IDs anteriores de lecciones y los 101 términos originales. El respaldo versión 1 y la clave local de almacenamiento siguen siendo compatibles.
- Las fuentes primarias apoyan las explicaciones nuevas; un enlace relacionado de una pregunta importada no acredita su clave.
- El aprendizaje registrado y la puntuación de práctica no predicen la aprobación.

## Reproducibilidad

```bash
npm run build
npm test
npm run validate
```

La entrega incluye el informe de pruebas en `VALIDATION.md`. El ZIP conserva el repositorio completo y el parche está pensado para `git am` sobre la base indicada. La publicación pública depende de aplicar los cambios, hacer push y tener GitHub Pages configurado para GitHub Actions.
