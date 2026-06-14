# Arquitectura — Grafo de trazabilidad

Este documento describe cómo se consulta el **grafo de trazabilidad** de
**Huella Legal Forestal** a partir de la evidencia proyectada por el conector
interoperable. Es la base de lectura del Sprint 3 sobre el modelo de evidencia
del Sprint 1.

## Modelo de datos del grafo

El grafo se apoya en tres tablas (creadas en el Sprint 1):

- **`trace_nodes`** — nodos del grafo.
  - `node_type` (EVENTO, BALANCE, GTF, …), `label`, `status`.
  - `entity_table` / `entity_id` — referencia polimórfica opcional a la entidad
    de dominio que respalda el nodo.
  - `metadata` (jsonb) — datos de proyección; p. ej.
    `projection_type` (`IMPORT_BATCH`, `OPERATIONAL_RECORD`), `batch_code`,
    `import_type`, `import_batch_id`.
- **`trace_edges`** — relaciones dirigidas entre nodos.
  - `source_node_id` → `target_node_id`, `relation_type` (p. ej. `REGISTRA`),
    `status`, `metadata`.
  - Restricción única `(source_node_id, target_node_id, relation_type)`.
- **`trace_events`** — bitácora de eventos del grafo.
  - `event_type`, `entity_type`, `entity_id`, `source_system_id`, `payload`.

## Cómo se proyecta (Sprint 2, recordatorio)

`GraphProjectionService` produce esta evidencia:

- `projectImportBatch()` — asegura un nodo `EVENTO` que representa el lote, con
  `metadata.projection_type = IMPORT_BATCH` y `metadata.batch_code`, y registra
  el evento `IMPORT_BATCH_PROJECTED`.
- `projectOperationalRecords()` — por cada registro operativo del lote crea un
  nodo (`metadata.projection_type = OPERATIONAL_RECORD`) y una relación
  `REGISTRA` desde el nodo del lote, y registra `OPERATIONAL_RECORDS_PROJECTED`.

La proyección es **idempotente** para nodos y relaciones (claves naturales /
restricción única); los eventos se registran en cada ejecución.

## Cómo se consulta (Sprint 3)

Las consultas son de **solo lectura** y usan `DB::table`.

### Grafo por lote

`ImportBatchController::graph()` resuelve el **nodo del lote** por su metadata
(`projection_type = IMPORT_BATCH` + `batch_code`), no por `entity_id`, para
mantener la regla acordada del sprint. Desde ese nodo expande las relaciones
salientes y sus destinos:

```
import_batches.batch_code
        │  (metadata->>'batch_code')
        ▼
   trace_nodes (IMPORT_BATCH)  ──REGISTRA──▶  trace_nodes (OPERATIONAL_RECORD)
        │                                          (operation_tala, gtfs, …)
        └── trace_edges.source_node_id = batch_node.id
```

Si el lote existe pero no fue proyectado, el resultado es un grafo vacío
(`nodes = []`, `edges = []`).

### Timeline por lote

`ImportBatchController::timeline()` lee `trace_events` filtrando por
`entity_type = 'import_batches'` y `entity_id`, en orden cronológico. Es la
**línea de tiempo** de la proyección del lote.

### Vecindario de un nodo (neighbors)

`TraceGraphController::neighbors()` toma un nodo cualquiera y devuelve su
trazabilidad **directa e inversa**: relaciones salientes
(`source_node_id = id`) y entrantes (`target_node_id = id`), más los nodos
vecinos por ambos sentidos. Es la pieza que permite "navegar" el grafo nodo a
nodo desde el frontend.

### Búsqueda simple (search)

`TraceGraphController::search()` busca nodos por `label` (`ILIKE`, máx. 20). Es
el punto de entrada para localizar un nodo y luego expandirlo con `neighbors`.

## Forma estándar de las respuestas

Para mantener un contrato estable hacia el frontend:

- **Nodo**: `{ id, type, label, status, metadata }`.
- **Relación**: `{ id, source, target, relation, status, metadata }`.
- `metadata` siempre se devuelve como objeto (`{}` cuando es nulo/vacío), nunca
  como cadena escapada ni como arreglo vacío.

## Límites actuales

- El grafo es **operativo básico**: lote → registros operativos vía `REGISTRA`.
- **No** es todavía el **grafo forestal legal completo** (cadena
  tala → trozado → despacho → GTF → balance con sus relaciones de dominio).
- **No** hay reglas de consistencia, discrepancias ni alertas (Sprint 4).
- **No** hay visualización frontend ni inmutabilidad por cadena de hashes
  (blockchain) todavía.
