"""Apply explicit editorial notes without overwriting source answer provenance."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parents[1]
p=ROOT/'content/imported.json';data=json.loads(p.read_text());qs=data['questions']
RULES=[
 (r'policy tag|sensitive|\bIAM\b|permissions|privacy|encrypt|access control|service account|VPC Service Controls',1,'protect-data','iam column dlp'),
 (r'backup|RPO|RTO|recovery|failover|disaster|replicat',5,'recovery','replication snapshot'),
 (r'reservation|slots|capacity|quota|Resources exceeded|concurrent',5,'capacity','reservations errors'),
 (r'monitor|logging|logs|alert|troubleshoot',5,'observability','errors dataflow'),
 (r'Composer|Airflow|DAG|orchestrat|scheduled query',5,'repeatability','composer workflows'),
 (r'row.?key|Bigtable|NoSQL|HBase|Cassandra',3,'storage-choice','bigtable timeseries'),
 (r'Spanner|Cloud SQL|Firestore|Datastore|AlloyDB|transactional database',3,'storage-choice','spanner sqlha'),
 (r'lifecycle|storage class|archive|Nearline|Coldline|Autoclass|retention policy',3,'lifecycle','classes lifecycle protect'),
 (r'catalog|Dataplex|data mesh|governance|lineage',3,'governance','catalog transition'),
 (r'partition|cluster.*table|data model|nested|denormaliz',3,'warehouse-model','partition cluster'),
 (r'neural|TensorFlow|model|machine.learning|predict|training|feature|classif|AutoML|Datalab',4,'features','transform ai'),
 (r'embedding|RAG|generat.*AI|GENERATE_TEXT',4,'embeddings','vectors ai'),
 (r'dashboard|materialized|BI Engine|visualiz|Data Studio',4,'analytics','mv bi'),
 (r'Analytics Hub|sharing|publish.*dataset',4,'share','sharing views'),
 (r'migrat|transfer|on.premis|Hadoop',1,'migration','stream transfer spark'),
 (r'window|watermark|late.*data|session',2,'event-time','beam'),
 (r'Storage Write|exactly.once',2,'pipeline-contract','write offset psexact'),
 (r'Pub/Sub|Kafka|Dataflow|stream|pipeline',2,'pipeline-contract','dataflow beam'),
 (r'Dataform|assertion',2,'processing-engine','dataform dependencies'),
 (r'CSV|invalid|format|cleans',2,'bad-records','fusion beam'),
]
for q in qs:
 q.update(answer=list(q['sourceAnswer']),status='unreviewed',gradable=False,explanation='',reviewNote='Imported answer and rationale have not been independently verified. The official links below are related reading, not an official answer key.')
 q['issues']=[i for i in q['issues'] if i.startswith('The prompt requests')]
 focus=q['text'][-1700:]+' '+' '.join(c['text'] for c in q['choices'] if c['letter'] in q['sourceAnswer'])
 for pattern,d,lesson,refs in RULES:
  if re.search(pattern,focus,re.I):q.update(domain=d,lesson=lesson,references=refs.split());break
 else:q.update(domain=2,lesson='processing-engine',references=['dataflow'])
 # Add narrow relevant documentation without claiming it proves the imported key.
 for pat,ref in [(r'Pub/Sub','psexact'),(r'BigQuery','compute'),(r'Pub/Sub.*(seek|snapshot)|retain.acked','replay'),(r'Datastream','stream'),(r'policy tag','column')]:
  if re.search(pat,focus,re.I) and ref not in q['references']:q['references'].append(ref)
 q['references']=q['references'][:4]

def review(n,text,refs,status='reviewed',answer=None,extra=''):
 q=qs[n-1];assert q['number']==n
 q['status']=status;q['explanation']=text;q['references']=refs.split()
 q['reviewNote']=extra or ('Editorial reasoning is linked to primary documentation. The imported key is preserved separately.' if status in ['reviewed','corrected'] else 'This imported item is excluded from scored practice. Read the technical note instead of memorizing its key.')
 q['gradable']=status in ['reviewed','corrected']
 if answer is not None:q['answer']=answer

review(47,'Cloud SQL fits the relational transactional records in the prompt: users and orders have relationships and can be updated transactionally. BigQuery is optimized for analytics; Bigtable is a keyed wide-column store. The presence of a future ML feature does not make the transactional system a warehouse.','cloudsql spanner')
review(54,'The imported D key is not a safe rule for deciding the earliest bid. Network delays and retries can reorder processing. Preserve event timestamps, define event-time handling and a deterministic tie-breaker, and use a transactional decision where required. Pub/Sub ordering preserves a supported publication order; it does not establish a universal event-time order.','ordering beam spanner','disputed')
review(69,'The managed YouTube connector writes into a BigQuery dataset. Options C and D incorrectly describe Cloud Storage as the final destination of that transfer service. Therefore the imported C key does not describe a correct complete solution, even though it names a relevant service.','youtube','disputed')
review(103,'The question confuses a recovery point objective with a retention horizon. A multi-region location does not automatically provide thirty days of point-in-time recovery. Define the intended loss and retention requirements, and deliberately create retained snapshots or another suitable backup. The imported C answer is not justified by the wording.','time snapshot replication','disputed')
review(126,'A managed custom image-classification training workflow can use the labeled examples and reduce proof-of-concept development time. The source calls this Cloud Vision AutoML, a legacy product name. Study the capability and verify current product support before building it; the generic Vision API does not learn arbitrary new custom classes from label hints.','ai','legacy')
review(146,'Do not memorize A and D without checking the utilities. A GCS connector can expose object data to Hadoop, and a Hadoop filesystem copy or local staging can populate HDFS. The wording “gsutil directly to HDFS” in A is problematic, while C explicitly stages locally and then copies to HDFS. The imported combination requires review.','spark','disputed')
review(166,'Clustering on package-tracking ID can reduce relevant storage blocks for queries filtering by that ID, while the existing date partition can still serve date pruning. Clustering by the already partitioned date usually adds less value for this access pattern. The benefit depends on actual query filters.','cluster partition')
review(183,'A shared table with an index identifier followed by time lets a query restrict a row-key range for that index. To simplify newest-first access, consider a reversed timestamp after that high-cardinality prefix or a supported reverse-read pattern. Avoid a timestamp-only leading key that concentrates writes. A is the closest listed layout, with this query-order qualification.','bigtable timeseries')
review(189,'Interconnect plus Storage Transfer Service is the listed managed private-network approach. However, “a few hours” depends on provisioned end-to-end capacity. One decimal petabyte over 100 Gbit/s needs about 22.2 hours at ideal utilization; more capacity is needed for a shorter target. The option is a design direction, not a timing guarantee.','transfer','conditional')
review(190,'Data Fusion can standardize mixed values before loading into a typed BigQuery destination. Simply changing the file container to Avro does not repair invalid field values. Loading directly into the intended final schema may reject those rows before the proposed later SQL cleaning can run.','fusion')
review(217,'The prompt asks for two actions. Removing inappropriate Fine-Grained Reader access and enforcing access control on the policy-tag taxonomy work together. An authorized dataset does not cancel column-level rules. Review the taxonomy and all effective or inherited grants. The editorial answer is B and E; the source marked only B.','column','corrected',['B','E'])
review(228,'To replay previously acknowledged messages by timestamp, retain those messages for the necessary history and then seek to the required time. The intended pair is D and E. Enabling retention now cannot restore messages already discarded; configure retention before the period you plan to replay.','replay','corrected',['D','E'])
review(231,'Worker evictions with high worker memory use point to worker memory pressure. Reducing worker concurrency or spreading tasks over additional workers reduces per-worker load; more worker memory increases headroom. The intended pair is C and D. Increasing triggerer memory does not directly address worker pod evictions.','composer','corrected',['C','D'])
review(243,'Choice C replaces null feature1 values using IFNULL and also derives price_per_sqft. A only replaces feature1 and omits the target calculation; B and D drop null-containing rows instead of retaining them. This explanation was added after visually inspecting the four original SQL images.','transform')
for c,trans in zip(qs[242]['choices'],[
 'SELECT * EXCEPT(feature1), IFNULL(feature1, 0) AS feature1_cleaned FROM training_data;',
 'SELECT * EXCEPT(price, square_feet), price/square_feet AS price_per_sqft FROM training_data WHERE feature1 IS NOT NULL;',
 'SELECT * EXCEPT(price, square_feet, feature1), price/square_feet AS price_per_sqft, IFNULL(feature1, 0) AS feature1_cleaned FROM training_data;',
 'SELECT * FROM training_data WHERE feature1 IS NOT NULL;']):c['transcription']=trans
review(256,'The robust principle is to trigger the Airflow REST API through an authenticated path that the chosen environment can reach. The imported C answer names a PSC endpoint without specifying the target service or a complete supported webserver route. Environment generation, webserver access restrictions and function networking change the setup. Treat this key as unresolved rather than a universal recipe.','composer network','disputed')
review(269,'The original B key describes historical Data Catalog discovery and custom-entry behavior. Data Catalog has transitioned to the newer catalog platform; current documentation uses Knowledge Catalog. Revalidate discovery support and custom connectors for your sources instead of treating this older API recipe as current guidance.','transition catalog','legacy')
review(287,'A fixed baseline without autoscaling makes compute allocation more predictable than variable on-demand scanning or elastic capacity. In the listed options, C best matches a steady analytics compute budget. Storage, transfers, idle-capacity behavior and other charges still need to be considered; this is not a promise of a fixed total cloud bill.','reservations slots')
review(295,'Shared VPC access involves more than a generic Dataflow Admin grant. Current networking and IAM guidance distinguishes the worker service account, submitter and service agent, with subnet permissions in the host project. Since both A and B name identities that may need access depending on setup, this underspecified question should not be used as an unconditional single-answer IAM recipe.','network dfiam','disputed')
review(296,'Direct KafkaIO ingestion through an existing private connection avoids an unnecessary Kafka-to-Pub/Sub bridge before BigQuery. A Dataflow pipeline can apply processing and write to the warehouse while you manage source reachability, schema and sink semantics explicitly. That fits the requested low-latency route.','beam network write')
review(321,'The intended capability is federated governance across the lake and warehouse: discovery, metadata, quality and policy coordination without copying every object. The listed managed governance option is the closest fit. The guide uses Dataplex terminology; current documentation also uses Knowledge Catalog. Actual data permissions must still be configured on the underlying resources.','catalog transition')
review(323,'Groups separate team membership from per-project role assignment. Grant the development group only the required development permissions, use appropriately scoped read access in staging, and avoid production grants. Check inherited permissions too: omitting a local grant does not remove a broader inherited one.','iam sa')
review(324,'Separate Airflow tasks expose each dependency and create independent retry and rerun boundaries. A single Python or shell operator hides those stages. Scheduling the DAG is only part of the solution: configure completion-deadline monitoring and notification separately to enforce the 7:00 AM requirement.','composer')
review(325,'Separate compute allocations prevent cost-sensitive ETL from competing indiscriminately with low-latency dashboards. Reservations and assignments let you size or autoscale the dashboard workload and isolate ETL according to its own requirements. Interactive versus batch labels alone do not reserve dedicated compute.','reservations slots')
review(326,'Resources exceeded is not a unique diagnosis. A memory-heavy sort, overly complex plan or shuffle bottleneck may require a query rewrite rather than more slots. Inspect the full error and execution graph first. A reservation can help some capacity problems but is not guaranteed to fix this underspecified failure.','errors compute','disputed')
review(333,'ParDo can validate each input and route valid and invalid records through separate outputs. Inference can add a label before the warehouse write. Using RunInference for a generative endpoint requires a compatible handler or adapter; include concurrency limits, structured-output checks and an error path. D captures the intended processing pattern with that implementation qualification.','beam ai')
review(341,'The supported MySQL connector in BigQuery Data Transfer Service provides scheduled imports and documented full or incremental write preferences. Verify supported source versions, private connectivity and incremental configuration. Database Migration Service targets database migration, not this recurring warehouse import; Pub/Sub alone is not a MySQL extractor.','mysql')
# Additional items with material ambiguity, outdated terminology or unsupported guarantees.
review(15,'Waiting twice an observed average does not bound worst-case freshness or prove strong consistency. Design around documented write visibility, delivery contracts and explicit completeness checks rather than treating an average delay as a guarantee. The original key is preserved for comparison only.','write offset','disputed')
review(31,'The current guidance distinguishes a compatible in-place update from an incompatible replacement. Drain the old job and plan the replacement and source retention; the wording “update ... use the drain flag” does not describe a complete safe incompatible upgrade. None of these short options establishes all required guarantees.','upgrade replay','disputed')
review(162,'Customer-supplied server-side encryption keys do not imply that the provider can never decrypt data during processing. If the requirement is truly that the provider never receives plaintext or keys, evaluate a client-side encryption design and its query limitations. The imported “Trust No One” claim is stronger than the stated mechanism.','cmek','disputed')
for n in [211,318]:review(n,'A daily export can approach a full day of lost changes before accounting for export duration, delays or missed runs. Therefore it does not by itself guarantee a strict RPO below twenty-four hours. Choose a schedule with margin or an appropriate replication and recovery design, and test it.','replication snapshot','disputed')
review(322,'A managed transfer service requires a supported source and format. The prompt does not identify the proprietary system, so the imported C key cannot be generally established. Exporting to a supported interchange format and performing a validated load is an explicit batch migration path; a supported vendor connector may be preferable when available.','transfer mysql','disputed')
review(328,'Both an external-table INSERT SELECT and a supported Cloud Storage transfer or load path can populate a native table. A managed scheduled load is a natural fit for recurring compressed JSON batches, subject to supported JSON format and compression. The prompt does not justify treating the imported A key as uniquely optimal.','write transfer','disputed')
review(338,'Removing an employee’s read permissions and cryptographically deleting that employee’s data are different requirements. AEAD key deletion only makes the intended values unreadable when key granularity, copies and key lifecycle are designed accordingly. The prompt does not specify that key ownership model, so D is conditional rather than a general offboarding rule.','cmek column','disputed')
for n,refs,note in [
 (4,'bi','The original uses Data Studio 360 and historical caching settings. Check current dashboard freshness controls before applying this option.'),
 (13,'spanner sqlha','The listed services omit some modern alternatives. Decide from transactional boundaries, consistency, scale and access pattern; the historical Datastore name alone is not a payment-system design.'),
 (22,'ai','The source names Cloud Datalab, an older notebook product. Preserve the question for historical context, and use currently supported managed notebook guidance for implementation.'),
 (45,'workflows composer','This question names App Engine Cron. Compare current scheduling and orchestration choices against the workload rather than memorizing a historical cheapest-service claim.'),
 (56,'partition','The prompt explicitly asks for legacy SQL. TABLE_DATE_RANGE is historical syntax; learn GoogleSQL wildcard filtering and partitioned tables for new implementations.'),
 (65,'transform','The item names an older preparation product. Null-to-zero imputation also changes data meaning and must be validated for the model.'),
 (145,'fusion','The item uses historical Dataprep naming. Recheck current supported visual preparation products and deployment options.'),
 (222,'fusion','The item uses historical Dataprep naming. Treat it as a visual cleansing use case, not a current product availability guarantee.'),
 (259,'fusion','This item combines a historical preparation product with spreadsheet analysis. Recheck current supported preparation and spreadsheet connectors.')]:
 review(n,note,refs,'legacy')
# Image audit: dimensions were checked locally; 10 files are tiny placeholders.
# Preserve all files and expose the defect rather than silently inventing their content.
from PIL import Image
assetmap={}
for f in (ROOT/'dist/assets/images').iterdir():
 im=Image.open(f);assetmap[f.name]={'width':im.width,'height':im.height,'placeholder':im.width<32 or im.height<10}
for q in qs:
 files=re.findall(r'assets/images/([^"\s]+)',q['html']+' '.join(c['html'] for c in q['choices']))
 bad=[f for f in files if assetmap.get(f,{}).get('placeholder')]
 q['missingDiagram']=bool(bad)
 if bad:
  q['issues'].append('The uploaded archive contains an unreadable 9 × 6 pixel placeholder instead of at least one original diagram.')
  q['gradable']=False
  if q['status']=='unreviewed':q['status']='incomplete'
 q['evidence']='Editorial review' if q['status'] in ['reviewed','corrected'] else 'Source key only'
 if not q['sourceExplanation'] and not q['explanation']:raise ValueError('Missing explanation '+str(q['number']))
data['assetAudit']=assetmap
data['reviewedOn']='2026-11-02'
data['audit']={'statusCounts':{s:sum(q['status']==s for q in qs) for s in sorted(set(q['status'] for q in qs))},
 'placeholderImages':sum(a['placeholder'] for a in assetmap.values()),'questionsWithMissingDiagrams':[q['number'] for q in qs if q['missingDiagram']],
 'correctedKeys':[q['number'] for q in qs if q['status']=='corrected'], 'scoredMockPool':'Only the 50 original learning questions; imported items are excluded.'}
p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(data['audit']))
