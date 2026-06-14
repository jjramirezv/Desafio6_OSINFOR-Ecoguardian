# Arquitectura — Conector interoperable

Este documento describe la arquitectura del **conector interoperable** del SaaS
de trazabilidad forestal **Huella Legal Forestal**. Es la base que permite
ingresar datos de fuentes forestales, registrarlos como evidencia, persistirlos
en tablas operativas y proyectarlos al grafo de trazabilidad.

> El conector es, en este sprint, una **base interoperable para prototipo**: el
> flujo es una demo controlada. No implementa carga real de archivos ni
> integración real con sistemas externos.

## Qué es el conector interoperable

El conector es el subsistema responsable de **interoperar** entre las fuentes de
datos forestales (libro de operaciones de tala, trozado y despacho, balance de
extracción, GTF) y el modelo interno de evidencia y trazabilidad.

Su propósito es que datos heterogéneos de distintas fuentes lleguen de forma
controlada y trazable a un mismo modelo: cada dato ingresa por un **lote**, se
**normaliza**, se guarda como **registro fuente** (evidencia), se vuelca a una
**tabla operativa** y finalmente se **proyecta al grafo**.

## Cómo funciona `import_batches`

`import_batches` representa un **lote de importación**: la unidad de ingreso de
datos al conector. Cada lote tiene:

- Identificación: `batch_code`, `name`, `import_type`.
- Asociaciones opcionales: `organization_id`, `source_system_id`.
- Estado: `PENDING`, `COMPLETED`, `COMPLETED_WITH_ERRORS`.
- Contadores: `total_rows`, `processed_rows`, `successful_rows`, `failed_rows`.
- `metadata` (jsonb) para información adicional del lote.

El lote nace en estado `PENDING` con contadores en cero. A medida que se
normaliza, sus contadores y estado se actualizan. El `import_type` define cómo se
normaliza cada fila y a qué tabla operativa se persiste.

## Cómo funcionan `source_records`

`source_records` es la tabla de **evidencia** (proviene del modelo del Sprint 1):
cada fila es un registro fuente individual ya normalizado. El conector usa:

- `source_system_id` — sistema fuente efectivo (derivado del lote o del tipo).
- `external_id` — identificador del registro dentro del lote
  (`BATCH-{lote}-ROW-{fila}`).
- `record_type` — igual al `import_type` del lote.
- `raw_payload` — la fila cruda original (jsonb).
- `normalized_payload` — la fila normalizada (jsonb).
- `status` — `NORMALIZED`, `PERSISTED` o `SKIPPED`.
- `metadata` — incluye `import_batch_id` y `row_number`.

La relación lote → registro fuente se resuelve por
`metadata->>'import_batch_id'`, lo que mantiene la evidencia desacoplada y
consultable sin una FK rígida.

## Cómo se registran `import_errors`

Cuando una fila no supera la normalización, el conector no crea un
`source_record`; en su lugar registra uno o más `import_errors` para esa fila:

- `import_batch_id` — lote al que pertenece.
- `row_number` — fila dentro del lote.
- `field_name` — campo afectado (si aplica).
- `error_code` — código del error (p. ej. `REQUIRED_FIELD_MISSING`).
- `error_message` — descripción legible.
- `severity` — severidad (`ERROR`).
- `metadata` — detalle estructurado del error.

Así, un mismo lote puede terminar `COMPLETED_WITH_ERRORS`: parte de sus filas
queda como evidencia y parte como errores auditables.

## Qué hace `SourceNormalizerService`

`SourceNormalizerService` normaliza una fila cruda según el `import_type` del
lote. Por cada fila devuelve:

- `normalized` — el payload normalizado (campos esperados y tipados).
- `errors` — la lista de errores por campo (vacía si la fila es válida).

Es la pieza que traduce la heterogeneidad de las fuentes a una forma interna
consistente, sin depender todavía del formato físico del archivo de origen.

## Qué hace `OperationalPersistenceService`

`OperationalPersistenceService` toma los `source_records` **normalizados** de un
lote y los vuelca a la **tabla operativa** que corresponde a su `record_type`:

| `record_type`                | Tabla operativa       |
| ---------------------------- | --------------------- |
| `LIBRO_OPERACIONES_TALA`     | `operation_tala`      |
| `LIBRO_OPERACIONES_TROZADO`  | `operation_trozado`   |
| `LIBRO_OPERACIONES_DESPACHO` | `operation_despacho`  |
| `BALANCE_EXTRACCION`         | `extraction_balances` |
| `GTF`                        | `gtfs`                |

`CENSO_FORESTAL` no se persiste aquí (pertenece al censo base) y se marca como
`SKIPPED`. El servicio es **idempotente**: si el registro operativo ya existe
para un `source_record`, no se duplica (se cuenta como `already_persisted`). Tras
persistir, el `source_record` pasa a estado `PERSISTED`.

## Cómo se proyecta al grafo con `GraphProjectionService`

`GraphProjectionService` (módulo TraceGraph) lleva el lote y sus registros
operativos al **grafo de trazabilidad** (`trace_nodes`, `trace_edges`,
`trace_events`):

- `projectImportBatch` — asegura el nodo del lote y registra el evento
  `IMPORT_BATCH_PROJECTED`.
- `projectOperationalRecords` — proyecta los registros operativos del lote como
  nodos y relaciones del grafo.

Así, los datos importados pasan de ser filas operativas a ser nodos
consultables y relacionables dentro del grafo de evidencia.

## Relación entre las piezas

El recorrido de un dato a través del conector es:

```
fuente externa
   └─ lote (import_batches)
        └─ registro fuente (source_records)   ← evidencia normalizada
             └─ tabla operativa (operation_*/extraction_balances/gtfs)
                  └─ nodo del grafo (trace_nodes / trace_edges / trace_events)
```

Cada nivel conserva la referencia al anterior (`import_batch_id`,
`source_record_id`), lo que permite reconstruir la trazabilidad desde el grafo
hasta la fila cruda original.

## Por qué sigue siendo demo controlada y no integración real

En este sprint el conector trabaja con **filas crudas inyectadas manualmente**
por el endpoint demo de normalización. No lee archivos reales ni se conecta a
sistemas externos: el objetivo es validar el **modelo y el flujo** de
interoperabilidad (lote → evidencia → operativo → grafo) de extremo a extremo,
dejando lista la base para conectar fuentes reales más adelante.

Por eso es una **base interoperable para prototipo** y no una integración
productiva con sistemas oficiales.

## Riesgos y trabajo próximo

Al pasar de la demo controlada a fuentes reales, los principales riesgos a
atender son:

- **Calidad de datos** — filas incompletas o inconsistentes desde el origen.
- **Duplicados** — mismo registro ingresado por más de un lote o fuente.
- **Validación semántica** — coherencia entre operaciones (p. ej. volumen
  trozado vs. talado, despacho vs. balance).
- **Mapeos por fuente** — campos distintos por sistema, gestionados con
  `import_mappings`.
- **Carga de archivos** — lectura real de Excel/PDF y su parseo por tipo.
- **Trazabilidad forestal completa** — encadenar tala → trozado → despacho → GTF
  en el grafo de forma verificable.
