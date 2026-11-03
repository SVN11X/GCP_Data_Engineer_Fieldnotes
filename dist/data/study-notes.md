# Data Engineer Fieldnotes
Original learning notes. Independent study material; no certification outcome is guaranteed.
Reviewed: 2026-11-03
## Study route

### 1.1 · Give each identity just enough access
Start with who is acting, which resource is involved, and which operation is necessary.

**Understand the idea**
IAM binds principals to roles on resources. A service account is an identity for a workload. Separate production from development and assign human permissions through groups so membership changes remain manageable.

**Make the decision**
Grant the narrowest useful role at an appropriate resource scope. Prefer attached workload identities or impersonation over downloading long-lived keys. Network restrictions do not replace identity permissions.

**Work through a scenario**
A nightly loader reads one bucket and writes one dataset. Give its service account those permissions; the engineer running it does not need to remain Project Owner.

**Separate four identities**
Identify the human or automation submitting a job, the workload identity reading the data, the service agent managing infrastructure, and the downstream consumer. They can require different grants. A service account is not a collection of credentials: it is the principal. A key is only one way to authenticate as that principal.

**Follow the permission through the hierarchy**
A narrowly scoped local grant does not erase a broader inherited grant. Inspect organization, folder and project access before concluding that production is isolated. Granting a group access makes membership easier to manage, but the group itself must still be governed. Audit both role bindings and who can alter membership.

**Prefer short-lived credentials where possible**
For an external CI workload, federation can exchange a trusted external identity for short-lived Google credentials. For a workload already running on Google Cloud, an attached identity is often the simpler starting point. Impersonation permission is itself powerful; granting it broadly can defeat otherwise narrow data permissions.

Common trap: A project-wide Editor role creates more exposure than a bucket reader and dataset writer need.

Try it: A job submitter has permission to start Dataflow, but workers cannot read a bucket. Which permission chain should you inspect?

Reasoning: Inspect the worker service account actually attached to the job and its effective bucket permissions. Also verify that the submitter may use that identity. Giving the human more project-wide permissions is not evidence that the worker gained read access.
- Name the principal that accesses each resource.
- Distinguish inherited access from a local binding.
- Explain why a downloaded key is not an IAM role.

References:
- Identity and Access Management: https://docs.cloud.google.com/iam/docs/overview
- Secure service account practices: https://docs.cloud.google.com/iam/docs/best-practices-service-accounts
- Federated workload identities: https://docs.cloud.google.com/iam/docs/workload-identity-federation
- Cloud Audit Logs and access events: https://docs.cloud.google.com/logging/docs/audit

### 1.1 · Trace identities across a private pipeline
Find the real principal and network path at every boundary.

**Build an identity map**
List the person or CI process submitting work, the service agent creating resources, the worker account and the identities of downstream readers. For each operation, write principal, action and resource. This prevents a common diagnostic mistake: changing the submitter’s role when a worker is failing to read data.

**Then build a network map**
For each endpoint, verify resolution, route, firewall controls and the service’s supported private-access configuration. Reaching an API is not the same as being authorized to use it. A Shared VPC introduces host-project subnet administration as well as service-project job administration.

**Use minimal evidence to narrow the fault**
Identify whether the error is an authorization denial, name-resolution failure, connection refusal or timeout. Follow the actual worker configuration rather than assuming a default identity. Use short-lived authentication mechanisms when appropriate and keep secrets out of code, logs and notebooks.

Common trap: Broad Project Owner grants can hide the boundary you need to understand.

Try it: The job launches, source reads succeed and BigQuery writes fail with an access error. Which boundary is the first focus?

Reasoning: Inspect the sink write permissions of the identity performing the write, together with the dataset and job configuration. Starting the job and reading its source already provide evidence about other boundaries.
- Map a principal to each operation.
- Separate authorization from connectivity.
- Keep credentials out of diagnostic output.

References:
- Identity and Access Management: https://docs.cloud.google.com/iam/docs/overview
- Dataflow identities and roles: https://docs.cloud.google.com/dataflow/docs/concepts/access-control
- Dataflow networking and subnetworks: https://docs.cloud.google.com/dataflow/docs/guides/specifying-networks
- Secure service account practices: https://docs.cloud.google.com/iam/docs/best-practices-service-accounts
- Federated workload identities: https://docs.cloud.google.com/iam/docs/workload-identity-federation

### 1.1 · Protect the values, the keys and the boundary
Encryption, authorization and data minimization solve different parts of the problem.

**Understand the idea**
CMEK gives your organization control over encryption keys; it does not make every user authorized. Sensitive Data Protection can inspect and transform private values before analysts receive them.

**Make the decision**
Use row policies for allowed records and column policies for restricted fields. Use a service perimeter to reduce exfiltration across supported APIs. Check residency requirements for both processing and storage.

**Work through a scenario**
Support agents need active customers, while analysts need all customers without national IDs. Combine a row filter for support with protected or transformed sensitive columns for analysts.

**Choose the control by what must change**
Row policies restrict records. Column policies restrict fields. Masking changes which representation a permitted reader receives. De-identification transforms the data itself. An authorized view exposes a chosen query result. Encryption protects data under a key-management model; it does not decide which business rows an analyst should see. Combine controls when the requirement spans these layers.

**Keep permissions separate from geography**
Selecting a dataset location and constraining resource creation address different concerns. Also inspect where processing, staging, exports and recovery copies occur. A regional label is not proof of compliance with every legal requirement, and a service perimeter is not a substitute for the dataset’s actual location.

**Trace key ownership and recovery**
For CMEK, the service performing the encryption must be allowed to use the relevant key and the supported key location must fit the service. Plan key access and recovery with the data recovery plan. Deleting a shared key can affect more records than intended; per-person cryptographic deletion requires deliberate key granularity.

Common trap: A firewall rule alone cannot express which BigQuery columns a user can read.

Try it: Analysts need all orders with masked identifiers; fraud investigators need original identifiers only for their cases. What must your design distinguish?

Reasoning: Distinguish the allowed rows, column or masked-value access, and the identity of each reader. Define which users may obtain original values and check inherited grants. A single project role or bucket encryption setting cannot express all these business conditions.
- Match a record restriction to row security.
- Explain masking versus changing the stored dataset.
- Include staging and backups in a residency decision.

References:
- Customer-managed encryption keys: https://docs.cloud.google.com/kms/docs/cmek
- De-identifying sensitive information: https://docs.cloud.google.com/sensitive-data-protection/docs/deidentify-sensitive-data
- BigQuery row access policies: https://docs.cloud.google.com/bigquery/docs/row-level-security-intro
- BigQuery column access policies: https://docs.cloud.google.com/bigquery/docs/column-level-security-intro
- Service perimeters and exfiltration protection: https://docs.cloud.google.com/vpc-service-controls/docs/overview
- Dynamic data masking: https://docs.cloud.google.com/bigquery/docs/column-data-masking-intro
- BigQuery dataset and job locations: https://docs.cloud.google.com/bigquery/docs/locations

### 1.1 · Choose locations against residency and recovery
A geographic requirement needs an explicit map of data copies and operations.

**List every place the data exists**
Include source capture, staging files, processing workers, warehouse datasets, temporary outputs, diagnostic logs and recovery copies. Ask whether the requirement covers storage, processing or both. Do not assume a single regional dataset setting constrains every other service in the route.

**Compare allowed geography with failure domains**
A rule restricting all copies to one region can conflict with a request to recover from that region’s complete loss. Surface that constraint explicitly and compare supported designs. A multi-region label should not be treated as a guarantee of any chosen failover behavior or zero recovery time.

**Validate access in the recovery environment**
The destination needs usable keys, roles, quotas, dependencies and a procedure to redirect consumers. Test with a controlled recovery copy and compare recovered business totals. Document which failure model, loss objective and restoration objective the evidence actually supports.

Common trap: Location, jurisdiction, availability and backup retention are related but different requirements.

Try it: A policy allows only one region, while the requested disaster plan requires another region. What is the right design response?

Reasoning: Expose the conflicting constraints and obtain an approved recovery scope; do not quietly place a forbidden copy elsewhere or pretend a same-region copy satisfies regional loss.
- Inventory staging and recovery copies.
- Distinguish allowed geography from availability.
- Test recovery permissions as well as data.

References:
- BigQuery dataset and job locations: https://docs.cloud.google.com/bigquery/docs/locations
- BigQuery reliability and failure domains: https://docs.cloud.google.com/bigquery/docs/reliability-intro
- Cross-region BigQuery replication: https://docs.cloud.google.com/bigquery/docs/data-replication
- Customer-managed encryption keys: https://docs.cloud.google.com/kms/docs/cmek

### 1.2 · Make correctness part of the architecture
A pipeline that finishes can still deliver the wrong result.

**Understand the idea**
Define a data contract: required fields, valid ranges, unique identifiers and freshness. An idempotent operation has the same effect when retried with the same input. ACID transactions keep related database changes consistent.

**Make the decision**
Check counts and business totals as well as schema. Quarantine malformed records with an error reason. Test a representative fixed dataset before changing a production transformation.

**Work through a scenario**
A payment retry arrives twice. Store a stable event ID and make the write idempotent, then reconcile the final totals. Exactly-once processing alone does not protect an arbitrary external API call.

**Define the grain and the invariants**
The grain describes what one row represents: an order, an order line or an event observation. Define a stable business key at that grain. Quality rules should then protect required values, uniqueness, valid ranges and relationships. Reconcile a financial total as well as row counts: equal counts can still hide duplicated or corrupted values.

**Separate transport, processing and business effects**
At-least-once delivery can repeat a message. A processing engine may deduplicate its managed output while still retrying user code. A destination can support idempotent writes without making an unrelated API call transactional. State the guarantee at each boundary rather than describing the whole business flow with one exactly-once label.

**Make replay safe before you need it**
A stable event ID recognizes repeats; an ordering or version rule decides which update is newest. Keep the raw evidence and a reason for rejected records. Decide whether a replay replaces a partition, merges by key, or appends an explicitly versioned observation. Blindly appending rerun output can double the result.
```
-- Deterministic deduplication requires a stable ordering key.
SELECT * EXCEPT(row_number)
FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY event_id
    ORDER BY event_time DESC, ingestion_sequence DESC
  ) AS row_number
  FROM `project.staging.events`
)
WHERE row_number = 1;
```

Common trap: Do not equate an acknowledged message with a completed external business transaction.

Try it: A report has the correct row count but twice the revenue. What two checks would you add?

Reasoning: Check the grain and join cardinality, then reconcile business totals against the source. A one-to-many join can multiply order-level revenue without changing an unrelated count metric. Use stable keys and test reruns against the same expected total.
- State the grain before designing a key.
- Name the exact boundary of a delivery guarantee.
- Define what a replay should change.

References:
- Dataflow delivery and side effects: https://docs.cloud.google.com/dataflow/docs/concepts/exactly-once
- Spanner consistency and scale: https://docs.cloud.google.com/spanner/docs
- Dataform data quality assertions: https://docs.cloud.google.com/dataform/docs/test-data
- GoogleSQL DML and MERGE semantics: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax

### 1.3 · Design for the next requirement
Keep data discoverable and make deliberate tradeoffs about portability.

**Understand the idea**
Separate durable data from temporary compute. Open formats can make the same objects usable by multiple processing engines. A catalog records business meaning and technical metadata; lineage explains where an output came from.

**Make the decision**
Choose formats, regions and interfaces against actual business constraints. A portable file format does not automatically make permissions, orchestration or application code portable.

**Work through a scenario**
A team reuses data in Spark and a warehouse. Keep a documented object-storage landing area and govern the assets centrally rather than copying an undocumented dataset for each tool.

**Portability has several layers**
A readable open file format helps different engines consume data, but it does not transfer IAM bindings, private connectivity, scheduling or SQL semantics. Separate the durable data contract from the execution environment. Record partition layout, schemas, schema changes and ownership so another engine can reproduce the interpretation.

**Keep discovery connected to governance**
A catalog can describe assets and lineage across a platform. It is not automatically the authority granting access to every underlying object. A useful product contract identifies the owner, business meaning, access path, expected freshness and quality checks. A discovered dataset can still be unusable if those details are absent.

**Choose a measured migration boundary**
Preserve an existing Spark application when the business needs a fast move with minimal changes. Rewriting everything as warehouse SQL may be a later optimization rather than a prerequisite. Conversely, retaining a persistent cluster solely for a small SQL transformation can add unnecessary operational work.

Common trap: The guide says Dataplex; current documentation also uses Knowledge Catalog. Learn the governance capability as well as the name.

Try it: A team says that exporting Parquet makes its entire platform portable. What is missing?

Reasoning: The file format addresses data readability. The team must also account for schema evolution, authorization, catalogs, network paths, transformation semantics and orchestration. Portability is a set of tested contracts, not a property guaranteed by a filename extension.
- Separate data portability from application portability.
- Describe a data product contract.
- Name one reason to modernize after a migration.

References:
- Dataproc / managed Spark clusters: https://docs.cloud.google.com/dataproc/docs/concepts/overview
- Knowledge Catalog (guide: Dataplex): https://docs.cloud.google.com/knowledge-catalog/docs/introduction
- Data Catalog transition guidance: https://docs.cloud.google.com/knowledge-catalog/docs/transition-to-dataplex-catalog
- BigLake access delegation: https://docs.cloud.google.com/bigquery/docs/biglake-intro
- Google Cloud Well-Architected Framework: https://cloud.google.com/architecture/framework

### 1.4 · Migrate with a validation and cutover plan
Estimate transfer time before choosing the transfer mechanism.

**Understand the idea**
Inventory source formats, change rates, network capacity, dependencies and acceptable downtime. A full load moves existing records; change data capture tracks later changes. Reconcile counts, checksums or business totals before cutover.

**Make the decision**
Use Datastream for supported database change capture, scheduled connectors for supported recurring imports, and Storage Transfer Service for object or file movement. Consider Transfer Appliance when offline movement suits the timeline.

**Work through a scenario**
At 20 megabits per second, 1 petabyte needs about 12.7 years of ideal continuous transfer. A six-month deadline requires a different path; protocol tuning cannot close that gap.

**Inventory before selecting a connector**
Record the source engine and version, formats, primary keys, change volume, update and delete behavior, network route and downtime limit. A named managed transfer product does not support every proprietary source. Database migration and warehouse ingestion are also different destination problems. Choose only after checking the supported source-to-target path.

**Separate the snapshot from later changes**
A bulk backfill moves the existing state. Change capture carries later modifications. Plan the transition so changes during the backfill are not lost or applied in the wrong order. Reconcile key counts and business values, and define how deletes are represented. Keep a rollback decision until validation is complete.

**Use units in a transfer estimate**
For a lower-bound estimate, transfer seconds = bytes × 8 ÷ bits per second. Convert units consistently and then allow for utilization, protocol overhead, competing traffic and retries. A link’s advertised capacity is not an end-to-end application guarantee. Offline appliances add shipping and handling time even if they reduce network transfer time.

Common trap: An unnamed proprietary file format is not automatically supported by a managed transfer connector.

Try it: A 10 TB snapshot is copied successfully while the source keeps changing. Is it safe to redirect production immediately?

Reasoning: Not from that evidence alone. Verify change capture coverage, catch-up lag, updates and deletes, business reconciliation, consumer compatibility and a rollback condition. A completed bulk copy does not prove that the destination represents the current source state.
- Explain snapshot versus CDC.
- Calculate a transfer lower bound with explicit units.
- Define validation and rollback criteria.

References:
- Change data capture with Datastream: https://docs.cloud.google.com/datastream/docs/overview
- Scheduled MySQL ingestion into BigQuery: https://docs.cloud.google.com/bigquery/docs/mysql-transfer-intro
- Storage Transfer Service: https://docs.cloud.google.com/storage-transfer/docs/overview
- Offline bulk transfer with Transfer Appliance: https://docs.cloud.google.com/transfer-appliance/docs/4.0/overview
- GoogleSQL DML and MERGE semantics: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax

### 1.4 · Move from a snapshot to a changing source
Plan updates, deletes, ordering and cutover as one contract.

**Define initial and incremental state**
A snapshot is a representation of the source at a point or supported consistent boundary. CDC records later changes. The transition must cover modifications occurring during the full load. Check the connector’s supported source semantics rather than assuming event timestamps alone establish a consistent order.

**Design the destination interpretation**
An event history can append each observed change, while a current-state table needs a version-aware application rule. Handle deletes deliberately. If multiple source versions arrive, a stale update must not overwrite a newer one simply because it was processed last. Deduplicate competing source versions before a MERGE when necessary.

**Make cutover a measured decision**
Measure source-to-target lag and compare source and destination business invariants. Test consumer queries against the new schema. Define what would trigger rollback and how any writes during the switch are reconciled. A green bulk-load job is only one part of the decision.

Common trap: Source change order and processing arrival order are not interchangeable.

Try it: Version 4 for an entity arrives after version 5. What should a current-state merge do?

Reasoning: Keep the newer accepted version under the chosen source ordering contract. A MERGE condition and pre-deduplicated source should prevent the stale update from overwriting it.
- Explain the snapshot-to-CDC boundary.
- Describe update and delete behavior.
- Define cutover and rollback evidence.

References:
- Change data capture with Datastream: https://docs.cloud.google.com/datastream/docs/overview
- GoogleSQL DML and MERGE semantics: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax
- Scheduled MySQL ingestion into BigQuery: https://docs.cloud.google.com/bigquery/docs/mysql-transfer-intro

### 2.1 · Define the source, sink and network path
Draw the complete route a record must travel.

**Understand the idea**
A source emits records, transforms change them, and a sink stores or serves the result. Specify latency, throughput, schema and delivery behavior. Verify that workers can reach both data endpoints and required Google APIs.

**Make the decision**
Private workers need an appropriate subnet, API access and IAM permissions. In a Shared VPC, distinguish the worker identity, job submitter and Google-managed service agent.

**Work through a scenario**
Dataflow reads Kafka on premises and writes BigQuery. An existing private connection may let KafkaIO read directly, avoiding an extra message bridge and its latency.

**Write a contract for every boundary**
Describe the source schema, event identity, time semantics, maximum acceptable lag and destination behavior. Include what happens to bad records and who is responsible for fixing them. A pipeline can meet its worker CPU target while failing the business requirement because the final data is stale.

**Trace the complete private route**
A worker may need to reach a database, object storage, an API endpoint and an artifact or dependency repository. Check DNS, routes, firewall controls, subnet selection and Google API access for each path. IAM can permit an operation while networking still prevents the connection, and the reverse is also possible.

**Distinguish control and data planes**
Creating a job is a control-plane action; workers reading and writing records perform data-plane actions. With a Shared VPC, permission to submit a job in the service project does not alone establish subnet access in the host project. Follow the current service-specific identity guidance rather than granting broad administration to an arbitrary account.

Common trap: Granting Dataflow Admin does not by itself grant permission to use another project’s subnet.

Try it: A Dataflow job starts but cannot reach an on-premises database. What evidence should you collect first?

Reasoning: Identify the actual workers, selected subnet, resolved destination, connection route and failure message. Check private connectivity and firewall policy alongside the worker identity’s database and cloud permissions. Starting the job proves control-plane access, not complete data-plane connectivity.
- Document latency and malformed-data behavior.
- Trace dependencies beyond the source and sink.
- Distinguish job creation from worker data access.

References:
- Dataflow networking and subnetworks: https://docs.cloud.google.com/dataflow/docs/guides/specifying-networks
- Dataflow identities and roles: https://docs.cloud.google.com/dataflow/docs/concepts/access-control
- Dataflow concepts: https://docs.cloud.google.com/dataflow/docs/overview
- Dataflow and the Beam programming model: https://docs.cloud.google.com/dataflow/docs/concepts/beam-programming-model

### 2.1 · Separate Pub/Sub delivery, ordering and replay
A messaging guarantee must be tied to its supported subscription and region.

**Delivery is not a unique business event**
A publisher retry can submit the same logical order as distinct messages. A supported exactly-once pull subscription addresses its documented delivery contract; it does not automatically recognize two different message IDs as the same business order. Preserve a stable business ID and protect external effects.

**Ordering has a key and a scope**
Supported ordering preserves related publication order under the configured ordering-key and regional requirements. It does not impose one event-time order across all keys or prove which globally distributed business event physically occurred first. Consider the impact of slow work for a key on later related messages.

**Replay depends on retained history**
A seek can replay retained input, but enabling retention after old data was discarded cannot recover that missing history. A snapshot records acknowledgement state under its documented lifetime. Before deploying risky subscriber changes, decide which retained history and safe output contract make rollback useful.

Common trap: Exactly-once delivery is not an automatic end-to-end payment transaction guarantee.

Try it: Two publishers send the same business order with different Pub/Sub message IDs. Is subscription exactly-once enough?

Reasoning: No. It addresses the supported message delivery contract, not arbitrary publisher-level business duplication. The destination or business operation needs an idempotency contract using a stable business order ID.
- Distinguish message ID from business event ID.
- State the ordering scope.
- Plan retention before relying on seek.

References:
- Pub/Sub exactly-once delivery: https://docs.cloud.google.com/pubsub/docs/exactly-once-delivery
- Dataflow delivery and side effects: https://docs.cloud.google.com/dataflow/docs/concepts/exactly-once
- Pub/Sub ordering keys: https://docs.cloud.google.com/pubsub/docs/ordering
- Message retention and seek: https://docs.cloud.google.com/pubsub/docs/replay-overview
- Pub/Sub dead-letter topics: https://docs.cloud.google.com/pubsub/docs/dead-letter-topics

### 2.2 · Choose the engine that fits the work
Minimize necessary code changes, then consider operating effort.

**Understand the idea**
Dataflow runs Apache Beam pipelines for bounded or unbounded data. Dataproc supports existing Spark and Hadoop ecosystems. Data Fusion provides visual integration. Dataform manages SQL transformations and dependencies in BigQuery.

**Make the decision**
Use existing workload compatibility as a constraint. A nightly SQL transformation does not automatically need a streaming engine; an existing Hive application may favor managed Spark/Hadoop tooling.

**Work through a scenario**
A team has hundreds of Spark jobs and a short migration deadline. Move durable inputs to Cloud Storage and keep the Spark execution model before planning a later SQL rewrite.

**Start with the existing execution model**
Beam and Dataflow suit a pipeline described as transforms over bounded or continuous collections. Spark and Hadoop compatibility can favor Dataproc or managed Spark. Dataform fits warehouse SQL graphs. Data Fusion offers visual integration. Workflows and Composer coordinate execution; they do not replace the engine doing every heavy transformation.

**Decide ETL versus ELT from the constraint**
ETL transforms before the analytical load; ELT loads a staging representation and transforms inside the warehouse. ELT can simplify a SQL-centric system, but it is not appropriate if unprotected sensitive values must never reach that staging location. Choose based on data handling, transformation needs, scale and ownership.

**Avoid choosing by a single adjective**
Serverless, managed and real time are not complete architectures. A service may reduce infrastructure work while still requiring schema design, identity configuration, dependency control and monitoring. Compare compatibility, transformation expressiveness, expected delay and operation cost using the same workload.

Common trap: A product being serverless does not mean its processing, storage and network use are free.

Try it: A daily BigQuery SQL aggregate and an existing Spark ML job must both run. Must they share the same engine?

Reasoning: No. Keep the SQL transformation in a suitable warehouse workflow and preserve the Spark execution model where that fits the application. Coordinate their dependencies and validate the shared data contract. Using one engine everywhere is not a requirement unless the business explicitly imposes it.
- Separate orchestration from transformation.
- Explain one valid ETL privacy constraint.
- Compare engines using the same requirements.

References:
- Dataflow concepts: https://docs.cloud.google.com/dataflow/docs/overview
- Dataproc / managed Spark clusters: https://docs.cloud.google.com/dataproc/docs/concepts/overview
- Visual integration with Cloud Data Fusion: https://docs.cloud.google.com/data-fusion/docs/concepts/overview
- Dataform data quality assertions: https://docs.cloud.google.com/dataform/docs/test-data
- Dataflow and the Beam programming model: https://docs.cloud.google.com/dataflow/docs/concepts/beam-programming-model
- Deploying Dataflow pipelines: https://docs.cloud.google.com/dataflow/docs/guides/deploying-a-pipeline

### 2.2 · Find the limit before adding Dataflow workers
Use stage-level evidence to distinguish capacity from parallelism.

**Different bottlenecks need different changes**
A source or sink can throttle the pipeline, a hot key can concentrate aggregation, a fused stage can restrict redistribution, and worker code can exhaust memory. Increasing the maximum worker setting does not guarantee that any of these constraints disappears. Inspect stage behavior and backlog together.

**Understand why work is or is not splittable**
Elements may be processed in parallel, but a particular grouping or stateful key can create a serial boundary. An explicit redistribution can help some fusion cases while adding materialization and network overhead. A hot-key redesign must preserve the aggregation semantics; random salting alone does not explain how results are recombined.

**Evaluate autoscaling with the full contract**
Check configured limits, available quota, job options, processing backlog and source/sink behavior. Compare a representative run before and after a change. Track output correctness and freshness, not just the number of active workers.

Common trap: More workers are not proof of more useful parallel work.

Try it: One aggregation key dominates the workload while other workers are idle. What hypothesis should you test?

Reasoning: Investigate hot-key concentration and the serial aggregation boundary. Consider a correctness-preserving partial aggregation and recombination strategy, then measure the affected stage rather than merely raising the global worker limit.
- Identify a stage-specific bottleneck.
- Distinguish hot keys from fusion.
- Measure output correctness after tuning.

References:
- Troubleshooting Dataflow autoscaling: https://docs.cloud.google.com/dataflow/docs/guides/troubleshoot-autoscaling
- Dataflow pipeline implementation practices: https://docs.cloud.google.com/dataflow/docs/guides/pipeline-best-practices
- Dataflow and the Beam programming model: https://docs.cloud.google.com/dataflow/docs/concepts/beam-programming-model
- Streaming autoscaling controls: https://docs.cloud.google.com/dataflow/docs/guides/tune-horizontal-autoscaling

### 2.2 · Reason about event time and late data
When an event happened and when a worker saw it can be different.

**Understand the idea**
A fixed window groups timestamps into equal intervals. A sliding window can overlap. A session groups activity separated by a chosen inactivity gap. A watermark estimates event-time progress; it is not a guarantee that every earlier event arrived.

**Make the decision**
Choose allowed lateness and triggers based on the tradeoff between early results and later corrections. Preserve source timestamps rather than replacing them with processing time.

**Work through a scenario**
A click created at minute 2 arrives after one created at minute 9. It belongs to the earlier event-time window, if that window is still allowed to accept data.

**Define what the output represents**
A fixed window has clock-aligned boundaries. A sliding window can include an event in overlapping intervals. A session merges activity according to an inactivity gap, typically after grouping by an entity key. Do not confuse an analytical SQL window function over table rows with a streaming event-time window.

**Separate watermark, trigger and retention**
The watermark estimates event-time progress. A trigger determines when a pane of results is emitted. Allowed lateness concerns how long a window may still accept delayed records. Source message retention concerns whether input can be replayed. These settings solve different problems and one does not replace the others.

**Design the downstream correction**
An early count may later change. Decide whether downstream consumers receive an updated aggregate, a replacement, or a sequence of panes they must combine correctly. Accumulating results can repeat earlier contributions; blindly summing every emitted pane can overcount. Test early, on-time and late arrivals with explicit expected totals.

Common trap: The first processed auction message is not necessarily the earliest bid.

Try it: A dashboard needs immediate provisional totals and corrected final totals. Is increasing allowed lateness enough?

Reasoning: No. Specify a trigger and accumulation strategy for interim results, the lateness policy and a sink representation that handles corrections. Retention and replay are separate concerns. Validate the final total using a known sequence of delayed and repeated events.
- Distinguish event time from processing time.
- Explain what each window type groups.
- Name how the sink applies a corrected aggregate.

References:
- Beam programming model and event time: https://beam.apache.org/documentation/programming-guide/
- Pub/Sub ordering keys: https://docs.cloud.google.com/pubsub/docs/ordering
- Beam event-time window definitions: https://beam.apache.org/releases/pydoc/current/apache_beam.transforms.window.html
- Dataflow and the Beam programming model: https://docs.cloud.google.com/dataflow/docs/concepts/beam-programming-model

### 2.2 · Plan panes, late arrivals and corrected totals
State when a result is emitted and what later updates mean.

**Assign the business timestamp**
Choose the event timestamp from the source contract. Events in a collection need keys and a windowing strategy suitable for their business aggregation. A record can arrive out of order without being invalid; dropping it changes the result and therefore requires a documented policy.

**Separate emission from completeness**
A trigger can emit an early pane before the watermark suggests expected completeness. Later panes can reflect additional records. Allowed lateness and state cleanup determine what remains possible after a window’s expected end. Exact details depend on the transform and runner configuration, so test the intended behavior.

**Match panes to a sink model**
If panes are cumulative, summing every pane as if each contained only new values double-counts earlier records. A sink may need keyed replacements or a documented accumulating representation. Use controlled delayed events to verify both the immediate dashboard and the final reconciled total.

Common trap: A watermark estimate is not an assertion that the network can never deliver an older event.

Try it: Cumulative panes contain counts 3 and then 5. What is the final count, and why not 8?

Reasoning: The later cumulative pane already contains the earlier contributions, so the final count is 5. A downstream consumer must understand pane semantics rather than blindly add all emitted aggregates.
- Define event time and keys.
- Explain trigger versus watermark.
- State how the sink applies corrections.

References:
- Dataflow and the Beam programming model: https://docs.cloud.google.com/dataflow/docs/concepts/beam-programming-model
- Beam event-time window definitions: https://beam.apache.org/releases/pydoc/current/apache_beam.transforms.window.html
- Beam programming model and event time: https://beam.apache.org/documentation/programming-guide/
- Dataflow delivery and side effects: https://docs.cloud.google.com/dataflow/docs/concepts/exactly-once

### 2.2 · Route failures without losing the evidence
A rejected record should remain explainable and recoverable.

**Understand the idea**
Validate fields before loading typed warehouse tables. Separate valid rows from a dead-letter output containing the original payload, error type and event identifier. Distinguish permanent invalid data from temporary service errors.

**Make the decision**
Use bounded retry with backoff for transient failures. Monitor the failure output and define who repairs or replays it. A Pub/Sub dead-letter delivery-attempt limit is approximate rather than an exact retry counter.

**Work through a scenario**
An address column mixes formats. A visual Data Fusion transformation can standardize values, while a quarantine path keeps rows whose values cannot be interpreted safely.

**Separate data errors from service errors**
A missing mandatory key or malformed date usually needs correction of the record or transformation rule. A temporary API outage may benefit from bounded retry. Repeating permanent bad input indefinitely consumes capacity and blocks useful work without improving correctness. Classify the failure before selecting retry behavior.

**Keep a repairable error record**
An error output should preserve a stable identifier, the original or safely redacted payload, the validation rule, processing context and enough timing information to investigate. Protect this output as carefully as the primary dataset if it contains personal information. A dead-letter store is part of the data architecture, not a place where responsibility ends.

**Make reinsertion a controlled path**
Define how repaired records return to processing and how their identity prevents duplicate business results. Record the repair decision and monitor the growing backlog. A decreasing main-pipeline error rate can hide a worsening quarantine backlog if the two metrics are not considered together.
```
# Conceptual Beam flow: provide your own transform definitions.
valid, invalid = (
    records
    | beam.ParDo(ValidateRecord()).with_outputs(
        'invalid', main='valid'
    )
)
```

Common trap: Converting malformed CSV to Avro does not by itself repair the underlying values.

Try it: All invalid records are retained, but nobody reviews the error dataset. Is the data-quality problem solved?

Reasoning: No. Retention preserves evidence but does not repair the business data. Assign ownership, measure the failure backlog, classify causes and define a safe replay path. Reconcile the repaired output with the expected business totals.
- Classify transient versus permanent errors.
- Specify fields in a repairable error record.
- Include ownership and replay in the design.

References:
- Visual integration with Cloud Data Fusion: https://docs.cloud.google.com/data-fusion/docs/concepts/overview
- Pub/Sub dead-letter topics: https://docs.cloud.google.com/pubsub/docs/dead-letter-topics
- Beam programming model and event time: https://beam.apache.org/documentation/programming-guide/
- Pub/Sub retry behavior: https://docs.cloud.google.com/pubsub/docs/subscription-retry-policy
- Monitoring alert policies: https://docs.cloud.google.com/monitoring/alerts

### 2.2 · Choose load, stream and merge behavior explicitly
Ingestion method determines visibility, retry and schema responsibilities.

**Batch loading and streaming solve different timing needs**
Recurring object files can fit a batch load or supported transfer configuration. A streaming writer serves a different freshness contract. Confirm the supported file format, compression, location and schema. A filename ending in JSON does not establish that a compressed file uses the newline-delimited structure the loader expects.

**Use offsets within their real boundary**
Correctly managed offsets on supported application-created Storage Write API streams can make repeated append attempts identifiable. The offset scope is a stream, not every message from every producer forever. Producer-side duplicate business events still require an appropriate identity and downstream interpretation.

**Make current-state updates deterministic**
For MERGE, define the match key and keep the source rows appropriate for the intended update semantics. Multiple source matches can produce errors for updating a target row. A deterministic latest-version selection is different from selecting an arbitrary row, especially when event times tie.

Common trap: The default write stream and offset-managed application streams do not have identical contracts.

Try it: A source batch has three updates for one target key. What should you define before MERGE?

Reasoning: Define the source ordering and current-state selection, deduplicate to the intended row per key, and decide how older versions and deletes are handled. Do not assume MERGE invents the business rule.
- Distinguish load versus stream requirements.
- State the offset scope.
- Define source cardinality for MERGE.

References:
- Loading newline-delimited JSON: https://docs.cloud.google.com/bigquery/docs/loading-data-cloud-storage-json
- Stream offsets and safe write retries: https://docs.cloud.google.com/bigquery/docs/write-api-best-practices
- BigQuery streaming write concepts: https://docs.cloud.google.com/bigquery/docs/write-api-intro
- GoogleSQL DML and MERGE semantics: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax
- Analytical window functions: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/window-function-calls

### 2.2 · Enrich records with models, carefully
Model output is another data dependency with latency and quality constraints.

**Understand the idea**
A Beam transform can validate records and route multiple outputs. Inference can add a predicted label. Generative enrichment also needs structured output validation, error handling and protection of sensitive inputs.

**Make the decision**
Batch requests where supported, control concurrency and test the chosen model adapter. Do not assume every text-generation endpoint can be called through any RunInference configuration without an integration.

**Work through a scenario**
For customer comments, validate the customer ID, remove unnecessary personal details, classify sentiment, and send malformed or failed inference results to review.

**Treat the model as a fallible dependency**
A successful HTTP call is not proof that the returned classification is valid. Check structured output, allowed labels, missing fields and service errors. Account for endpoint latency and request capacity when sizing a pipeline. Control concurrency so a temporary inference slowdown does not create an unbounded backlog.

**Control the input and the evidence**
Send only the information needed for the task. Separate untrusted document text from trusted processing instructions, retain the model and prompt version where permitted, and make results traceable to the input. Use human review where the application requires it rather than presenting generated values as validated ground truth.

**Choose where enrichment belongs**
In-pipeline inference can meet a before-load requirement but couples ingestion to model availability. A staged warehouse enrichment can simplify reprocessing when raw data is allowed in that environment. Select from the privacy boundary, latency target, supported model interface and recovery behavior instead of assuming a single product is always optimal.

Common trap: A confidently formatted model response can still be incorrect or fail your schema.

Try it: An enrichment endpoint returns an unknown label while the request status is successful. What should happen?

Reasoning: Validate the response against the output contract and route or flag it for review. Preserve the input identity and error context for a controlled retry or repair. Do not silently invent a default business label merely to keep a success metric high.
- Validate model output beyond HTTP success.
- Account for model latency and concurrency.
- Compare in-pipeline and staged enrichment.

References:
- Beam programming model and event time: https://beam.apache.org/documentation/programming-guide/
- AI capabilities in BigQuery: https://docs.cloud.google.com/bigquery/docs/ai-introduction
- De-identifying sensitive information: https://docs.cloud.google.com/sensitive-data-protection/docs/deidentify-sensitive-data
- Text generation with BigQuery AI: https://docs.cloud.google.com/bigquery/docs/generate-text
- Dataflow pipeline implementation practices: https://docs.cloud.google.com/dataflow/docs/guides/pipeline-best-practices

### 2.3 · Deploy a pipeline you can safely replace
Make release behavior part of the design, before the first production run.

**Understand the idea**
Version code and configuration, validate schemas, and test with representative records. A compatible streaming update can preserve state. An incompatible update needs a controlled replacement and recovery strategy.

**Make the decision**
Plan drain, source retention and replay together. Draining processes in-flight work; canceling may discard it. Decide whether the source can retain new messages while the replacement starts.

**Work through a scenario**
A windowing change is incompatible. Retain the source messages, drain the old job, start the replacement, and reconcile outputs rather than assuming a flag makes arbitrary state changes compatible.

**Version more than application code**
Record the schema contract, runtime dependencies, worker identity, network configuration and relevant job options with a release. A tested transform can still fail in production if the deployment changes a subnet or service account. Keep representative test inputs and output assertions with the release evidence.

**Choose the update path from compatibility**
A compatible stateful update and a replacement job have different requirements. Changes to state, coders or windowing can make an in-place update unsuitable. Review current upgrade guidance, source retention and the behavior of in-flight work before choosing drain or cancel. A deployment flag is not proof of semantic compatibility.

**Plan the reconciliation and rollback**
Define the expected output for the overlap or transition interval and how duplicates are recognized. Test a replay from retained source data in a controlled destination. Preserve a usable recovery path until you have evidence that the new release meets quality and freshness requirements.

Common trap: A successful CI deployment is not evidence that output totals remain correct.

Try it: Your integration tests pass, but the new job uses a different worker service account. What additional review is required?

Reasoning: Review the effective permissions and private network path for that identity, along with artifact and source access. Then validate real output and freshness during a controlled release. Passing transformation tests does not prove that the deployed environment has the same access contract.
- Version identities and networking with code.
- Distinguish a compatible update from replacement.
- Define a measurable rollback condition.

References:
- Upgrading a streaming pipeline: https://docs.cloud.google.com/dataflow/docs/guides/upgrade-guide
- Message retention and seek: https://docs.cloud.google.com/pubsub/docs/replay-overview
- Deploying Dataflow pipelines: https://docs.cloud.google.com/dataflow/docs/guides/deploying-a-pipeline
- Dataflow job lifecycle: https://docs.cloud.google.com/dataflow/docs/pipeline-lifecycle

### 2.3 · Gate publication on warehouse quality
SQL as code should define both the table and its acceptance criteria.

**Separate validation from transformation**
A transformation creates a result; an assertion tests a property of it. Non-null, unique-key and row-condition checks can detect different failures. A custom assertion typically returns violating rows, with no violations representing success. Make business thresholds and required keys explicit rather than relying on a table creation success.

**Declare the gating dependency**
A downstream action may need to depend on upstream assertion results as well as the upstream table. Use the supported dependency configuration and test a failure path. An assertion appearing in the execution graph is not enough if the consumer can run before it passes.

**Design incremental runs and replay together**
An incremental filter selects what to process, while a merge or replacement rule defines what to write. Late corrections outside a short lookback can be missed. Decide how historical backfills and corrected source records reach the target, then compare rerun counts and business totals.

Common trap: An incremental date filter is not itself a deduplication or replay contract.

Try it: A uniqueness assertion fails but the curated report still refreshes. What should you inspect?

Reasoning: Inspect the dependency relationship between the curated action and the assertion. Add and test the supported gate so invalid data cannot be published merely because the upstream table exists.
- Write quality rules at the right grain.
- Prove that an assertion blocks publication.
- Test a late correction outside the normal incremental interval.

References:
- Dataform data quality assertions: https://docs.cloud.google.com/dataform/docs/test-data
- Dataform dependencies: https://docs.cloud.google.com/dataform/docs/dependencies
- GoogleSQL DML and MERGE semantics: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax
- DML and partition pruning: https://docs.cloud.google.com/bigquery/docs/using-dml-with-partitioned-tables

### 3.1 · Start with the access pattern
Select storage from the required reads and writes, not from dataset size alone.

**Understand the idea**
BigQuery targets large analytical scans. Bigtable serves keyed, high-throughput access. Cloud SQL provides managed relational engines; Spanner supports strongly consistent distributed transactions. Cloud Storage stores objects. A cache such as Memorystore is a separate serving layer.

**Make the decision**
Ask whether the application needs joins, row lookups, multi-row transactions, document access or object reads. Firestore fits document-oriented applications; AlloyDB targets PostgreSQL-compatible relational workloads.

**Work through a scenario**
Sensor lookups need milliseconds while daily analytics need joins. Serve the keyed path from Bigtable and publish a warehouse copy for analytical scans.

**Ask six questions before choosing**
What does a read request look like? Which writes must be atomic together? How much data is read per request? What consistency is required? What availability and recovery scope are needed? Which engine or API compatibility must remain? Data volume alone cannot answer these questions. A one-row serving request and a terabyte scan can require different stores over related data.

**Separate a system of record from a serving projection**
A warehouse can retain analytical history while a keyed database serves low-latency application queries. A cache may accelerate derived values without replacing their durable source. Each additional copy needs an update contract, consistency expectation and recovery procedure; duplicating data is a design responsibility rather than a free optimization.

**Avoid overgeneralizing database labels**
NoSQL does not mean there are no transactions, and SQL does not mean every query pattern is efficient. Firestore supports a document model and transaction capabilities; Bigtable emphasizes keyed access; Spanner addresses distributed transactions. Check the actual transaction scope and access interface instead of deciding from the category name.

Common trap: A warehouse is not automatically the best transactional point-of-sale database.

Try it: A solution requires millisecond entity reads and daily cross-entity analytical joins. Why might two stores be reasonable?

Reasoning: The access paths optimize different work. A keyed serving projection can handle individual entities while the warehouse handles scans and joins. The design must still explain how updates propagate, what lag consumers accept and how the projection is rebuilt.
- Describe read and write shapes concretely.
- Name the transactional boundary.
- Distinguish durable state from a cache or projection.

References:
- Managed relational engines in Cloud SQL: https://docs.cloud.google.com/sql/docs/introduction
- PostgreSQL-compatible workloads in AlloyDB: https://docs.cloud.google.com/alloydb/docs/overview
- Firestore document-oriented applications: https://docs.cloud.google.com/firestore/native/docs/overview
- Memorystore for Redis and caching: https://docs.cloud.google.com/memorystore/docs/redis/memorystore-for-redis-overview
- Spanner consistency and scale: https://docs.cloud.google.com/spanner/docs
- Bigtable row key design: https://docs.cloud.google.com/bigtable/docs/schema-design
- BigLake access delegation: https://docs.cloud.google.com/bigquery/docs/biglake-intro
- Improving BigQuery query plans: https://docs.cloud.google.com/bigquery/docs/best-practices-performance-compute
- BigQuery reliability and failure domains: https://docs.cloud.google.com/bigquery/docs/reliability-intro

### 3.1 · Treat retention and cost as separate controls
Cheap storage is useful only if its access and retention behavior fits.

**Understand the idea**
Cloud Storage classes trade storage cost against retrieval and minimum-duration conditions. Lifecycle rules can change class or delete eligible objects. A retention policy prevents deletion until the required age; locking it is a consequential administrative choice.

**Make the decision**
Estimate the access pattern instead of assuming older data is never read. Distinguish availability, geographic placement, versioning and legal retention.

**Work through a scenario**
An audit archive is rarely read and must remain immutable for years. Choose an appropriate archival class and a retention policy, then test your retrieval procedure.

**Separate four independent decisions**
Bucket geography affects the placement and availability model. Storage class affects storage and retrieval economics. Lifecycle rules automate eligible object actions. Retention controls prevent premature modification or deletion under the configured policy. Choosing an archival class does not by itself make an object immutable or restrict who can read it.

**Model the actual access pattern**
Estimate how often data is read, how long it remains and how much is retrieved. A very cheap stored-byte rate can be offset by retrieval or minimum-duration conditions. Use current official pricing and class rules when deploying; a study scenario should identify the relevant cost dimensions rather than memorize a permanent dollar figure.

**Recoverability needs more than keeping old objects**
An organization can retain many versions but still lack the permissions, metadata or documented procedure needed to restore the intended state. Rehearse the recovery and confirm the required time and data-loss objectives. Consider how accidental deletions, overwrites and region failures differ.

Common trap: A lifecycle delete rule does not override an active retention requirement.

Try it: A user proposes an archive storage class as the only way to prevent deletion for seven years. What is missing?

Reasoning: A supported retention policy and any required lock or object protection must enforce the minimum period. IAM controls access separately. Storage class is an economic choice and does not replace retention enforcement or recovery testing.
- Keep geography, class, lifecycle and retention separate.
- Identify retrieval and early-deletion considerations.
- Define what a restore must prove.

References:
- Cloud Storage classes and retrieval tradeoffs: https://docs.cloud.google.com/storage/docs/storage-classes
- Object Lifecycle Management: https://docs.cloud.google.com/storage/docs/lifecycle
- Object protection and retention: https://docs.cloud.google.com/storage/docs/protection-backup-recovery-overview

### 3.2 · Model the warehouse around its queries
Reduce repeated work without losing the meaning of a record.

**Understand the idea**
Nested and repeated fields can represent related analytical entities without repeated joins. Partitioning separates data into segments; clustering organizes blocks within a table or partition. Column selection also affects scan volume.

**Make the decision**
Match partitions to common range filters and clustering order to selective access patterns. Preserve event identity and business keys. Avoid copying a transactional normalization rule into every analytical model.

**Work through a scenario**
Orders are queried by recent date and customer. Partition by order date, cluster by customer ID, and keep line items nested when that matches the reporting model.

**Model the business grain before optimizing**
An order-level amount should not be repeatedly summed after a join that expands one order into many lines. Define keys and cardinalities, then choose a model that represents the report’s grain. Nested and repeated fields can preserve a parent-child relationship without requiring the same join in every analytical query.

**Use filters that storage can exploit**
Partitioning helps when a query can eliminate partitions using an appropriate predicate. Clustering can skip irrelevant blocks within the remaining data. Column order matters for multi-column clustering. A selective-looking filter on an unrelated expression is not automatic evidence that the intended partitions or blocks were pruned. Inspect the actual plan and processed bytes.

**Keep changes and history explicit**
An append-only event table, a current-state dimension and a historical dimension answer different questions. Decide whether an update overwrites current truth or creates a new version. Use a stable key and a deterministic ordering rule for deduplication; a random choice among tied updates can make a rerun disagree with the previous output.
```
-- Illustrative GoogleSQL: use your own project and schema.
CREATE TABLE `project.analytics.orders`
PARTITION BY DATE(order_time)
CLUSTER BY customer_id AS
SELECT * FROM `project.staging.validated_orders`;
```

Common trap: LIMIT does not by itself reduce the bytes read from all referenced columns.

Try it: A report filters thirty days and a customer ID, but still scans much more than expected. What would you verify?

Reasoning: Check the actual partition column and predicate, selected columns, clustering specification and query plan. Confirm the report is not expanding rows through joins or UNNEST. Compare measured processed bytes under the same input and filters before claiming a storage-layout improvement.
- Explain the reporting grain.
- Write a predicate that targets the partition.
- Use a deterministic rule for current-state rows.

References:
- Partitioning BigQuery tables: https://docs.cloud.google.com/bigquery/docs/partitioned-tables
- Clustering BigQuery tables: https://docs.cloud.google.com/bigquery/docs/clustered-tables
- Improving BigQuery query plans: https://docs.cloud.google.com/bigquery/docs/best-practices-performance-compute
- Nested and repeated analytical fields: https://docs.cloud.google.com/bigquery/docs/best-practices-performance-nested
- GoogleSQL DML and MERGE semantics: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax

### 3.2 · Read SQL at the grain of the business question
Joins, arrays and analytical functions can change what one row means.

**Track cardinality through a query**
A one-to-many join repeats fields from the parent row. Summing a parent total after that expansion can multiply revenue. Pre-aggregate to a compatible grain or choose a representation that preserves the relationship. COUNT(DISTINCT parent_id) can fix one count but does not automatically fix every sum in the same query.

**Use analytical functions for a defined purpose**
ROW_NUMBER can select one observation per business key when paired with a deterministic ordering rule. A running total uses a partition, ordering and frame whose meaning should be explicit. QUALIFY filters analytical results; WHERE filters the relevant earlier row relation. None of these constructs chooses the correct business key for you.

**Handle unknown values and empty relationships**
NULL is not always zero: it may mean unavailable, inapplicable or unobserved. A WHERE filter on a nullable right-side column after a LEFT JOIN can remove rows without a match. When expanding arrays, verify how empty arrays affect the intended population and aggregation. Test these cases with tiny explicit fixtures.
```
WITH joined AS (
  SELECT 'o1' AS order_id, 100 AS order_total, 'a' AS item
  UNION ALL SELECT 'o1', 100, 'b'
  UNION ALL SELECT 'o2', 80, 'c'
)
SELECT SUM(order_total) AS wrong_grain_total
FROM joined; -- 280, not the order-grain total 180
```

Common trap: SUM(DISTINCT amount) is not a general repair for duplicated parent rows.

Try it: Two orders total 100 and 80. The first has two items, the second one. What does SUM(order_total) after the item join return?

Reasoning: The joined rows contain 100, 100 and 80, giving 280 instead of the intended order-grain total 180. Fix the grain or pre-aggregate; do not substitute a generally unsafe DISTINCT on the amount.
- Predict row multiplication.
- Explain a deterministic window ordering.
- Preserve missing values and unmatched records deliberately.

References:
- GoogleSQL query syntax: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax
- Nested and repeated analytical fields: https://docs.cloud.google.com/bigquery/docs/best-practices-performance-nested
- Analytical window functions: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/window-function-calls

### 3.3 · Make the lake usable, not just large
Raw files need schema, metadata, access rules and quality checks.

**Understand the idea**
A lake stores durable objects that different engines can process. Columnar formats can reduce work for analytical reads. BigLake can provide governed access to supported external data; a catalog makes assets discoverable.

**Make the decision**
Separate landing, validated and curated stages with explicit contracts. Monitor stale partitions and failed discovery. Check supported format and location combinations before choosing a query path.

**Work through a scenario**
A team needs reusable curated sales objects. Publish their schema, owner and freshness target, then validate incoming partitions instead of treating every uploaded object as trustworthy.

**Organize stages by their contract**
A raw landing area preserves received evidence; a validated layer enforces interpretable schema and basic quality; a curated product exposes business-ready meaning. The number of folders is not the important property. Each transition should say which validation was performed and whether a consumer may safely use its result.

**Choose access delegation deliberately**
A BigLake table can use a connection identity to reach supported external storage while readers receive table access. This differs from giving every analyst direct object permissions. The supported formats, locations, connector behavior and security features must fit the chosen source. A normal external table and a governed delegated-access design are not interchangeable labels.

**Monitor discovery and freshness separately**
Metadata discovery describes what exists; a freshness check asks whether the expected data arrived on time. A successful discovery scan can coexist with an incomplete daily partition. Monitor the input contract and data-quality result, not merely whether the catalog service is running.

Common trap: A catalog organizes metadata; it does not automatically cleanse every file it discovers.

Try it: New files are discoverable in the catalog but yesterday’s report is incomplete. Which contract should be examined?

Reasoning: Inspect expected arrivals, partition completeness, transformation quality and report freshness. Discovery succeeded as a metadata operation; it did not prove that every business record or scheduled partition was present.
- Explain what each lake stage guarantees.
- Distinguish delegated table access from direct object access.
- Separate discovery success from freshness.

References:
- Knowledge Catalog (guide: Dataplex): https://docs.cloud.google.com/knowledge-catalog/docs/introduction
- Visual integration with Cloud Data Fusion: https://docs.cloud.google.com/data-fusion/docs/concepts/overview
- Partitioning BigQuery tables: https://docs.cloud.google.com/bigquery/docs/partitioned-tables
- BigLake access delegation: https://docs.cloud.google.com/bigquery/docs/biglake-intro
- Monitoring alert policies: https://docs.cloud.google.com/monitoring/alerts

### 3.3 · Compare lake access with warehouse access
Choose where the data stays and which identity reads it.

**Native and external storage imply different work**
A native warehouse table stores data in the warehouse service. An external table queries a supported external representation. Data movement, caching, format, location and performance needs influence the choice. Keeping files external is not automatically faster or cheaper for every frequently repeated analytical workload.

**Explain delegated access**
A BigLake connection can use a service identity to read supported underlying storage while consumer authorization is managed at the table layer. This can avoid broad direct object access for each analyst. The relevant connection and policy configuration still need explicit permissions and supported locations.

**Understand metadata and freshness**
File metadata caching can improve some external-query workloads, but cached metadata has refresh and supported-feature behavior. A recently changed object layout may not immediately be reflected by a cached view of the files. Choose a freshness contract and inspect the current feature limitations.

Common trap: An external table definition is not proof that every reader has the required governed access.

Try it: Analysts should query external files without receiving direct bucket access. What capability should you evaluate?

Reasoning: Evaluate a supported BigLake delegated-access setup with a connection identity and table-level controls. Verify permissions, format and location. Do not simply grant every analyst object-viewer access and call it delegation.
- Compare native and external access paths.
- Name the identity reading the external objects.
- Explain how metadata freshness affects a query.

References:
- BigLake access delegation: https://docs.cloud.google.com/bigquery/docs/biglake-intro
- BigQuery column access policies: https://docs.cloud.google.com/bigquery/docs/column-level-security-intro
- Knowledge Catalog (guide: Dataplex): https://docs.cloud.google.com/knowledge-catalog/docs/introduction
- Loading newline-delimited JSON: https://docs.cloud.google.com/bigquery/docs/loading-data-cloud-storage-json

### 3.4 · Give distributed teams shared guardrails
Domain ownership can coexist with organization-wide standards.

**Understand the idea**
Federated governance lets domain teams own data products while shared policies define discovery, quality, security and meaning. Catalog entries, lineage and business definitions reduce accidental misuse.

**Make the decision**
Identify an owner, approved access method, quality rules and a freshness expectation for each product. Use platform capabilities rather than building a separate spreadsheet catalog for each team.

**Work through a scenario**
Marketing and finance each publish curated assets. A shared catalog exposes their meaning and lineage, while storage IAM and table policies continue to control real access.

**Define a data product people can use**
A domain-owned asset needs an accountable owner, business definition, schema, access method, update expectation and quality evidence. Federated governance adds shared guardrails without making a central team perform every domain transformation. Publish enough context for consumers to understand what the product does and does not represent.

**Use lineage to investigate impact**
Technical lineage connects inputs, transformations and outputs. When a source changes, use it to identify potentially affected consumers; then review actual contracts and tests. A lineage edge alone does not establish that an output is correct, legally usable or fresh. Data quality and authorization remain separate evidence.

**Treat product names as time-sensitive**
The exam guide retains Dataplex and Dataplex Catalog terminology while current documentation can use Knowledge Catalog. Older notes may refer to Data Catalog APIs and role names. Preserve the architectural concept, but verify current migration and feature support before applying an old operational recipe.

Common trap: Governance metadata does not grant readers permission to the underlying data.

Try it: A new catalog automatically scans all tables. Does that implement federated governance?

Reasoning: It provides part of discovery, but ownership, access policy, quality rules, lineage use and consumer contracts still need a deliberate design. Domain accountability and shared standards cannot be inferred from the mere presence of a catalog entry.
- Describe ownership and consumer expectations.
- Use lineage for a concrete change-impact question.
- Check renamed or retired features against current docs.

References:
- Knowledge Catalog (guide: Dataplex): https://docs.cloud.google.com/knowledge-catalog/docs/introduction
- Data Catalog transition guidance: https://docs.cloud.google.com/knowledge-catalog/docs/transition-to-dataplex-catalog
- BigQuery sharing (Analytics Hub): https://docs.cloud.google.com/bigquery/docs/analytics-hub-introduction

### 4.1 · Make dashboards efficient and trustworthy
Optimize the expensive operation that actually appears in the query plan.

**Understand the idea**
Materialized views reuse supported computed results. BI Engine accelerates eligible analytical queries in memory. Partition filters and selective columns reduce scanning. Row and column access controls still apply to the data exposed to users.

**Make the decision**
Use execution details to locate expensive joins, skew or unnecessary scans. Check dashboard freshness and caching separately from warehouse ingestion freshness.

**Work through a scenario**
Hundreds of users repeatedly sum sales by day. A supported materialized aggregate avoids repeating the same large computation; BI Engine may further accelerate eligible dashboard queries.

**Inspect where the expensive work occurs**
A query can spend time reading unnecessary columns, shuffling a large join, processing a skewed key or sorting a large intermediate result. Start from the execution evidence and compare the same workload. More capacity may help resource pressure but does not make an avoidable row explosion a good query design.

**Choose the right reusable representation**
A logical view stores a query definition. A materialized view stores supported computed results and has specific refresh and query-shape rules. BI Engine accelerates eligible analytical work in memory. These mechanisms can complement one another, but none removes the need to understand filtering, freshness and authorization.

**Test end-to-end dashboard freshness**
Distinguish the time an event occurred, when it was loaded, when an aggregate was refreshed and when the dashboard cache was last updated. A freshly refreshed dashboard can still show stale upstream data. Define which timestamp the business freshness target refers to and monitor that interval.

Common trap: A logical view is a stored query definition, not automatically a stored result cache.

Try it: The dashboard refreshes every minute but shows hour-old values. Is adding slots the first justified action?

Reasoning: No. Trace source arrival, ingestion completion, aggregate refresh and visualization caching. Use query execution evidence to decide whether compute is actually the bottleneck. Refresh frequency is not proof of end-to-end freshness.
- Locate the expensive query stage.
- Explain logical versus materialized views.
- Trace freshness across the entire path.

References:
- Materialized views and refresh behavior: https://docs.cloud.google.com/bigquery/docs/materialized-views-intro
- BI Engine acceleration: https://docs.cloud.google.com/bigquery/docs/bi-engine-intro
- Improving BigQuery query plans: https://docs.cloud.google.com/bigquery/docs/best-practices-performance-compute
- Sharing through authorized views: https://docs.cloud.google.com/bigquery/docs/authorized-views
- INFORMATION_SCHEMA.JOBS: https://docs.cloud.google.com/bigquery/docs/information-schema-jobs

### 4.1 · Choose reusable results without losing freshness
A fast dashboard should still answer the intended time-sensitive question.

**Compare the stored object**
A logical view stores a SQL definition. A materialized view stores supported computed results with refresh behavior and eligibility rules. A report cache stores a presentation-side response. They exist at different layers, so changing one does not automatically repair stale data in the others.

**Check the supported query pattern**
Incremental and non-incremental materialized-view options have different supported shapes and maintenance or freshness behavior. Inspect the current documentation rather than assuming every arbitrary SQL expression can be incrementally reused. Choose the simplest supported aggregate for a repeatable dashboard need.

**Measure end-to-end freshness and latency**
Record source event time, load time, aggregate refresh and dashboard read behavior. Compare the actual analytical query with and without the acceleration strategy while keeping authorization and business logic fixed. A lower query time and a fresh result must be demonstrated separately.

Common trap: Precomputation is not permission to ignore the business freshness target.

Try it: A logical view is fast on the second run. Does that prove it is a materialized view?

Reasoning: No. A logical view remains a stored query definition; other caching can influence repeated execution. Inspect the actual object type and execution evidence before attributing a performance change.
- Distinguish the three caching layers.
- Check materialization eligibility.
- Measure freshness separately from query latency.

References:
- Materialized views and refresh behavior: https://docs.cloud.google.com/bigquery/docs/materialized-views-intro
- Sharing through authorized views: https://docs.cloud.google.com/bigquery/docs/authorized-views
- BI Engine acceleration: https://docs.cloud.google.com/bigquery/docs/bi-engine-intro
- INFORMATION_SCHEMA.JOBS: https://docs.cloud.google.com/bigquery/docs/information-schema-jobs

### 4.2 · Keep training and serving transformations consistent
The same raw value must mean the same thing in both environments.

**Understand the idea**
Fit preprocessing using training data and apply it consistently during evaluation and serving. A BigQuery ML TRANSFORM clause can bind supported feature transformations to model use. Data leakage occurs when unavailable future information enters training.

**Make the decision**
Split evaluation data deliberately, check nulls and outliers, and use appropriate metrics. Overfitting means fitting training peculiarities rather than generalizing; more representative data or regularization can help.

**Work through a scenario**
Demand prediction uses scaled prices. Reuse the fitted scaling parameters for serving rather than independently recomputing them on a single prediction request.

**Fit transformations on training information**
Scaling and encoding are part of the learned input contract. Fitting statistics using future evaluation data can leak information. Preserve fitted parameters and apply the same transformation at serving. A TRANSFORM clause can keep supported BigQuery ML transformations with model use, but external serving still needs a compatible implementation.

**Choose metrics for the business error**
Accuracy can hide failure on a rare class. Precision describes how many predicted positives are true; recall describes how many actual positives were found. Regression metrics express different penalties for numerical errors. Compare models on an appropriate held-out evaluation design and choose thresholds for the actual cost of errors.

**Choose evaluation data that resembles deployment**
A random split is not automatically appropriate for a chronological forecast or repeated observations from the same entity. Check whether near-duplicate entities or future values cross the evaluation boundary. A more realistic holdout may lower the apparent score while providing a more useful estimate of production behavior.
```
-- Keep valid missing-data semantics; zero is not always appropriate.
SELECT
  price / NULLIF(square_feet, 0) AS price_per_sqft,
  IFNULL(feature1, 0) AS feature1_cleaned
FROM `project.training.real_estate`;
```

Common trap: A high training score alone is not evidence of useful performance on unseen data.

Try it: A fraud detector labels every transaction legitimate and reports 99.9% accuracy. What should you investigate?

Reasoning: Inspect class balance, the confusion matrix, fraud recall and the operational cost of missed fraud and false alarms. Compare against a meaningful baseline and evaluate on data that reflects deployment. A large aggregate accuracy value alone does not establish a useful detector.
- Keep fitted preprocessing consistent.
- Explain precision versus recall.
- Identify one form of temporal or entity leakage.

References:
- BigQuery ML feature transformations: https://docs.cloud.google.com/bigquery/docs/bigqueryml-transform
- AI capabilities in BigQuery: https://docs.cloud.google.com/bigquery/docs/ai-introduction
- Evaluating BigQuery ML models: https://docs.cloud.google.com/bigquery/docs/evaluate-overview

### 4.2 · Evaluate models against the real failure cost
A metric should correspond to a business error, not just look impressive.

**Build an interpretable baseline**
For classification, examine the population and confusion matrix. A majority-class predictor can have high accuracy while finding none of the rare positive events. For numerical prediction, compare against a reasonable baseline and select an error measure that reflects the penalty of large misses.

**Choose the split from deployment conditions**
Keep future information out of training when evaluating a forecast. Consider repeated entities and near-duplicate records when selecting a holdout. Fit preprocessing on the training information and reuse it for evaluation and serving. A random split is a method, not an unconditional guarantee of realistic generalization.

**Connect a threshold to operational consequences**
Precision and recall change with the classification threshold. More recall can create more cases for human review; fewer false alerts can miss more positives. Evaluate the workload and business cost of the selected threshold, and keep training-serving consistency under observation.

Common trap: A validation score does not guarantee the same error distribution in production.

Try it: A detector identifies 8 of 10 fraud cases, with 12 alerts total. What are recall and precision?

Reasoning: Recall is 8/10 = 80%; precision is 8/12, about 66.7%. The useful threshold depends on the cost of missed fraud and investigating false alerts.
- Calculate precision and recall.
- Choose a deployment-relevant holdout.
- Explain one way preprocessing can leak information.

References:
- Evaluating BigQuery ML models: https://docs.cloud.google.com/bigquery/docs/evaluate-overview
- BigQuery ML feature transformations: https://docs.cloud.google.com/bigquery/docs/bigqueryml-transform

### 4.2 · Prepare documents for retrieval and generation
A retrieval system needs relevant, permitted context before it generates an answer.

**Understand the idea**
An embedding is a numerical representation used to compare meaning. A RAG workflow chunks source material, retains metadata, creates embeddings, retrieves relevant chunks and gives that context to a generation model.

**Make the decision**
Choose chunk boundaries and an embedding model consistently. Retain provenance and enforce access restrictions on retrieval, then evaluate both the retrieved context and the final answer.

**Work through a scenario**
An internal policy assistant retrieves passages with document IDs and effective dates. The answer cites those passages, and restricted documents never reach unauthorized users.

**Keep a reproducible document representation**
Store a chunk identifier, source document, version or date, access metadata and the embedding model used. A change of embedding model may require regenerating or separating stored vectors. Chunk boundaries affect whether retrieval captures enough context without mixing unrelated material.

**Filter the retrieved evidence before generation**
The model should not receive a restricted passage simply because its vector is close to the question. Enforce authorized retrieval and retain provenance. Treat source text as untrusted content rather than instructions for the application. Evaluate relevance, groundedness and the usefulness of the final answer separately.

**Understand the indexing tradeoff**
A vector index can speed approximate retrieval for a workload at some storage and maintenance cost. Approximate neighbors are not automatically the same as an exact search over every vector. Measure the retrieval quality and latency that your application needs, and check index availability or coverage before attributing performance changes to it.

Common trap: A vector index improves retrieval performance; it does not guarantee factual or authorized answers.

Try it: A RAG answer cites a real document but gives a wrong conclusion. Which layers might need evaluation?

Reasoning: Check whether the retrieved chunks were relevant, complete, current and authorized, then inspect how the generation used them. A valid document citation does not prove that the conclusion follows from the evidence. Review both retrieval quality and answer quality.
- Retain document version and access metadata.
- Separate retrieval relevance from answer correctness.
- Explain approximate versus exact retrieval.

References:
- Embeddings, semantic retrieval and RAG: https://docs.cloud.google.com/bigquery/docs/vector-search-intro
- AI capabilities in BigQuery: https://docs.cloud.google.com/bigquery/docs/ai-introduction
- Managing vector indexes: https://docs.cloud.google.com/bigquery/docs/vector-index

### 4.2 · Evaluate retrieval and generated answers separately
Relevant context, access control and faithful generation are separate requirements.

**Test the retrieval stage on its own**
Create representative questions with expected useful passages. Check whether relevant material appears, whether it is current and whether access filters exclude restricted documents. If the right evidence is missing, changing the generation prompt alone may not repair the underlying retrieval problem.

**Test the answer against the retrieved evidence**
Assess whether the conclusion follows from the supplied passages, whether citations resolve to the right document version, and how missing evidence is handled. Distinguish a model-generated statement from a fact validated by your data pipeline. Treat arbitrary document instructions as untrusted content.

**Monitor the document lifecycle**
When a document changes, is deleted or has its access revoked, update the retrieval representation and its metadata under the appropriate contract. An old embedding can still lead to stale or forbidden context if the surrounding access and refresh design is incomplete.

Common trap: An embedding is a representation for comparison, not a copy of truth or an authorization decision.

Try it: A previously public policy becomes restricted but its old chunk remains retrievable. Which contract failed?

Reasoning: The access and document-refresh contract of retrieval failed. Update or exclude the affected representation and enforce authorization before context reaches generation. A downstream promise to redact the final answer is weaker than preventing unauthorized retrieval.
- Evaluate passage relevance before generation.
- Check citation version and groundedness.
- Propagate document deletion and access changes.

References:
- Embeddings, semantic retrieval and RAG: https://docs.cloud.google.com/bigquery/docs/vector-search-intro
- Managing vector indexes: https://docs.cloud.google.com/bigquery/docs/vector-index
- AI capabilities in BigQuery: https://docs.cloud.google.com/bigquery/docs/ai-introduction
- Text generation with BigQuery AI: https://docs.cloud.google.com/bigquery/docs/generate-text

### 4.3 · Publish data products with an access contract
Share the usable subset and keep ownership explicit.

**Understand the idea**
An authorized view can expose a selected query result without granting direct access to source tables. BigQuery sharing, also known as Analytics Hub, distributes governed listings that consumers can subscribe to.

**Make the decision**
Choose a view for a restricted shape of data and a listing for reusable discovery and subscription. Document freshness, location, cost responsibility and who can grant access.

**Work through a scenario**
A partner needs only aggregated regional sales. Expose the permitted aggregation and publish its contract; do not grant broad access to raw customer rows.

**Publish a data-access contract**
An exchange or listing gives consumers a discoverable access path; it does not explain the business meaning by itself. Record ownership, permitted audience, location, freshness, quality and cost responsibility. A consumer needs to know whether they are seeing raw observations, corrected totals or a periodically refreshed snapshot.

**Expose only the required shape**
Use an authorized view when a selected query result fits the sharing requirement. Use row or column controls when the underlying read policy needs to vary by identity or data field. Check the effective consumer grants and the authorization relationship instead of assuming a report link grants the intended data access.

**Plan change and revocation behavior**
A producer can change schemas, retire a product or revoke access. Document which changes are compatible and how consumers learn about them. Avoid teaching third-party sharing as a one-time export when the requirement is governed, reusable access to current data.

Common trap: Sharing a report URL does not automatically authorize the viewer to its underlying data.

Try it: A partner subscribes to a listing but misinterprets a revenue field as net revenue. What was missing from the product?

Reasoning: The business definition and reporting contract were insufficient. Access and discovery succeeded, but the consumer also needs clear grain, metric meaning, refresh expectations and ownership. Data sharing is both a security and a semantic design problem.
- Choose a sharing mechanism for a specific audience.
- State the metric grain and freshness contract.
- Explain revocation and compatible schema changes.

References:
- Sharing through authorized views: https://docs.cloud.google.com/bigquery/docs/authorized-views
- BigQuery sharing (Analytics Hub): https://docs.cloud.google.com/bigquery/docs/analytics-hub-introduction
- BigQuery row access policies: https://docs.cloud.google.com/bigquery/docs/row-level-security-intro
- Knowledge Catalog (guide: Dataplex): https://docs.cloud.google.com/knowledge-catalog/docs/introduction

### 5.1 · Pay for the work you actually need
Tie optimization to a business requirement and a measured bottleneck.

**Understand the idea**
Persistent clusters may fit steady workloads; job-based compute may fit intermittent processing. Query scan reduction matters for on-demand analysis, while capacity-based execution requires attention to slots and utilization.

**Make the decision**
Reuse supported aggregates, stop idle compute, and compare storage, processing and network effects. A cheaper worker can cost more overall if it repeatedly fails or extends the job.

**Work through a scenario**
A weekly Spark job runs for thirty minutes. Keep durable input in object storage and compare an ephemeral cluster or serverless execution against a cluster left running all week.

**Measure total work and idle time**
Compare steady workloads with intermittent jobs. Keep input data durable while evaluating temporary compute. Account for storage, networking, processing, failed attempts and operating effort; a cheaper instance is not necessarily cheaper per successful business run. Use a representative completion target for every comparison.

**Distinguish price models from optimization**
On-demand analytical charges emphasize data processed; capacity models emphasize provisioned or consumed compute behavior. Reducing scanned bytes is still useful work reduction, but it does not guarantee an identical percentage reduction in a capacity bill. Review the actual model before interpreting a tuning result.

**Use feedback to protect the business objective**
Measure run duration, freshness, failures and resource utilization before and after a change. A cost optimization that violates the required completion time is not a complete solution. Keep the comparison’s input volume and business logic fixed, and identify any changed reliability or operational assumptions.

Common trap: Reducing machine size is not an optimization if it violates the completion deadline.

Try it: A team reduces scan volume by 90% and promises a 90% reduction in its capacity-based bill. Is that conclusion supported?

Reasoning: Not by scan volume alone. It shows less logical read work under the measured query, but the bill depends on the capacity configuration, utilization and other charges. Compare actual usage under the billing model while checking that the output and deadline remain correct.
- Compare cost per successful business result.
- Distinguish on-demand and capacity considerations.
- Keep the workload fixed during a tuning comparison.

References:
- Dataproc / managed Spark clusters: https://docs.cloud.google.com/dataproc/docs/concepts/overview
- Improving BigQuery query plans: https://docs.cloud.google.com/bigquery/docs/best-practices-performance-compute
- Cloud Storage classes and retrieval tradeoffs: https://docs.cloud.google.com/storage/docs/storage-classes
- BigQuery slots: https://docs.cloud.google.com/bigquery/docs/slots
- Estimate and control query costs: https://docs.cloud.google.com/bigquery/docs/best-practices-costs
- INFORMATION_SCHEMA.JOBS: https://docs.cloud.google.com/bigquery/docs/information-schema-jobs

### 5.2 · Make every retry intentional
A directed acyclic graph makes task dependencies visible.

**Understand the idea**
Composer uses Airflow DAGs for scheduled workflows with task dependencies. Workflows coordinates service calls without managing an Airflow environment. An idempotent task supports safer retries and partial reruns.

**Make the decision**
Use separate tasks when separate failure recovery matters. Pass a stable run identifier, make writes repeatable, and define completion and failure alerts.

**Work through a scenario**
A daily process fetches files, decrypts them and runs SQL. Separate DAG tasks allow rerunning only the failed stage while preserving evidence of successful earlier stages.

**Make run identity explicit**
A task should know the logical input interval or batch it is processing. A retry, delayed execution or historical backfill should not silently switch to whatever the wall clock calls today. Use that logical interval to choose inputs and output keys, and record the code or configuration version used.

**Choose boundaries that support recovery**
Separate fetch, decryption, staging, transformation and validation when they need independent retries. Make each task’s effects repeatable or transactional where possible. A task should succeed only after its expected output is usable; catching every error and reporting success defeats downstream dependency logic.

**A quality check must gate the consumer**
An assertion existing in a repository does not automatically mean every downstream action waits for it. Declare and test the appropriate assertion dependencies. Run a known failing input and verify that the curated consumer is blocked, rather than checking only that the assertion produced a red status somewhere.
```
# Illustrative DAG dependencies, not a full deployable DAG.
fetch_files >> decrypt_files >> load_staging >> transform_sql >> validate
```

Common trap: Putting the entire process inside one operator hides the recovery boundaries.

Try it: A backfill for last month queries CURRENT_DATE and appends into today’s target. What should change?

Reasoning: Parameterize the logical interval and define a repeatable write strategy for that interval. Use stable keys or replacement boundaries and gate publication on quality checks. Test the same interval twice and confirm that the resulting business total does not double.
- Use logical intervals for retries and backfills.
- Make task effects repeatable.
- Prove that failed quality checks block publication.

References:
- Cloud Composer / managed Airflow concepts: https://docs.cloud.google.com/composer/docs/composer-2/composer-overview
- Serverless service orchestration: https://docs.cloud.google.com/workflows/docs/overview
- Dataform dependencies: https://docs.cloud.google.com/dataform/docs/dependencies
- GoogleSQL DML and MERGE semantics: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax
- Dataform data quality assertions: https://docs.cloud.google.com/dataform/docs/test-data

### 5.3 · Keep competing workloads from interfering
Priority and capacity allocation are different controls.

**Understand the idea**
BigQuery reservations assign compute capacity to workloads. Baseline capacity and autoscaling affect resource availability and spend. Separate reservations can isolate dashboard work from heavy transformation jobs.

**Make the decision**
Measure usage before sizing capacity. Choose interactive or batch execution according to latency tolerance, and use reservation assignments for the intended projects or workloads.

**Work through a scenario**
Dashboards slow down during ETL. Assign them a deliberate capacity pool and place cost-sensitive ETL in another allocation rather than assuming an interactive label reserves resources.

**Separate resource isolation from job priority**
Interactive and batch priority describe execution behavior; reservation assignments allocate workload capacity. A latency-sensitive team can still compete for a shared pool if it has no deliberate resource boundary. Use measurements to choose assignments and capacity rather than assuming a priority label guarantees a dedicated allocation.

**Reason about baseline and elasticity**
Baseline capacity supplies a configured starting allocation. Autoscaling can add capacity according to the supported configuration and workload. The maximum is a capacity setting, not a complete fixed-spend guarantee across storage and other services. Inspect edition, assignment, idle sharing and usage behavior under the chosen configuration.

**Read billing controls literally**
A budget alert reports spend or triggers notification handling; it is not inherently a hard cap. Query-specific controls and resource quotas solve narrower problems. Protect business-critical execution while designing cost controls, and avoid shutting down essential processing as an unexamined side effect of a generic spending rule.

Common trap: A budget alert reports spend; it is not a guaranteed automatic spending cap.

Try it: Dashboards have an interactive priority label but still slow down during ETL. What design dimension has probably not been isolated?

Reasoning: Inspect the capacity pool and reservation assignments. Job priority alone does not establish separate compute for dashboards. Use actual slot usage and contention evidence to decide whether isolation or a query-level optimization is required.
- Distinguish capacity assignments from priority.
- Explain baseline and autoscaling without a fixed-bill promise.
- State what a budget alert does.

References:
- Compute reservations and workload isolation: https://docs.cloud.google.com/bigquery/docs/reservations-workload-management
- BigQuery slots: https://docs.cloud.google.com/bigquery/docs/slots
- Cloud budgets and alert behavior: https://docs.cloud.google.com/billing/docs/how-to/budgets
- Estimate and control query costs: https://docs.cloud.google.com/bigquery/docs/best-practices-costs

### 5.4 · Diagnose the failure before scaling
The exact error and execution stage matter more than a generic label.

**Understand the idea**
Observe freshness, lag, failed rows, task retries and resource utilization. BigQuery execution details and job metadata help distinguish slow scans, slot pressure, shuffle problems and memory-heavy operations.

**Make the decision**
Inspect the query plan and the full error message before changing capacity. Separate API request quotas from execution memory and compute availability.

**Work through a scenario**
A query fails during a large sort. Check the execution graph and memory pressure; reduce the sorted intermediate data or restructure the query rather than raising an unrelated API quota.

**Observe the business and the engine**
Track data freshness, completeness and rejected-record backlog alongside CPU, memory and job status. A pipeline can be technically running while the expected data never reaches its consumer. Define an actionable threshold, an owner and a runbook for the failure condition you intend to detect.

**Use the right evidence for the question**
Audit logs answer who performed relevant operations. Job metadata and execution details help explain query work and failure. Resource metrics describe saturation or backlog. Correlate these signals with a run identifier and logical interval instead of treating an isolated chart as proof of a root cause.

**Prefer a causal test over a generic fix**
If a stage is serial because of a hot key, adding workers may leave that stage unchanged. If a query creates a large intermediate join, increasing an unrelated API quota will not repair its grain. Form a specific hypothesis, make a controlled change and compare outputs and resource behavior under the same input.

Common trap: More slots do not guarantee that every Resources exceeded error disappears.

Try it: Worker CPU is moderate but event lag keeps rising and one key dominates a stage. What would you investigate?

Reasoning: Inspect key distribution, per-stage parallelism and any serial work or downstream limit. More workers may not split work for a single key. Verify the hypothesis with stage-level evidence and a correctness-preserving redesign rather than scaling blindly.
- Include freshness and data quality in monitoring.
- Choose logs versus job metadata for a concrete question.
- Test a specific bottleneck hypothesis.

References:
- Diagnosing BigQuery query failures: https://docs.cloud.google.com/bigquery/docs/troubleshoot-queries
- Improving BigQuery query plans: https://docs.cloud.google.com/bigquery/docs/best-practices-performance-compute
- Troubleshooting Dataflow autoscaling: https://docs.cloud.google.com/dataflow/docs/guides/troubleshoot-autoscaling
- INFORMATION_SCHEMA.JOBS: https://docs.cloud.google.com/bigquery/docs/information-schema-jobs

### 5.4 · Diagnose a query from its execution evidence
A failure message is the beginning of a causal investigation.

**Separate queueing from expensive computation**
A query may wait for resources, scan excessive data, create a large join intermediate, sort too many rows or spend time handling skew. Job metadata and the execution graph help identify which stage matters. Compare the same input and query semantics when testing an improvement.

**Inspect the reason behind the error**
Resources exceeded can indicate different memory, shuffle or planning problems. API request rate quotas are a different constraint from execution memory. A capacity reservation can be appropriate for some workload issues, but is not a universal repair for every failing operator or excessively complex query plan.

**Use billing evidence correctly**
A dry run can estimate relevant processed bytes for supported queries. Actual clustered block pruning and runtime compute behavior have additional considerations. Query limits, job controls and budgets solve different problems. Record the billing model and the measured unit before translating a performance result into a cost claim.

Common trap: The first visible red chart is not necessarily the root cause.

Try it: A query fails in a large global sort. What evidence would distinguish a SQL redesign from buying more capacity?

Reasoning: Inspect the error details and execution stage, including intermediate size and memory pressure. Test reducing the sort input or using an appropriate query structure under the same business result. Capacity information helps, but the failing operation still needs a specific diagnosis.
- Separate queue time from computation.
- Map an error to the right resource.
- Interpret bytes and slots under the chosen billing model.

References:
- INFORMATION_SCHEMA.JOBS: https://docs.cloud.google.com/bigquery/docs/information-schema-jobs
- Diagnosing BigQuery query failures: https://docs.cloud.google.com/bigquery/docs/troubleshoot-queries
- Estimate and control query costs: https://docs.cloud.google.com/bigquery/docs/best-practices-costs

### 5.5 · Design recovery against explicit objectives
State how much data may be lost and how quickly service must return.

**Understand the idea**
RPO limits tolerable data loss; RTO limits recovery time. BigQuery time travel, snapshots and cross-region replication address different failure and retention needs. A multi-region label alone is not a complete disaster recovery plan.

**Make the decision**
Match backup frequency and replication behavior to the objectives, then rehearse a restore. Check retention, permissions and the region of the recovery copy.

**Work through a scenario**
A daily export can leave nearly a day of changes unavailable, plus scheduling or export delays. A strict target below twenty-four hours needs an appropriate safety margin or a different replication approach.

**Specify the failure you are recovering from**
Accidental deletion, corrupted data, a zonal outage and regional unavailability are different events. A high-availability replica can preserve service during some infrastructure failures while also replicating a bad write. A backup retained in the same failed region may not satisfy regional recovery requirements.

**Measure the age of recoverable state**
RPO concerns the data state you can recover, not merely when a backup task started or finished. Include snapshot intervals, completion delays, replication lag and missed jobs in the loss model. RTO also includes detection, permissions, restoration, validation and consumer redirection. A table copy existing is not a rehearsed recovery procedure.

**Choose historical retention and disaster recovery separately**
Time travel can retrieve supported historical table states within its configured window. A retained snapshot can preserve a chosen state longer. Cross-region replication addresses a different failure domain and has its own supported capabilities. Verify locations, permissions and recovery operations against the actual incident requirement.

Common trap: Thirty-day backup retention and a thirty-day RPO describe different requirements.

Try it: A snapshot captured at 10:00 completes at 10:04. A failure at 10:03 leaves only the 09:30 snapshot complete. Which state is known recoverable?

Reasoning: Under those stated assumptions, the latest completed recovery copy captures 09:30, so the potential data-loss interval at 10:03 is 33 minutes. Do not use the incomplete 10:00 copy or confuse completion delay with the age of recoverable data.
- State the incident failure domain.
- Compute data-loss age from recoverable state.
- Separate historical retention, availability and regional recovery.

References:
- Time travel and fail-safe: https://docs.cloud.google.com/bigquery/docs/time-travel
- Longer-lived table snapshots: https://docs.cloud.google.com/bigquery/docs/table-snapshots-intro
- Cross-region BigQuery replication: https://docs.cloud.google.com/bigquery/docs/data-replication
- Cloud SQL high availability: https://docs.cloud.google.com/sql/docs/mysql/high-availability
- BigQuery reliability and failure domains: https://docs.cloud.google.com/bigquery/docs/reliability-intro

### 5.5 · Prove the recovery plan with a runbook
A protected copy is useful only when the service can actually be restored.

**Write a failure-specific sequence**
State the incident scope, detection signal, person or automation making the decision, recovery source, required permissions and target. Include restoration, validation, connection or consumer redirection and the condition for declaring success. Do not count a backup filename as a tested runbook.

**Measure loss and restoration separately**
The age of the latest recoverable data state determines the potential RPO exposure under a given failure. RTO includes the time to detect and execute recovery, validate data and resume the business path. A fast copy operation does not prove a short end-to-end restoration objective.

**Rehearse with representative constraints**
A test should demonstrate the intended failure domain without corrupting production. Validate data totals, access, key availability and downstream behavior in the recovery environment. Record which assumptions were simulated, which were observed and what remains untested.

Common trap: Replication can reproduce a bad application write; availability does not replace historical recovery.

Try it: The backup restores successfully but the application account cannot read it. Has RTO been met?

Reasoning: No, if the business service has not resumed. Access and consumer validation belong in the measured recovery procedure. Review the required roles, key permissions and redirection steps before declaring restoration complete.
- Define the incident scope.
- Measure recoverable-state age.
- Include consumers and permissions in recovery evidence.

References:
- BigQuery reliability and failure domains: https://docs.cloud.google.com/bigquery/docs/reliability-intro
- Cross-region BigQuery replication: https://docs.cloud.google.com/bigquery/docs/data-replication
- Longer-lived table snapshots: https://docs.cloud.google.com/bigquery/docs/table-snapshots-intro
- Cloud SQL high availability: https://docs.cloud.google.com/sql/docs/mysql/high-availability
- Customer-managed encryption keys: https://docs.cloud.google.com/kms/docs/cmek

## Guided workshops
These exercises use small synthetic fixtures. The local models do not execute Google Cloud services.

### Deduplicate without guessing the latest record
Keep one deterministic latest observation per stable business key.
1. State that the target grain is one row per ID.
2. Order by event time, then sequence for a deterministic tie.
3. Predict the final sum before running the local fixture.
4. Check the retained versions and explain why the repeated key is not a new entity.

Fixture:
```json
{
  "type": "dedup",
  "rows": [
    {
      "id": "a",
      "time": 1,
      "sequence": 1,
      "amount": 10
    },
    {
      "id": "a",
      "time": 3,
      "sequence": 2,
      "amount": 15
    },
    {
      "id": "b",
      "time": 2,
      "sequence": 3,
      "amount": 25
    },
    {
      "id": "b",
      "time": 2,
      "sequence": 4,
      "amount": 30
    }
  ]
}
```

Prediction: What is the sum after selecting the latest observation per ID?

Answer: 45 amount units
The selected rows are a/sequence 2 with amount 15 and b/sequence 4 with amount 30. A tie on time is resolved by the stated sequence rule. The result is 45, while summing every input observation gives 80.
```
WITH events AS (
 SELECT 'a' AS id, 1 AS event_minute, 1 AS sequence, 10 AS amount
 UNION ALL SELECT 'a', 3, 2, 15
 UNION ALL SELECT 'b', 2, 3, 25
 UNION ALL SELECT 'b', 2, 4, 30
)
SELECT * FROM events
QUALIFY ROW_NUMBER() OVER (
 PARTITION BY id ORDER BY event_minute DESC, sequence DESC
) = 1
ORDER BY id;
```
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- Analytical window functions: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/window-function-calls
- GoogleSQL query syntax: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax

### Find the revenue multiplication
Explain exactly how a one-to-many join changes an order-level sum.
1. Write the meaning of an order row and an item row.
2. Enumerate the joined rows before calculating revenue.
3. Compare the joined sum with the true order-grain sum.
4. Explain why SUM(DISTINCT amount) is not a general fix if two orders have the same amount.

Fixture:
```json
{
  "type": "join",
  "orders": [
    {
      "id": "o1",
      "total": 100
    },
    {
      "id": "o2",
      "total": 80
    }
  ],
  "items": [
    {
      "order": "o1",
      "sku": "a"
    },
    {
      "order": "o1",
      "sku": "b"
    },
    {
      "order": "o2",
      "sku": "c"
    }
  ]
}
```

Prediction: What does the naive sum of order totals after this join return?

Answer: 280 amount units
The joined amounts are 100, 100 and 80, giving 280. The source orders total 180. Fix the model or pre-aggregate to the intended grain; DISTINCT on a measure can incorrectly merge equal amounts from different orders.
```
WITH orders AS (
 SELECT 'o1' AS id, 100 AS total UNION ALL SELECT 'o2', 80
), items AS (
 SELECT 'o1' AS order_id, 'a' AS sku
 UNION ALL SELECT 'o1', 'b'
 UNION ALL SELECT 'o2', 'c'
)
SELECT SUM(o.total) AS naive_total
FROM orders o JOIN items i ON o.id = i.order_id;
```
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- GoogleSQL query syntax: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/query-syntax
- Nested and repeated analytical fields: https://docs.cloud.google.com/bigquery/docs/best-practices-performance-nested

### Reject invalid rows with an explicit contract
Test completeness, uniqueness and values as different quality properties.
1. Require a non-null unique ID, a non-negative non-null amount and an email containing @.
2. Mark every row violating uniqueness, including both copies of a duplicate ID.
3. Keep the rule and original row reference with each error.
4. Check the good and invalid outputs before describing a replay path.

Fixture:
```json
{
  "type": "quality",
  "rows": [
    {
      "row": 1,
      "id": "a",
      "amount": 10,
      "email": "a@example.test"
    },
    {
      "row": 2,
      "id": "a",
      "amount": 10,
      "email": "not-an-email"
    },
    {
      "row": 3,
      "id": null,
      "amount": -5,
      "email": "c@example.test"
    },
    {
      "row": 4,
      "id": "d",
      "amount": null,
      "email": "d@example.test"
    },
    {
      "row": 5,
      "id": "e",
      "amount": 20,
      "email": "e@example.test"
    }
  ]
}
```

Prediction: How many rows violate at least one stated rule?

Answer: 4 rows
Rows 1 and 2 violate unique ID; row 2 also violates the deliberately simple email check. Row 3 lacks an ID and has a negative amount; row 4 lacks an amount. Only row 5 satisfies this toy contract. The @ check is intentionally not a full real-world email validator.
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- Dataform data quality assertions: https://docs.cloud.google.com/dataform/docs/test-data
- Dataform dependencies: https://docs.cloud.google.com/dataform/docs/dependencies

### Replay a versioned batch twice
Show why a version-aware current-state operation is repeatable.
1. Define the latest accepted version per entity as the current state.
2. Apply only changes with a strictly newer version, or insert a new entity.
3. Run the same batch again and compare row count and sum.
4. Explain how deletes would require an additional explicit rule.

Fixture:
```json
{
  "type": "merge",
  "target": [
    {
      "id": "a",
      "version": 2,
      "amount": 20
    },
    {
      "id": "b",
      "version": 1,
      "amount": 5
    }
  ],
  "changes": [
    {
      "id": "a",
      "version": 3,
      "amount": 30
    },
    {
      "id": "a",
      "version": 2,
      "amount": 20
    },
    {
      "id": "c",
      "version": 1,
      "amount": 7
    }
  ]
}
```

Prediction: What is the total amount after one run and after the identical replay? Enter the common total.

Answer: 42 amount units
The target holds a/version 3/amount 30, b/version 1/amount 5 and c/version 1/amount 7: three rows totaling 42. Replaying the same changes does not increase the total. This fixture assumes comparable source versions and does not implement deletes.
```
FOR each source entity in a defined source order:
  INSERT if no target entity exists
  UPDATE only if source.version > target.version
KEEP stable entity IDs and validate final totals
-- A real MERGE needs appropriate source cardinality and delete semantics.
```
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- GoogleSQL DML and MERGE semantics: https://docs.cloud.google.com/bigquery/docs/reference/standard-sql/dml-syntax
- Change data capture with Datastream: https://docs.cloud.google.com/datastream/docs/overview

### Recover an event-time total
Compare the same delayed events under two explicit lateness policies.
1. Open Interactive labs and process all six events with 0 minutes allowed lateness.
2. Repeat with 3 minutes allowed lateness, keeping the event sequence fixed.
3. Identify event D and the watermark before it arrives.
4. Explain why this fixture’s watermark rule is an illustrative model rather than Dataflow’s implementation.

Fixture:
```json
{
  "type": "late"
}
```

Prediction: What is the accepted total after all events with 3 minutes allowed lateness?

Answer: 140 value units
Under the documented local model, event D is accepted with the three-minute policy. All six values total 140; with zero minutes the expired early window drops D and the total is 100. The original event time, not arrival time, selects its window.
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- Beam event-time window definitions: https://beam.apache.org/releases/pydoc/current/apache_beam.transforms.window.html
- Dataflow and the Beam programming model: https://docs.cloud.google.com/dataflow/docs/concepts/beam-programming-model

### Compare logical reads under a fixed workload
Keep data and selected columns fixed while changing query-aligned layout.
1. Use the toy dataset of 30 days × 10 GB/day and ten equal-volume countries.
2. Query seven days and one country.
3. Compare unorganized, date-partitioned and ideally country-pruned layouts.
4. State why these logical bytes are not a real BigQuery billing quote.

Fixture:
```json
{
  "type": "scan",
  "days": 7,
  "country": "CL"
}
```

Prediction: Under the toy ideal-pruning assumptions, how many GB does the combined layout read?

Answer: 7 GB
The full logical read is 300 GB. Seven selected dates require 70 GB, and ideal pruning to one of ten equal countries gives 7 GB. Real storage blocks, plans, clustering effectiveness and the billing model can differ.
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- Partitioning BigQuery tables: https://docs.cloud.google.com/bigquery/docs/partitioned-tables
- Clustering BigQuery tables: https://docs.cloud.google.com/bigquery/docs/clustered-tables
- Estimate and control query costs: https://docs.cloud.google.com/bigquery/docs/best-practices-costs

### Map the failing permission boundary
Identify the actor that actually needs each operation.
1. List submitter, worker and analyst as distinct principals.
2. Assign capabilities only on their required resources.
3. Check inherited grants before claiming production is isolated.
4. State why granting Owner to the human is not the first repair for a worker read error.

Fixture:
```json
{
  "type": "identity",
  "operations": [
    {
      "actor": "submitter",
      "operation": "create the job and use the approved worker identity",
      "capabilities": [
        "job.create",
        "identity.use"
      ]
    },
    {
      "actor": "worker",
      "operation": "read the source bucket and write the destination dataset",
      "capabilities": [
        "source.read",
        "destination.write"
      ]
    },
    {
      "actor": "analyst",
      "operation": "read the approved curated result",
      "capabilities": [
        "curated.read"
      ]
    }
  ]
}
```

Prediction: Which actor directly needs source-read permission in this fixture?

Answer: worker actor name
The worker reads the source. The submitter’s ability to launch the job is a separate boundary, and the analyst consumes only the approved output. Real roles and network configuration must be checked for the exact services and resources.
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- Identity and Access Management: https://docs.cloud.google.com/iam/docs/overview
- Dataflow identities and roles: https://docs.cloud.google.com/dataflow/docs/concepts/access-control
- Dataflow networking and subnetworks: https://docs.cloud.google.com/dataflow/docs/guides/specifying-networks

### Make a failing assertion block publication
Trace task dependency effects without calling a cloud service.
1. Read the explicit dependency edges.
2. Assume load and transform succeed but assert fails.
3. Identify which consumer must not run.
4. Describe how you would test this failure path in the real workflow configuration.

Fixture:
```json
{
  "type": "dag",
  "nodes": [
    {
      "id": "load",
      "dependencies": []
    },
    {
      "id": "transform",
      "dependencies": [
        "load"
      ]
    },
    {
      "id": "assert",
      "dependencies": [
        "transform"
      ]
    },
    {
      "id": "publish",
      "dependencies": [
        "assert"
      ]
    }
  ],
  "failure": "assert"
}
```

Prediction: Which task must be blocked after the assertion failure?

Answer: publish task ID
Because publish depends on assert, it must remain blocked after the failed quality gate. If publish depended only on transform, the quality check would not establish that gate. This is a local dependency model, not a live Airflow or Dataform run.
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- Dataform dependencies: https://docs.cloud.google.com/dataform/docs/dependencies
- Cloud Composer / managed Airflow concepts: https://docs.cloud.google.com/composer/docs/composer-2/composer-overview
- Dataform data quality assertions: https://docs.cloud.google.com/dataform/docs/test-data

### Calculate the recoverable-state age
Use completed recovery evidence rather than a scheduled backup label.
1. Interpret minute 0 as 09:00 and minute 63 as 10:03.
2. Exclude snapshots not complete at the failure time.
3. Find the newest known recoverable capture time.
4. Compare data-loss age with the separate time needed to resume the application.

Fixture:
```json
{
  "type": "recovery",
  "snapshots": [
    {
      "capture": 0,
      "complete": 4
    },
    {
      "capture": 30,
      "complete": 34
    },
    {
      "capture": 60,
      "complete": 64
    }
  ],
  "failureTime": 63,
  "clockBase": "09:00"
}
```

Prediction: How old is the latest known recoverable state at failure?

Answer: 33 minutes
The 10:00 capture is not complete by 10:03 under this fixture’s assumptions. The latest completed capture represents 09:30. Its age is 33 minutes. RTO is a different measurement covering the restoration of the actual business service.
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- Longer-lived table snapshots: https://docs.cloud.google.com/bigquery/docs/table-snapshots-intro
- Cross-region BigQuery replication: https://docs.cloud.google.com/bigquery/docs/data-replication
- BigQuery reliability and failure domains: https://docs.cloud.google.com/bigquery/docs/reliability-intro

### Read a classifier’s business errors
Calculate precision and recall from interpretable counts.
1. Count positive alerts: true positives plus false positives.
2. Count actual positives: true positives plus false negatives.
3. Calculate precision and recall with different denominators.
4. Explain which operational cost would influence a threshold change.

Fixture:
```json
{
  "type": "metrics",
  "truePositives": 8,
  "falsePositives": 4,
  "falseNegatives": 2
}
```

Prediction: What is precision as a percentage, rounded to one decimal place?

Answer: 66.7 percent
Precision is 8/(8+4) = 66.7%; recall is 8/(8+2) = 80%. Overall accuracy cannot be obtained without the negative population information. A threshold decision should consider missed-positive cost and unnecessary review work.
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- Evaluating BigQuery ML models: https://docs.cloud.google.com/bigquery/docs/evaluate-overview

### Filter evidence before generation
Keep a relevant but forbidden passage out of model context.
1. Treat the supplied scores as illustrative relevance values.
2. Filter to the user’s allowed audience before selecting context.
3. Find the highest-ranked permitted passage.
4. Preserve source ID and version instead of relying on final-answer redaction.

Fixture:
```json
{
  "type": "retrieval",
  "allowedAudiences": [
    "all"
  ],
  "chunks": [
    {
      "id": "policy-public",
      "audience": "all",
      "score": 0.92
    },
    {
      "id": "finance-private",
      "audience": "finance",
      "score": 0.99
    },
    {
      "id": "faq-public",
      "audience": "all",
      "score": 0.7
    }
  ]
}
```

Prediction: Which chunk ID is the highest-ranked authorized result?

Answer: policy-public chunk ID
finance-private has the highest toy relevance score but is not authorized for this user. policy-public is the highest permitted result. Similarity is not a permission decision, and final-answer redaction does not replace authorized retrieval.
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- Embeddings, semantic retrieval and RAG: https://docs.cloud.google.com/bigquery/docs/vector-search-intro
- AI capabilities in BigQuery: https://docs.cloud.google.com/bigquery/docs/ai-introduction

### Translate the decision, not just the vocabulary
Extract simultaneous constraints from an English scenario.
1. Find what must be preserved and what must be reduced.
2. Translate while minimizing as a simultaneous requirement.
3. Separate the durable data decision from the compute lifecycle.
4. Name the evidence you would check before choosing a migration pattern.

Fixture:
```json
{
  "type": "constraints",
  "sentence": "You need to preserve the existing Spark jobs while minimizing operational overhead and keeping durable data independent of cluster lifetime.",
  "constraints": [
    "Preserve existing Spark compatibility",
    "Reduce ongoing operating work",
    "Keep durable data independent of temporary compute"
  ]
}
```

Prediction: How many simultaneous constraints are explicitly listed in the fixture?

Answer: 3 constraints
The sentence imposes compatibility, operation-effort and data-durability constraints together. Satisfying only the most familiar product clue does not fully answer it. In Spanish: conservar los trabajos Spark, reducir el esfuerzo de administración y mantener los datos fuera del ciclo de vida del clúster.
The local fixture runs only in this browser and creates no Google Cloud resources. Any optional execution of sample SQL in your own BigQuery environment follows that environment’s normal permissions, quotas and pricing.
- Dataproc / managed Spark clusters: https://docs.cloud.google.com/dataproc/docs/concepts/overview
- Google Cloud Well-Architected Framework: https://cloud.google.com/architecture/framework

## Learning resources

### Start with the standard exam blueprint
Use the numbered objectives to find gaps; this site keeps the standard weights as its default.
Access: Public PDF
Scope: The renewal guide has different emphasis. Do not mix its percentages into a first-exam study plan.
- Standard exam guide, v4.2: https://services.google.com/fh/files/misc/professional_data_engineer_exam_guide_english.pdf

### Confirm exam logistics and eligibility
Check format, language, fees, recommended experience and current registration or renewal rules.
Access: Public information; registration is separate
Scope: Fees shown here are USD before applicable taxes; confirm the official registration terms.
- Certification overview: https://cloud.google.com/learn/certification/data-engineer?hl=en

### Follow the Google Skills preparation path
Use courses, labs and skill badges as the hands-on companion to these written chapters.
Access: Account required for participation; lab access may require credits or a subscription
Scope: The public path lists 13 activities when checked. Their availability and access terms can change.
- Professional Data Engineer learning path: https://www.skills.google/paths/16

### Use the partner path when eligible
The supplied partner URL resolves to the Professional Data Engineer path on Google Skills for Partners.
Access: Partner access and sign-in
Scope: The public page lists 15 activities when checked; membership and entitlement are separate from exam eligibility.
- Professional Data Engineer partner path: https://partner.skills.google/paths/85

### Read reference architectures after learning the services
Compare end-to-end patterns against business requirements and failure modes.
Access: Public documentation
Scope: This is a collection, not the numbered exam blueprint.
- Data analytics architecture collection: https://docs.cloud.google.com/architecture/big-data-analytics

### Review cross-service tradeoffs
Review security, reliability, operation, performance and cost decisions together.
Access: Public documentation
Scope: Use the framework as design guidance; the standard exam guide determines study scope.
- Google Cloud Well-Architected Framework: https://cloud.google.com/architecture/framework

### Optional Google Cloud preparation on Coursera
The provider page identifies the Google Cloud preparation program for the Cloud Data Engineer certification.
Access: Provider enrolment; review current course and lab terms
Scope: A course-completion certificate is separate from passing the Professional Data Engineer certification exam.
- Google Cloud data engineering preparation on Coursera: https://www.coursera.org/professional-certificates/gcp-data-engineering

### Optional personal notes on GitHub
Use another learner’s organization of topics as a secondary reading aid.
Access: Public repository
Scope: The repository references an older preparation account and delivery information. Verify exam logistics and technical claims with current official sources; its notes are not incorporated as authoritative answer keys.
- Personal study notes — secondary reading: https://github.com/Nicola-Loi/gcp-data-engineer
