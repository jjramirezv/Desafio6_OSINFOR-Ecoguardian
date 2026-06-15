# Sprint 4 — Huella Legal backend

## Objetivo

Construir la **Huella Legal** backend como **subgrafo verificable** de un lote de
importación. La Huella Legal resume la **evidencia técnica** de la cadena de un
lote (registros fuente, errores, registros operativos, grafo de trazabilidad y
eventos) y expone su **estado técnico** para revisión.

> La Huella Legal **no certifica legalidad** ni **declara ilegalidad**. Solo
> describe el estado técnico de la evidencia disponible.

Sprint 4 es **solo lectura**: no modifica ingesta, normalización ni proyección.

## Alcance implementado

Incluido en Sprint 4:

- **Servicio `LegalFootprintService`** (S4-BE-01) con:
  - `buildFromImportBatch()` — arma la huella completa de un lote.
  - `computeStatus()` — deriva `TRACEABLE` / `OBSERVED` / `INCOMPLETE`.
  - `computeCompleteness()` — resume completitud y calcula un score (0-100).
- **Endpoint de huella completa** (S4-BE-02) —
  `GET /api/import-batches/{id}/legal-footprint`.
- **Endpoint de resumen técnico** (S4-BE-03) —
  `GET /api/import-batches/{id}/legal-footprint/summary`.
- Documentación del sprint y de la arquitectura de la Huella Legal (S4-BE-04).

Fuera de alcance (no implementado):

- Frontend / visualización.
- IA / verificación automática.
- Blockchain / inmutabilidad por cadena de hashes.
- Modelos Eloquent (se usa `DB::table`).
- Cambios en `.env`, `.ai-local`, migraciones o seeders.

## Estados técnicos

| Estado       | Condición                                                         |
| ------------ | ---------------------------------------------------------------- |
| `OBSERVED`   | El lote tiene **errores de importación**.                         |
| `INCOMPLETE` | **No hay** `source_records` **o no hay** nodos de grafo.          |
| `TRACEABLE`  | Hay `source_records`, registros operativos o grafo, y **sin errores**. |

Prioridad de evaluación: **OBSERVED → INCOMPLETE → TRACEABLE**. Nunca se usan
estados LEGAL/ILEGAL.

## Endpoints agregados

| Método | Ruta                                               | Descripción |
| ------ | -------------------------------------------------- | ----------- |
| GET    | `/api/import-batches/{id}/legal-footprint`         | Huella completa: lote, estado, completitud, source_records, errores, registros operativos, grafo y eventos. |
| GET    | `/api/import-batches/{id}/legal-footprint/summary` | Resumen compacto: estado, score, conteos y mensaje técnico. |

Si el lote no existe: **404** en ambos.

Controlador: `app/Modules/LegalFootprint/Controllers/LegalFootprintController.php`.
Servicio: `app/Modules/LegalFootprint/Services/LegalFootprintService.php`.

### Respuesta de huella completa

```json
{
  "data": {
    "import_batch": { "id": 1, "batch_code": "IMP-TALA-001", "import_type": "LIBRO_OPERACIONES_TALA", "status": "COMPLETED" },
    "status": "TRACEABLE",
    "completeness": {
      "has_source_records": true,
      "has_operational_records": true,
      "has_graph": true,
      "has_errors": false,
      "score": 80
    },
    "source_records": [],
    "errors": [],
    "operational_records": {},
    "graph": { "nodes": [], "edges": [] },
    "events": []
  },
  "message": "Legal footprint generated successfully"
}
```

### Respuesta de resumen técnico

```json
{
  "data": {
    "import_batch_id": 1,
    "batch_code": "IMP-TALA-001",
    "import_type": "LIBRO_OPERACIONES_TALA",
    "status": "TRACEABLE",
    "score": 80,
    "counts": {
      "source_records": 2,
      "errors": 0,
      "operational_records": 2,
      "graph_nodes": 3,
      "graph_edges": 2,
      "events": 2
    },
    "message": "La huella presenta trazabilidad técnica suficiente para revisión."
  }
}
```

Mensajes por estado:

- `TRACEABLE`: "La huella presenta trazabilidad técnica suficiente para revisión."
- `OBSERVED`: "La huella presenta observaciones que deben revisarse."
- `INCOMPLETE`: "La huella está incompleta y requiere más evidencia."

## Completitud y score

| Señal                      | Aporte |
| -------------------------- | ------ |
| `has_source_records`       | +40    |
| `has_operational_records`  | +20    |
| `has_graph`                | +20    |
| `has_errors`               | −20    |

Acotado a `[0, 100]`. Un lote completo y sin errores obtiene **80**.

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

# 5. Consultar la huella legal (Sprint 4)
curl http://127.0.0.1:8000/api/import-batches/1/legal-footprint
curl http://127.0.0.1:8000/api/import-batches/1/legal-footprint/summary
```

Casos esperados:

- **Sin errores y proyectado** → `TRACEABLE`.
- **Con error de normalización** → `OBSERVED`.
- **Sin proyectar** (sin grafo) → `INCOMPLETE`.

## Límites de este sprint

- La huella **no certifica legalidad** ni declara ilegalidad: solo resume
  evidencia técnica.
- El subgrafo es el **grafo operativo básico** del lote (relaciones `REGISTRA`),
  no la cadena forestal legal completa (tala → trozado → despacho → GTF → balance).
- La huella se calcula **bajo demanda** y **no se persiste**.
- No hay reglas de consistencia, discrepancias ni alertas todavía.

## Pendientes para sprints futuros

- Construcción del grafo forestal completo y tipado de relaciones de dominio.
- Reglas de consistencia, detección de discrepancias y alertas sobre la huella.
- Persistencia/versionado y sellado de la huella (inmutabilidad por hashes).
- Verificación asistida y exportación de la huella para auditoría.
- Visualización frontend de la huella y su subgrafo.
