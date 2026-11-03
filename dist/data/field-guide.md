# Data Engineer decision field guide
Reviewed: 2026-11-03
Use requirements and supported capabilities together. These are study summaries, not service limits or deployment specifications.
## Service decisions

### BigQuery · Storage
Good fit: Large analytical scans, aggregations and joins.
Signal: Warehouse queries across many records.
Check: Per-request point lookups need a separate latency assessment.
- Improving BigQuery query plans: https://docs.cloud.google.com/bigquery/docs/best-practices-performance-compute

### Bigtable · Storage
Good fit: High-throughput keyed and time-series serving.
Signal: Read a sensor or entity by a designed row-key range.
Check: Do not assume arbitrary warehouse-style joins are its main access path.
- Bigtable row key design: https://docs.cloud.google.com/bigtable/docs/schema-design

### Cloud SQL · Storage
Good fit: Managed MySQL, PostgreSQL or SQL Server applications.
Signal: Relational transactions with existing engine compatibility.
Check: Size, connection limits and availability still need a deliberate design.
- Managed relational engines in Cloud SQL: https://docs.cloud.google.com/sql/docs/introduction

### Spanner · Storage
Good fit: Distributed relational transactions and strong consistency.
Signal: Scale transactional data while preserving the required consistency model.
Check: Model keys and transaction scope; the service name alone is not the schema.
- Spanner consistency and scale: https://docs.cloud.google.com/spanner/docs

### AlloyDB · Storage
Good fit: Demanding PostgreSQL-compatible workloads.
Signal: Preserve PostgreSQL tooling while using a managed database architecture.
Check: Verify compatibility and workload economics rather than assuming a free migration.
- PostgreSQL-compatible workloads in AlloyDB: https://docs.cloud.google.com/alloydb/docs/overview

### Firestore · Storage
Good fit: Document-oriented application data.
Signal: Read and update application entities through a document model.
Check: Design indexes and transactions against the actual document access pattern.
- Firestore document-oriented applications: https://docs.cloud.google.com/firestore/native/docs/overview

### Cloud Storage · Storage
Good fit: Durable objects and reusable lake files.
Signal: Keep files independent of the processing cluster.
Check: Object storage alone is not a relational transaction engine.
- Cloud Storage classes and retrieval tradeoffs: https://docs.cloud.google.com/storage/docs/storage-classes

### BigLake tables · Storage
Good fit: Governed queries over supported external objects.
Signal: Delegate storage access through a connection and enforce table-level controls.
Check: A catalog entry alone does not create this delegated access model.
- BigLake access delegation: https://docs.cloud.google.com/bigquery/docs/biglake-intro

### Memorystore · Storage
Good fit: An in-memory cache or supported Redis workload.
Signal: Serve frequently reused application state with a suitable availability tier.
Check: Decide explicitly whether cached values are recoverable from a durable source.
- Memorystore for Redis and caching: https://docs.cloud.google.com/memorystore/docs/redis/memorystore-for-redis-overview

### Dataflow · Processing
Good fit: Managed Beam execution for bounded and streaming pipelines.
Signal: Custom transforms, event-time processing and controlled error outputs.
Check: Check runner behavior, source/sink limits and stateful update compatibility.
- Dataflow concepts: https://docs.cloud.google.com/dataflow/docs/overview

### Pub/Sub · Ingestion
Good fit: Decoupled event transport and subscription delivery.
Signal: Producers and consumers need independent scaling and availability.
Check: Delivery, per-key ordering, replay and external side effects are different contracts.
- Pub/Sub documentation: https://docs.cloud.google.com/pubsub/docs

### Dataproc / managed Spark · Processing
Good fit: Existing Spark and Hadoop ecosystems.
Signal: Preserve execution compatibility during a short migration.
Check: Separate durable objects from temporary cluster storage and compare idle compute.
- Dataproc / managed Spark clusters: https://docs.cloud.google.com/dataproc/docs/concepts/overview

### Dataform · Transformation
Good fit: Versioned BigQuery SQL dependency graphs and assertions.
Signal: Warehouse ELT, incremental models and quality gates.
Check: Test that the required assertion is a true dependency of publication.
- Dataform data quality assertions: https://docs.cloud.google.com/dataform/docs/test-data

### Cloud Data Fusion · Transformation
Good fit: Visual integration and data preparation pipelines.
Signal: A team needs supported connectors and a graphical transformation interface.
Check: A format conversion alone does not cleanse invalid values.
- Visual integration with Cloud Data Fusion: https://docs.cloud.google.com/data-fusion/docs/concepts/overview

### Cloud Composer / managed Airflow · Orchestration
Good fit: Multi-step dependency graphs, schedules and task-level recovery.
Signal: Workflows need independently observable retries and reruns.
Check: Use logical run intervals and idempotent task effects; an environment is not free idle compute.
- Cloud Composer / managed Airflow concepts: https://docs.cloud.google.com/composer/docs/composer-2/composer-overview

### Workflows · Orchestration
Good fit: Lightweight serverless service-call coordination.
Signal: A sequence of API calls and conditions should run without an Airflow environment.
Check: The orchestration layer does not perform every large data transformation itself.
- Serverless service orchestration: https://docs.cloud.google.com/workflows/docs/overview

### Datastream · Migration
Good fit: Supported database change capture and replication.
Signal: Backfill plus ongoing updates should feed a supported target.
Check: Verify the source engine, change semantics, connectivity and cutover contract.
- Change data capture with Datastream: https://docs.cloud.google.com/datastream/docs/overview

### Storage Transfer Service · Migration
Good fit: Managed movement of supported object and file data.
Signal: Recurring file transfer is the requirement.
Check: It does not automatically replace a database CDC extractor or transform arbitrary proprietary formats.
- Storage Transfer Service: https://docs.cloud.google.com/storage-transfer/docs/overview

### Knowledge Catalog / guide: Dataplex · Governance
Good fit: Metadata discovery, lineage and governed data context.
Signal: Domain products need discoverability and shared guardrails.
Check: Catalog entries are not a substitute for underlying data permissions or quality evidence.
- Knowledge Catalog (guide: Dataplex): https://docs.cloud.google.com/knowledge-catalog/docs/introduction

### Sensitive Data Protection · Security
Good fit: Inspection and supported de-identification of sensitive values.
Signal: Data must be inspected or transformed under a privacy contract.
Check: Masking, irreversible transformations and reversible tokenization have different requirements.
- De-identifying sensitive information: https://docs.cloud.google.com/sensitive-data-protection/docs/deidentify-sensitive-data

### Cloud Monitoring · Operations
Good fit: Metrics and actionable alert policies.
Signal: Detect data freshness, backlog or resource symptoms with an owner and runbook.
Check: A healthy CPU chart does not prove business data completeness.
- Monitoring alert policies: https://docs.cloud.google.com/monitoring/alerts

### Cloud Logging / Audit Logs · Operations
Good fit: Operational logs and evidence of relevant access or administration.
Signal: Investigate who did what and correlate processing failures.
Check: Check applicable log type, configuration, retention and sensitive payload handling.
- Cloud Audit Logs and access events: https://docs.cloud.google.com/logging/docs/audit

## Self-paced route

### 1. Map the requirements
Explain identity, location, privacy, transfer and recovery constraints before naming a product.
Lessons: Give each identity just enough access; Protect the values, the keys and the boundary; Trace identities across a private pipeline; Choose locations against residency and recovery; Migrate with a validation and cutover plan; Move from a snapshot to a changing source
Workshops: Map the failing permission boundary; Translate the decision, not just the vocabulary

### 2. Make warehouse data trustworthy
Predict row grain, duplicates, null rules and current-state behavior under a rerun.
Lessons: Start with the access pattern; Model the warehouse around its queries; Read SQL at the grain of the business question; Choose load, stream and merge behavior explicitly; Gate publication on warehouse quality
Workshops: Deduplicate without guessing the latest record; Find the revenue multiplication; Reject invalid rows with an explicit contract; Replay a versioned batch twice

### 3. Follow the stream
Describe delivery, event time, retention, triggers, sink corrections and replacement separately.
Lessons: Define the source, sink and network path; Separate Pub/Sub delivery, ordering and replay; Reason about event time and late data; Plan panes, late arrivals and corrected totals; Find the limit before adding Dataflow workers; Deploy a pipeline you can safely replace
Workshops: Recover an event-time total

### 4. Govern and share the platform
Choose a supported access path and explain ownership, quality, cost and consumer expectations.
Lessons: Make the lake usable, not just large; Compare lake access with warehouse access; Give distributed teams shared guardrails; Publish data products with an access contract; Treat retention and cost as separate controls
Workshops: Compare logical reads under a fixed workload

### 5. Evaluate the analytical result
Measure freshness and usefulness; distinguish retrieval, generation and model evaluation evidence.
Lessons: Make dashboards efficient and trustworthy; Choose reusable results without losing freshness; Keep training and serving transformations consistent; Evaluate models against the real failure cost; Prepare documents for retrieval and generation; Evaluate retrieval and generated answers separately
Workshops: Read a classifier’s business errors; Filter evidence before generation

### 6. Operate and rehearse recovery
Use stage-level diagnostics, repeatable operations and a failure-specific recovery runbook.
Lessons: Pay for the work you actually need; Make every retry intentional; Keep competing workloads from interfering; Diagnose the failure before scaling; Diagnose a query from its execution evidence; Design recovery against explicit objectives; Prove the recovery plan with a runbook
Workshops: Make a failing assertion block publication; Calculate the recoverable-state age

## Reference scope
- The supplied Skills Boost URLs redirect to Google Skills and Google Skills for Partners.
- The supplied Architecture Framework URL now uses Well-Architected Framework naming.
- The standard and renewal PDFs are valid separate guides with different weights.
- No specific GitHub fact-sheet URL or Udemy course was supplied. This site provides its own referenced field guide and labels the verified optional community repository as secondary reading.
- Availability checking validates a URL response, not every claim in every external course or personal note.
- The 349 imported answer keys retain their prior review status. Expanded learning material does not turn an unreviewed third-party key into an official answer.
