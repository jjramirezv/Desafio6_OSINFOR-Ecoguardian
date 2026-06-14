# Sprint 2 — Conector interoperable

## Objetivo

Construir la base del **conector interoperable** del SaaS de trazabilidad
forestal **Huella Legal Forestal** (reto OSINFOR): un mecanismo controlado para
ingresar datos de fuentes forestales (libro de operaciones de tala, trozado y
despacho, balance de extracción y GTF) a través de **lotes de importación**,
normalizarlos, registrarlos como evidencia (`source_records`), persistirlos en
tablas operativas y proyectarlos al grafo de trazabilidad.

Sprint 2 es una **base interoperable para prototipo**: trabaja con un flujo demo
controlado de filas crudas. No incorpora todavía carga real de archivos,
integración real con sistemas externos, IA ni blockchain.

## Alcance implementado

Incluido en Sprint 2:

- Migraciones de las tablas del conector y de las tablas operativas.
- Registro manual de lotes de importación (`import_batches`).
- Normalización demo de filas crudas con `SourceNormalizerService`.
- Registro de evidencia en `source_records` y de fallos en `import_errors`.
- Persistencia operativa con `OperationalPersistenceService`.
- Proyección al grafo de trazabilidad con `GraphProjectionService`.
- Endpoint de resumen del lote (`summary`).
- Endpoints de consulta del conector (lotes, source_records, errores,
  registros operativos y detalle de source_record).
- Documentación oficial del sprint y de la arquitectura del conector.

Fuera de alcance (no implementado todavía):

- Carga real de archivos (upload).
- Lectura de Excel/PDF.
- Integración real con sistemas externos (OSINFOR / SNIFFS / SERFOR u otros).
- IA / verificación automática.
- Inmutabilidad por cadena de hashes (blockchain / hash chain).
- Frontend.

## Tablas creadas

Conector interoperable:

- `import_batches` — lotes de importación, con contadores y estado.
- `import_errors` — errores de normalización por fila del lote.
- `import_mappings` — mapeos de campos por fuente (base para sprints futuros).

Tablas operativas (destino de la persistencia):

- `operation_tala` — operaciones de tala.
- `operation_trozado` — operaciones de trozado.
- `operation_despacho` — operaciones de despacho.
- `extraction_balances` — balances de extracción.
- `gtfs` — guías de transporte forestal (GTF).

> `source_records`, `trace_nodes`, `trace_edges` y `trace_events` provienen del
> modelo de evidencia del Sprint 1 y el conector las reutiliza.

## Servicios creados

- **SourceNormalizerService** — normaliza una fila cruda según el `import_type`
  del lote: produce el `normalized_payload` y la lista de `errors` por campo.
- **OperationalPersistenceService** — toma los `source_records` normalizados de
  un lote y los persiste, según su `record_type`, en la tabla operativa
  correspondiente. Es idempotente.
- **GraphProjectionService** (módulo TraceGraph) — proyecta el lote y sus
  registros operativos al grafo de trazabilidad (`trace_nodes`, `trace_edges`,
  `trace_events`).

## Endpoints implementados

Escritura / proceso (flujo del conector):

| Método | Ruta                                          | Descripción                              |
| ------ | --------------------------------------------- | ---------------------------------------- |
| POST   | `/api/import-batches`                          | Crea un lote en estado `PENDING`.        |
| POST   | `/api/import-batches/{id}/normalize-demo`      | Normaliza filas crudas demo.             |
| POST   | `/api/import-batches/{id}/persist`             | Persiste source_records a tablas operativas. |
| POST   | `/api/import-batches/{id}/project`             | Proyecta el lote al grafo.               |
| POST   | `/api/import-batches/{id}/project-operational` | Proyecta los registros operativos al grafo. |

Consulta (solo lectura):

| Método | Ruta                                            | Descripción                              |
| ------ | ----------------------------------------------- | ---------------------------------------- |
| GET    | `/api/import-batches`                            | Lista de lotes (filtros + meta).         |
| GET    | `/api/import-batches/{id}`                       | Detalle básico del lote.                 |
| GET    | `/api/import-batches/{id}/summary`               | Resumen: contadores y conteos por tabla. |
| GET    | `/api/import-batches/{id}/source-records`        | source_records del lote.                 |
| GET    | `/api/import-batches/{id}/errors`                | import_errors del lote.                  |
| GET    | `/api/import-batches/{id}/operational-records`   | Registros operativos agrupados por tabla. |
| GET    | `/api/source-records/{id}`                       | Detalle de un source_record.             |

`GET /api/import-batches` acepta los filtros opcionales `status`, `import_type`,
`source_system_id`, `organization_id` y `limit`. Los listados responden con la
forma estándar del proyecto: `{ "data": [...], "meta": { ... } }`.

## Flujo validado

El flujo demo controlado del conector, extremo a extremo:

1. **Crear lote** — `POST /api/import-batches`.
2. **Normalizar demo** — `POST /api/import-batches/{id}/normalize-demo` con un
   par de filas crudas; genera `source_records` (NORMALIZED) e `import_errors`.
3. **Persistir** — `POST /api/import-batches/{id}/persist`; vuelca los
   source_records normalizados a las tablas operativas (idempotente).
4. **Proyectar** — `POST /api/import-batches/{id}/project` y
   `POST /api/import-batches/{id}/project-operational`; registra nodos, relaciones
   y eventos en el grafo.
5. **Consultar summary** — `GET /api/import-batches/{id}/summary`.
6. **Consultar registros** — `source-records`, `errors`, `operational-records`
   y el detalle `GET /api/source-records/{id}`.

## Cómo probar

```bash
cd backend
php artisan migrate:fresh --seed
php artisan migrate:status
php artisan route:list
```

Flujo demo rápido (servidor en `http://127.0.0.1:8000`):

```bash
# 1. Crear lote
curl -X POST http://127.0.0.1:8000/api/import-batches \
  -H "Content-Type: application/json" \
  -d '{"batch_code":"IMP-TALA-001","name":"Importación tala demo","import_type":"LIBRO_OPERACIONES_TALA"}'

# 2. Normalizar dos filas
curl -X POST http://127.0.0.1:8000/api/import-batches/1/normalize-demo \
  -H "Content-Type: application/json" \
  -d '{"rows":[{"tree_code":"T-1","species":"Caoba","volume_m3":1.5},{"species":"Caoba"}]}'

# 3. Persistir
curl -X POST http://127.0.0.1:8000/api/import-batches/1/persist

# 4. Proyectar
curl -X POST http://127.0.0.1:8000/api/import-batches/1/project

# 5. Consultar
curl http://127.0.0.1:8000/api/import-batches/1/summary
curl http://127.0.0.1:8000/api/import-batches/1/source-records
curl http://127.0.0.1:8000/api/import-batches/1/errors
curl http://127.0.0.1:8000/api/import-batches/1/operational-records
curl http://127.0.0.1:8000/api/source-records/1
```

## Límites de este sprint

- No hay upload real de archivos.
- No se leen Excel ni PDF.
- No hay integración real con sistemas externos.
- No hay IA ni verificación automática.
- No hay inmutabilidad por cadena de hashes (blockchain).
- No hay frontend.

El conector es, por diseño, una **base interoperable para prototipo**: el flujo
es demo controlada con filas crudas inyectadas manualmente.

## Pendientes para sprints futuros

- Carga real de archivos y parsers (Excel/PDF) por tipo de fuente.
- Mapeos de campos configurables por fuente (`import_mappings`).
- Validación semántica y reglas de consistencia entre operaciones.
- Detección de duplicados y control de calidad de datos.
- Integración real con sistemas externos.
- Trazabilidad forestal completa (tala → trozado → despacho → GTF) en el grafo.
