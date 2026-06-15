# Arquitectura — Motor de consistencia y alertas

## Qué es

El **motor de consistencia** es la capa backend (Sprint 5) que evalúa reglas
técnicas/documentales sobre un lote de importación y registra las
inconsistencias detectadas como **alertas** en `consistency_alerts`.

> **No declara legalidad.** Una alerta es una **observación técnica o
> documental** que requiere revisión humana. El motor nunca emite un veredicto
> legal/ilegal; solo señala qué revisar.

Se apoya en lo ya construido:

- **Sprint 2** — conector interoperable: `import_batches`, `source_records`,
  `import_errors` y tablas operativas.
- **Sprint 3** — grafo de trazabilidad: `trace_nodes`, `trace_edges`,
  `trace_events`.
- **Sprint 4** — Huella Legal: resumen verificable del lote, que ahora consume
  el resumen de alertas.

## Componentes

```
app/Modules/Consistency/
├── Controllers/ConsistencyController.php   # endpoints HTTP
└── Services/ConsistencyService.php         # reglas + persistencia idempotente

database/migrations/
└── 2026_06_14_000025_create_consistency_alerts_table.php
```

`ConsistencyService` usa `DB::table` (sin Eloquent), igual que el resto del
conector, el grafo y la huella legal.

## Modelo de datos: `consistency_alerts`

Cada fila representa una observación sobre un lote (y opcionalmente sobre una
entidad operativa concreta vía `entity_type` / `entity_id`).

- **Clasificación**: `alert_type` (familia) + `alert_code` (regla concreta) +
  `severity` (`INFO` < `WARNING` < `ERROR` < `CRITICAL`).
- **Estado de revisión**: `status` (`OPEN` → `REVIEWED`/`DISMISSED`/`RESOLVED`).
- **Soporte**: `evidence` (datos que justifican la alerta) y `metadata`.

### Identidad lógica e idempotencia

La identidad de una alerta es la tupla:

```
(import_batch_id, entity_type, entity_id, alert_code)
```

Respaldada por el índice único `consistency_alerts_unique_alert`. El servicio
hace un **upsert manual** sobre esa tupla:

- Existe → actualiza campos mutables, **preserva `status`**.
- No existe → inserta con `status = OPEN`.

Esto permite reejecutar el motor sin duplicar alertas y sin pisar el trabajo de
un revisor que ya cambió un `status`.

> Nota: el `where` con valores `null` (alertas a nivel lote, sin entidad) se
> resuelve como `IS NULL` en el builder de Laravel, por lo que el upsert también
> casa correctamente las alertas sin `entity_type`/`entity_id`. La unicidad de la
> base de datos complementa esta lógica para las alertas con entidad.

## Reglas

Cada regla es un método privado que devuelve cero o más definiciones de alerta;
`runForImportBatch()` las concatena y las persiste.

| Regla | Familia        | Severidad | Nivel    | Qué detecta |
| ----- | -------------- | --------- | -------- | ----------- |
| `IMPORT_ERRORS_PRESENT`        | DATA_QUALITY | ERROR    | Lote    | Errores de normalización/validación. |
| `NO_SOURCE_RECORDS`            | TRACEABILITY | CRITICAL | Lote    | Lote sin evidencia fuente. |
| `SOURCE_RECORDS_NOT_PERSISTED` | TRACEABILITY | WARNING  | Lote    | Normalizados que no llegaron a tablas operativas. |
| `OPERATIONAL_WITHOUT_GRAPH`    | GRAPH        | WARNING  | Lote    | Operativos sin proyección al grafo. |
| `VOLUME_EXCEEDS_AUTHORIZED`    | VOLUME       | CRITICAL | Entidad | Balance con extraído > autorizado. |
| `GTF_WITHOUT_BALANCE`          | DOCUMENT     | WARNING  | Entidad | GTF sin balance asociado. |
| `DISPATCH_WITHOUT_GTF`         | DOCUMENT     | WARNING  | Lote    | Despacho sin GTF en el lote. |

El conjunto es **deliberadamente conservador**: prioriza precisión sobre
cobertura para no generar ruido. Agregar una regla es añadir un método y
sumarlo a la lista de `runForImportBatch()`.

## Flujo de ejecución

```
POST /api/import-batches/{id}/run-consistency
        │
        ▼
ConsistencyService::runForImportBatch(id)
        │  ├─ valida que el lote exista (404 si no)
        │  ├─ ejecuta las 7 reglas -> lista de alertas candidatas
        │  ├─ upsert idempotente por identidad lógica
        │  └─ agrega conteos por severidad
        ▼
{ alerts_created_or_found, critical, errors, warnings, info }
```

Resultado consultable vía:

- `GET /api/import-batches/{id}/alerts` (con filtros `severity`/`status`/`alert_type`).
- `GET /api/consistency-alerts/{id}`.
- `PATCH /api/consistency-alerts/{id}/status`.

## Integración con la Huella Legal

`LegalFootprintService` carga un resumen de alertas del lote y:

1. Lo expone como bloque `alerts` (`total`, `critical`, `errors`, `warnings`,
   `open`) en la huella completa y en el summary.
2. Ajusta el **estado técnico**: si existen alertas `CRITICAL`/`ERROR`
   **abiertas**, el estado es `OBSERVED`. Sin alertas ni errores se mantiene
   `TRACEABLE` (si cumple completitud).

Los errores de importación y las alertas abiertas se refuerzan mutuamente, pero
ninguno deriva en estados `LEGAL`/`ILLEGAL`.

## Restricciones de diseño

- **Sin Eloquent**: solo `DB::table`.
- **Sin IA, sin blockchain, sin carga real de archivos.**
- **Sin sentencia legal**: la salida es siempre revisión técnica/documental.
- **Ejecución bajo demanda**: no hay disparo automático ni jobs en background.
- **No rompe contratos previos**: la integración con la huella solo extiende la
  respuesta existente.

## Límites y pendientes backend

- Reglas de cruce más ricas entre etapas (tala → trozado → despacho → GTF →
  balance) y validaciones de fechas/secuencia.
- Disparo automático del motor dentro del pipeline de ingesta.
- Severidad y umbrales configurables por organización/tipo.
- Auditoría del cambio de `status` (quién, cuándo, por qué).
- Agregados y métricas de alertas para tableros de revisión.
