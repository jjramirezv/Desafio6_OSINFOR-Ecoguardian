# Sprint 5 — Motor de consistencia y alertas backend

## Objetivo

Construir el **motor backend de consistencia, discrepancias y alertas** por lote
de importación. El motor evalúa reglas técnicas/documentales sobre la cadena de
un lote y persiste las inconsistencias detectadas como **alertas** en
`consistency_alerts`, para que un revisor humano las analice.

> El sistema **no declara legal/ilegal**. Las alertas son **observaciones
> técnicas y documentales** para revisión, no una sentencia legal.

## Alcance implementado

Incluido en Sprint 5:

- **Migración `consistency_alerts`** (S5-BE-01) — tabla de alertas con índices y
  restricción única lógica para idempotencia.
- **Servicio `ConsistencyService`** (S5-BE-02) con:
  - `runForImportBatch()` — ejecuta todas las reglas y persiste alertas.
  - 7 reglas básicas de consistencia (datos, trazabilidad, volumen, documentos y grafo).
  - Idempotencia: reejecutar no duplica alertas y preserva el `status` revisado.
- **Endpoints de consistencia** (S5-BE-03) — ejecutar, listar, detalle y cambio
  de estado de alertas.
- **Integración con la Huella Legal** (S5-BE-04) — el summary incluye un bloque
  `alerts` y el estado pasa a `OBSERVED` ante alertas `CRITICAL`/`ERROR` abiertas.
- Documentación del sprint y de la arquitectura del motor (S5-BE-05).

Fuera de alcance (no implementado):

- Frontend / visualización.
- IA / detección automática.
- Blockchain / inmutabilidad por cadena de hashes.
- Modelos Eloquent (se usa `DB::table`).
- Carga real de archivos.
- Cambios en `.env`, `.ai-local` o seeders.
- Declaración de legalidad/ilegalidad.

## Tabla `consistency_alerts`

| Campo               | Tipo                  | Notas |
| ------------------- | --------------------- | ----- |
| `id`                | bigint PK             | |
| `import_batch_id`   | FK nullable           | `import_batches.id`, `nullOnDelete`. |
| `source_record_id`  | FK nullable           | `source_records.id`, `nullOnDelete`. |
| `entity_type`       | string nullable       | Tabla de la entidad observada (p. ej. `extraction_balances`). |
| `entity_id`         | unsignedBigInteger nullable | Id de la entidad observada. |
| `alert_code`        | string                | Identificador de la regla. |
| `alert_type`        | string                | `DATA_QUALITY`, `TRACEABILITY`, `VOLUME`, `DOCUMENT`, `GRAPH`. |
| `severity`          | string (def. WARNING) | `INFO`, `WARNING`, `ERROR`, `CRITICAL`. |
| `title`             | string                | Título legible. |
| `description`       | text nullable         | Detalle de la observación. |
| `status`            | string (def. OPEN)    | `OPEN`, `REVIEWED`, `DISMISSED`, `RESOLVED`. |
| `evidence`          | jsonb nullable        | Datos de soporte de la alerta. |
| `metadata`          | jsonb nullable        | Metadatos adicionales. |
| `timestamps`        | —                     | |

Índices: `import_batch_id`, `source_record_id`, `alert_code`, `alert_type`,
`severity`, `status`, `(entity_type, entity_id)`.

Restricción única (idempotencia):
`consistency_alerts_unique_alert` sobre
`(import_batch_id, entity_type, entity_id, alert_code)`.

## Reglas implementadas

| # | `alert_code`                  | `alert_type`  | `severity` | Disparador |
| - | ----------------------------- | ------------- | ---------- | ---------- |
| 1 | `IMPORT_ERRORS_PRESENT`       | DATA_QUALITY  | ERROR      | El lote tiene `import_errors`. |
| 2 | `NO_SOURCE_RECORDS`           | TRACEABILITY  | CRITICAL   | El lote no tiene `source_records`. |
| 3 | `SOURCE_RECORDS_NOT_PERSISTED`| TRACEABILITY  | WARNING    | Hay `source_records` en estado `NORMALIZED` no persistidos. |
| 4 | `OPERATIONAL_WITHOUT_GRAPH`   | GRAPH         | WARNING    | Hay registros operativos pero no proyección operativa al grafo. |
| 5 | `VOLUME_EXCEEDS_AUTHORIZED`   | VOLUME        | CRITICAL   | `extracted_volume_m3 > authorized_volume_m3` en un balance. |
| 6 | `GTF_WITHOUT_BALANCE`         | DOCUMENT      | WARNING    | GTF del lote sin `extraction_balance_id`. |
| 7 | `DISPATCH_WITHOUT_GTF`        | DOCUMENT      | WARNING    | Hay despacho del lote pero ninguna GTF registrada. |

Las reglas 5 y 6 generan **una alerta por entidad** afectada (con `entity_type`
y `entity_id`); el resto son alertas **a nivel lote**.

## Idempotencia

La identidad lógica de una alerta es
`(import_batch_id, entity_type, entity_id, alert_code)`. Al reejecutar
`run-consistency`:

- Si la alerta ya existe, se **actualizan** sus campos mutables (título,
  descripción, severidad, evidencia) y se **preserva su `status`** (que un
  revisor pudo haber cambiado a `REVIEWED`/`DISMISSED`/`RESOLVED`).
- Si no existe, se **crea** con `status = OPEN`.

No se duplican filas en ninguna ejecución posterior.

## Endpoints agregados

| Método | Ruta                                              | Descripción |
| ------ | ------------------------------------------------- | ----------- |
| POST   | `/api/import-batches/{id}/run-consistency`        | Ejecuta el motor sobre el lote y devuelve el resumen. |
| GET    | `/api/import-batches/{id}/alerts`                 | Lista alertas del lote. Filtros: `severity`, `status`, `alert_type`. |
| GET    | `/api/consistency-alerts/{id}`                    | Detalle de una alerta. |
| PATCH  | `/api/consistency-alerts/{id}/status`             | Cambia el estado de revisión de una alerta. |

Controlador: `app/Modules/Consistency/Controllers/ConsistencyController.php`.
Servicio: `app/Modules/Consistency/Services/ConsistencyService.php`.

### Respuesta de `run-consistency`

```json
{
  "data": {
    "import_batch_id": 1,
    "alerts_created_or_found": 2,
    "critical": 0,
    "errors": 1,
    "warnings": 1,
    "info": 0
  },
  "message": "Consistency check completed successfully"
}
```

Si el lote no existe: **404**.

### Respuesta de listado de alertas

```json
{
  "data": [],
  "meta": { "total": 0 }
}
```

### `PATCH .../status`

Request:

```json
{ "status": "REVIEWED" }
```

Estados válidos: `OPEN`, `REVIEWED`, `DISMISSED`, `RESOLVED`. Status inválido:
**422**. Alerta inexistente: **404**.

## Integración con la Huella Legal (S5-BE-04)

`LegalFootprintService` ahora carga un resumen de alertas del lote y lo expone en
las respuestas de huella y de summary:

```json
"alerts": {
  "total": 2,
  "critical": 0,
  "errors": 1,
  "warnings": 1,
  "open": 2
}
```

Ajuste de estado técnico:

- Si hay alertas `CRITICAL` o `ERROR` **abiertas** → `OBSERVED`.
- Si no hay alertas ni errores → se mantiene `TRACEABLE` si cumple completitud.
- Nunca se usan estados `LEGAL`/`ILLEGAL`.

La respuesta anterior no se rompe: solo se **extiende** con el bloque `alerts`.

## Cómo probar

```bash
cd backend
php artisan migrate:fresh --seed
php artisan migrate:status
php artisan route:list
```

Flujo demo (servidor en `http://127.0.0.1:8000`):

```bash
# Caso A: error de normalización -> IMPORT_ERRORS_PRESENT
curl -X POST http://127.0.0.1:8000/api/import-batches \
  -H "Content-Type: application/json" \
  -d '{"batch_code":"S5-A","name":"Caso A","import_type":"LIBRO_OPERACIONES_TALA"}'
curl -X POST http://127.0.0.1:8000/api/import-batches/1/normalize-demo \
  -H "Content-Type: application/json" \
  -d '{"rows":[{"tree_code":"T-1","species":"Caoba","volume_m3":1.5},{"species":"SinCodigo"}]}'
curl -X POST http://127.0.0.1:8000/api/import-batches/1/run-consistency
curl http://127.0.0.1:8000/api/import-batches/1/alerts

# Caso E: cambiar estado
curl -X PATCH http://127.0.0.1:8000/api/consistency-alerts/1/status \
  -H "Content-Type: application/json" -d '{"status":"REVIEWED"}'

# Caso F: huella legal con bloque alerts
curl http://127.0.0.1:8000/api/import-batches/1/legal-footprint/summary
```

Casos esperados:

- **A** — batch TALA con fila inválida → `IMPORT_ERRORS_PRESENT`.
- **B** — batch sin normalizar → `NO_SOURCE_RECORDS`.
- **C** — persistido sin proyección operativa → `OPERATIONAL_WITHOUT_GRAPH`.
- **D** — reejecutar `run-consistency` no duplica alertas.
- **E** — `PATCH` a `REVIEWED` se refleja en el detalle.
- **F** — el summary incluye `alerts` y pasa a `OBSERVED` con alertas abiertas.

## Límites de este sprint

- Las alertas son **técnicas/documentales**, no una sentencia legal.
- El motor se ejecuta **bajo demanda** (`run-consistency`); no hay disparo
  automático tras normalizar/persistir/proyectar.
- El conjunto de reglas es **mínimo y conservador**; no cubre toda la cadena
  forestal ni reglas de dominio avanzadas.
- No hay notificaciones, asignación de revisores ni flujo de resolución más allá
  del cambio de `status`.

## Pendientes para sprints futuros

- Nuevas reglas de discrepancia (cruces tala ↔ trozado ↔ despacho ↔ GTF ↔ balance).
- Disparo automático del motor dentro del flujo de ingesta.
- Métricas y agregados de alertas por organización/título/plan.
- Flujo de resolución con auditoría y trazabilidad de revisiones.
- Visualización frontend de alertas y su relación con el grafo y la huella.
