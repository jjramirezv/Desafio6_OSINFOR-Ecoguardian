# Sprint 3 — Trazabilidad y grafo de evidencia

## Objetivo

Exponer endpoints de **trazabilidad y grafo** sobre la evidencia ya proyectada
por el conector interoperable (Sprint 2), de modo que el frontend/demo de
**Huella Legal Forestal** pueda **visualizar una red de evidencia**: el grafo de
un lote, su línea de tiempo de eventos, el vecindario de un nodo y una búsqueda
simple de nodos por etiqueta.

Sprint 3 es **solo lectura**: no modifica el flujo de ingesta ni el de
proyección; consume `trace_nodes`, `trace_edges` y `trace_events` ya existentes.

## Alcance implementado

Incluido en Sprint 3:

- **Grafo por lote** — `GET /api/import-batches/{id}/graph`.
- **Timeline por lote** — `GET /api/import-batches/{id}/timeline`.
- **Vecindario de un nodo** — `GET /api/trace/nodes/{id}/neighbors`.
- **Búsqueda simple de grafo** — `GET /api/trace/search?q=...`.
- Documentación del sprint y de la arquitectura del grafo de trazabilidad.

Fuera de alcance (no implementado todavía):

- Frontend / visualización.
- IA / verificación automática.
- Inmutabilidad por cadena de hashes (blockchain).
- Carga real de archivos (upload).
- Reglas de consistencia y alertas (previstas para Sprint 4).

## Endpoints agregados

| Método | Ruta                                       | Descripción                                       |
| ------ | ------------------------------------------ | ------------------------------------------------- |
| GET    | `/api/import-batches/{id}/graph`           | Nodo del lote, sus relaciones salientes y destinos. |
| GET    | `/api/import-batches/{id}/timeline`        | Eventos del grafo asociados al lote.              |
| GET    | `/api/trace/nodes/{id}/neighbors`          | Nodo central, relaciones entrantes/salientes y vecinos. |
| GET    | `/api/trace/search?q=...`                  | Búsqueda de nodos por `label` (máx. 20).          |

Controladores:

- `app/Modules/Interoperability/Controllers/ImportBatchController.php` — métodos
  `graph()` y `timeline()`.
- `app/Modules/TraceGraph/Controllers/TraceGraphController.php` — métodos
  `neighbors()` y `search()`.

Todas las consultas usan `DB::table` (no Eloquent), alineadas con el resto del
módulo de grafo y del conector.

## Flujo de grafo por lote

`GET /api/import-batches/{id}/graph`

1. Busca el lote en `import_batches`. Si no existe: **404**.
2. Localiza el **nodo del lote** en `trace_nodes` por metadata:
   `metadata->>'projection_type' = 'IMPORT_BATCH'` y
   `metadata->>'batch_code' = import_batches.batch_code`.
3. Si el lote existe pero **aún no fue proyectado** (no hay nodo): devuelve
   `nodes = []`, `edges = []` y `meta` en 0.
4. Si hay nodo: trae las relaciones (`trace_edges`) cuyo
   `source_node_id = batch_node.id` y los nodos destino (`target_node_id`).
5. Responde con `batch`, `nodes` (nodo del lote + destinos), `edges` y `meta`
   con `nodes_count` / `edges_count`.

Respuesta:

```json
{
  "data": {
    "batch": {
      "id": 1,
      "batch_code": "IMP-TALA-001",
      "import_type": "LIBRO_OPERACIONES_TALA",
      "status": "COMPLETED"
    },
    "nodes": [
      { "id": 10, "type": "EVENTO", "label": "IMP-TALA-001", "status": "ACTIVE", "metadata": {} }
    ],
    "edges": [
      { "id": 1, "source": 10, "target": 11, "relation": "REGISTRA", "status": "ACTIVE", "metadata": {} }
    ],
    "meta": { "nodes_count": 2, "edges_count": 1 }
  }
}
```

## Timeline de eventos

`GET /api/import-batches/{id}/timeline`

Devuelve los eventos de `trace_events` filtrados por
`entity_type = 'import_batches'` y `entity_id = {id}`, en orden cronológico.
Para un lote proyectado por el flujo demo aparecen, al menos,
`IMPORT_BATCH_PROJECTED` y `OPERATIONAL_RECORDS_PROJECTED`.

```json
{
  "data": [
    {
      "id": 1,
      "event_type": "IMPORT_BATCH_PROJECTED",
      "entity_type": "import_batches",
      "entity_id": 1,
      "payload": {},
      "created_at": "..."
    }
  ],
  "meta": { "total": 1 }
}
```

## Vecindario de un nodo (neighbors)

`GET /api/trace/nodes/{id}/neighbors`

Permite la trazabilidad **directa e inversa** de un nodo. Si el nodo no existe:
**404**. En caso contrario devuelve:

- `node` — el nodo central.
- `edges` — relaciones salientes (`source_node_id = id`) y entrantes
  (`target_node_id = id`).
- `neighbors` — los nodos relacionados por ambos sentidos (sin duplicar el
  nodo central).

```json
{
  "data": {
    "node": { "id": 11, "type": "EVENTO", "label": "Tala A-001", "status": "ACTIVE", "metadata": {} },
    "neighbors": [
      { "id": 10, "type": "EVENTO", "label": "IMP-TALA-001", "status": "ACTIVE", "metadata": {} }
    ],
    "edges": [
      { "id": 1, "source": 10, "target": 11, "relation": "REGISTRA", "status": "ACTIVE", "metadata": {} }
    ]
  },
  "meta": { "neighbors_count": 1, "edges_count": 1 }
}
```

## Búsqueda simple de grafo (search)

`GET /api/trace/search?q=Tala`

Busca de forma insensible a mayúsculas (`ILIKE`) en `trace_nodes.label` y
devuelve un máximo de **20** resultados. Si no llega `q` (o viene vacío),
responde `data = []`.

```json
{
  "data": [
    { "id": 11, "type": "EVENTO", "label": "Tala A-001", "status": "ACTIVE", "metadata": {} }
  ],
  "meta": { "total": 1 }
}
```

## Cómo probar

```bash
cd backend
php artisan migrate:fresh --seed
php artisan route:list
```

Flujo demo (servidor en `http://127.0.0.1:8000`):

```bash
# 1. Crear lote
curl -X POST http://127.0.0.1:8000/api/import-batches \
  -H "Content-Type: application/json" \
  -d '{"batch_code":"IMP-TALA-001","name":"Importación tala demo","import_type":"LIBRO_OPERACIONES_TALA"}'

# 2. Normalizar filas
curl -X POST http://127.0.0.1:8000/api/import-batches/1/normalize-demo \
  -H "Content-Type: application/json" \
  -d '{"rows":[{"tree_code":"T-1","species":"Caoba","volume_m3":1.5}]}'

# 3. Persistir
curl -X POST http://127.0.0.1:8000/api/import-batches/1/persist

# 4. Proyectar lote y registros operativos
curl -X POST http://127.0.0.1:8000/api/import-batches/1/project
curl -X POST http://127.0.0.1:8000/api/import-batches/1/project-operational

# 5. Consultar grafo y trazabilidad (Sprint 3)
curl http://127.0.0.1:8000/api/import-batches/1/graph
curl http://127.0.0.1:8000/api/import-batches/1/timeline
curl http://127.0.0.1:8000/api/trace/nodes/11/neighbors
curl "http://127.0.0.1:8000/api/trace/search?q=Tala"
```

## Límites de este sprint

- Es un **grafo operativo básico**: representa el lote y sus registros operativos
  con relaciones `REGISTRA`, no la cadena forestal legal completa.
- **Todavía no es el grafo forestal legal completo** (tala → trozado → despacho →
  GTF → balance, con sus reglas).
- **No hay visualización frontend** todavía: solo se exponen los endpoints.
- **No hay blockchain** ni inmutabilidad por cadena de hashes todavía.

## Pendientes para sprints futuros

- Construcción del grafo forestal completo y tipado de relaciones de dominio.
- Reglas de consistencia, discrepancias y alertas (Sprint 4).
- Visualización frontend de la red de evidencia.
- Inmutabilidad por cadena de hashes / sellado.
