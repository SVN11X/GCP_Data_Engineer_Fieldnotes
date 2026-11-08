# Data Engineer decision field guide
Reviewed: 2026-11-08

## BigQuery · Storage
Good fit: Large analytical scans, aggregations and joins.
Signal: Warehouse queries across many records.
Check: Per-request point lookups need a separate latency assessment.
- Improving BigQuery query plans: https://docs.cloud.google.com/bigquery/docs/best-practices-performance-compute

## Bigtable · Storage
Good fit: High-throughput keyed and time-series serving.
Signal: Read a sensor or entity by a designed row-key range.
Check: Do not assume arbitrary warehouse-style joins are its main access path.
- Bigtable row key design: https://docs.cloud.google.com/bigtable/docs/schema-design

## Cloud SQL · Storage
Good fit: Managed MySQL, PostgreSQL or SQL Server applications.
Signal: Relational transactions with existing engine compatibility.
Check: Size, connection limits and availability still need a deliberate design.
- Managed relational engines in Cloud SQL: https://docs.cloud.google.com/sql/docs/introduction

## Spanner · Storage
Good fit: Distributed relational transactions and strong consistency.
Signal: Scale transactional data while preserving the required consistency model.
Check: Model keys and transaction scope; the service name alone is not the schema.
- Spanner consistency and scale: https://docs.cloud.google.com/spanner/docs

## AlloyDB · Storage
Good fit: Demanding PostgreSQL-compatible workloads.
Signal: Preserve PostgreSQL tooling while using a managed database architecture.
Check: Verify compatibility and workload economics rather than assuming a free migration.
- PostgreSQL-compatible workloads in AlloyDB: https://docs.cloud.google.com/alloydb/docs/overview

## Firestore · Storage
Good fit: Document-oriented application data.
Signal: Read and update application entities through a document model.
Check: Design indexes and transactions against the actual document access pattern.
- Firestore document-oriented applications: https://docs.cloud.google.com/firestore/native/docs/overview

## Cloud Storage · Storage
Good fit: Durable objects and reusable lake files.
Signal: Keep files independent of the processing cluster.
Check: Object storage alone is not a relational transaction engine.
- Cloud Storage classes and retrieval tradeoffs: https://docs.cloud.google.com/storage/docs/storage-classes

## BigLake tables · Storage
Good fit: Governed queries over supported external objects.
Signal: Delegate storage access through a connection and enforce table-level controls.
Check: A catalog entry alone does not create this delegated access model.
- BigLake access delegation: https://docs.cloud.google.com/bigquery/docs/biglake-intro

## Memorystore · Storage
Good fit: An in-memory cache or supported Redis workload.
Signal: Serve frequently reused application state with a suitable availability tier.
Check: Decide explicitly whether cached values are recoverable from a durable source.
- Memorystore for Redis and caching: https://docs.cloud.google.com/memorystore/docs/redis/memorystore-for-redis-overview

## Dataflow · Processing
Good fit: Managed Beam execution for bounded and streaming pipelines.
Signal: Custom transforms, event-time processing and controlled error outputs.
Check: Check runner behavior, source/sink limits and stateful update compatibility.
- Dataflow concepts: https://docs.cloud.google.com/dataflow/docs/overview

## Pub/Sub · Ingestion
Good fit: Decoupled event transport and subscription delivery.
Signal: Producers and consumers need independent scaling and availability.
Check: Delivery, per-key ordering, replay and external side effects are different contracts.
- Pub/Sub documentation: https://docs.cloud.google.com/pubsub/docs

## Dataproc / managed Spark · Processing
Good fit: Existing Spark and Hadoop ecosystems.
Signal: Preserve execution compatibility during a short migration.
Check: Separate durable objects from temporary cluster storage and compare idle compute.
- Dataproc / managed Spark clusters: https://docs.cloud.google.com/dataproc/docs/concepts/overview

## Dataform · Transformation
Good fit: Versioned BigQuery SQL dependency graphs and assertions.
Signal: Warehouse ELT, incremental models and quality gates.
Check: Test that the required assertion is a true dependency of publication.
- Dataform data quality assertions: https://docs.cloud.google.com/dataform/docs/test-data

## Cloud Data Fusion · Transformation
Good fit: Visual integration and data preparation pipelines.
Signal: A team needs supported connectors and a graphical transformation interface.
Check: A format conversion alone does not cleanse invalid values.
- Visual integration with Cloud Data Fusion: https://docs.cloud.google.com/data-fusion/docs/concepts/overview

## Cloud Composer / managed Airflow · Orchestration
Good fit: Multi-step dependency graphs, schedules and task-level recovery.
Signal: Workflows need independently observable retries and reruns.
Check: Use logical run intervals and idempotent task effects; an environment is not free idle compute.
- Cloud Composer / managed Airflow concepts: https://docs.cloud.google.com/composer/docs/composer-2/composer-overview

## Workflows · Orchestration
Good fit: Lightweight serverless service-call coordination.
Signal: A sequence of API calls and conditions should run without an Airflow environment.
Check: The orchestration layer does not perform every large data transformation itself.
- Serverless service orchestration: https://docs.cloud.google.com/workflows/docs/overview

## Datastream · Migration
Good fit: Supported database change capture and replication.
Signal: Backfill plus ongoing updates should feed a supported target.
Check: Verify the source engine, change semantics, connectivity and cutover contract.
- Change data capture with Datastream: https://docs.cloud.google.com/datastream/docs/overview

## Storage Transfer Service · Migration
Good fit: Managed movement of supported object and file data.
Signal: Recurring file transfer is the requirement.
Check: It does not automatically replace a database CDC extractor or transform arbitrary proprietary formats.
- Storage Transfer Service: https://docs.cloud.google.com/storage-transfer/docs/overview

## Knowledge Catalog / guide: Dataplex · Governance
Good fit: Metadata discovery, lineage and governed data context.
Signal: Domain products need discoverability and shared guardrails.
Check: Catalog entries are not a substitute for underlying data permissions or quality evidence.
- Knowledge Catalog (guide: Dataplex): https://docs.cloud.google.com/knowledge-catalog/docs/introduction

## Sensitive Data Protection · Security
Good fit: Inspection and supported de-identification of sensitive values.
Signal: Data must be inspected or transformed under a privacy contract.
Check: Masking, irreversible transformations and reversible tokenization have different requirements.
- De-identifying sensitive information: https://docs.cloud.google.com/sensitive-data-protection/docs/deidentify-sensitive-data

## Cloud Monitoring · Operations
Good fit: Metrics and actionable alert policies.
Signal: Detect data freshness, backlog or resource symptoms with an owner and runbook.
Check: A healthy CPU chart does not prove business data completeness.
- Monitoring alert policies: https://docs.cloud.google.com/monitoring/alerts

## Cloud Logging / Audit Logs · Operations
Good fit: Operational logs and evidence of relevant access or administration.
Signal: Investigate who did what and correlate processing failures.
Check: Check applicable log type, configuration, retention and sensitive payload handling.
- Cloud Audit Logs and access events: https://docs.cloud.google.com/logging/docs/audit

## Managed Service for Apache Kafka · Ingestion
Good fit: Managed Kafka clusters for Kafka clients and consumer groups.
Signal: Kafka ecosystem compatibility is an explicit application requirement.
Check: Retention, client behavior and the business event contract still need design.
- Managed Service for Apache Kafka overview: https://docs.cloud.google.com/managed-service-for-apache-kafka/docs/overview

## Serverless for Apache Spark · Processing
Good fit: Submitted Spark batch workloads and interactive sessions.
Signal: Intermittent Spark processing without a user-provisioned cluster.
Check: Test runtime, dependencies, network and workload economics.
- Serverless for Apache Spark execution: https://docs.cloud.google.com/dataproc-serverless/docs/overview

## Transfer Appliance · Migration
Good fit: Physical shipment of large datasets into Cloud Storage.
Signal: The online transfer window does not fit the migration plan.
Check: Include shipping, upload, availability and reconciliation in the plan.
- Offline bulk transfer with Transfer Appliance: https://docs.cloud.google.com/transfer-appliance/docs/4.0/overview

## gcloud storage cp · Migration
Good fit: Ad hoc object and file copy from the command line.
Signal: An operator needs a direct supported copy operation.
Check: A copy command alone is not a recurring orchestration or database CDC contract.
- Ad hoc copies with gcloud storage cp: https://docs.cloud.google.com/sdk/gcloud/reference/storage/cp

## Apache Iceberg managed tables · Storage
Good fit: BigQuery-managed open-format tables in customer-owned Cloud Storage.
Signal: Need documented BigQuery writes and open-format interoperability.
Check: Validate exact table capabilities and the supported mutation path.
- Apache Iceberg managed tables in BigQuery: https://docs.cloud.google.com/bigquery/docs/biglake-iceberg-tables-in-bigquery

## Database Migration Service · Migration
Good fit: Supported operational database migration paths.
Signal: Move a supported source database to a supported operational destination.
Check: Confirm source/target features and cutover rather than assuming warehouse CDC.
- Database Migration Service overview: https://docs.cloud.google.com/database-migration/docs/overview

## Review scope
Editorial reading of the listed primary documentation for these specific claims. HTTP availability is recorded separately. No ASR or exhaustive course validation is implied.
