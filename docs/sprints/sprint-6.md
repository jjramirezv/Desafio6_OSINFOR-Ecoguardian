# Sprint 6 — Snapshot y verificación pública backend

## Objetivo

Cerrar el backend demo con un mecanismo de **snapshot verificable** de la Huella
Legal y un endpoint de **verificación pública por código**. Un snapshot congela
el estado técnico de la huella de un lote en un momento dado, le asigna un
**hash reproducible** y un **código de verificación legible**, y lo expone en una
respuesta compacta lista para QR/API. Se suma un endpoint de resumen del backend
para la demo.

> El sistema **no certifica legalidad** ni **declara legal/ilegal**. El snapshot
> y la verificación solo resumen **trazabilidad técnica**, **consistencia
> documental**, **evidencia** y **alertas registradas**.

## Alcance implementado

Incluido en Sprint 6:

- **Migración `legal_footprint_snapshots`** (S6-BE-01) — tabla de snapshots con
  código de verificación único, hash, estado, score y payload.
- **Servicio `LegalFootprintSnapshotService`** (S6-BE-02) con:
  - `createFromImportBatch()` — construye la huella actual, calcula payload
    estable, genera hash y código de verificación, y persiste el snapshot.
  - `findByVerificationCode()` — recupera un snapshot por su código.
  - `buildPublicPayload()` — arma la respuesta pública compacta (QR/API).
- **Endpoints de snapshot y verificación pública** (S6-BE-03).
- **Endpoint de resumen del backend** para la demo (S6-BE-04).
- Documentación final del backend (S6-BE-05).

Fuera de alcance (no implementado):

- Frontend / visualización / generación real de QR.
- IA / detección automática.
- Blockchain / inmutabilidad distribuida (el hash es un sello local).
- Modelos Eloquent (se usa `DB::table`).
- Cambios en `.env`, `.ai-local` o seeders.
- Declaración de legalidad/ilegalidad.

## Tabla `legal_footprint_snapshots`

| Campo               | Tipo                  | Notas |
| ------------------- | --------------------- | ----- |
| `id`                | bigint PK             | |
| `import_batch_id`   | FK nullable           | `import_batches.id`, `nullOnDelete`. |
| `verification_code` | string unique         | Código legible, p. ej. `HLF-1-ABC12345`. |
| `footprint_hash`    | string                | sha256 sobre el JSON ordenado/estable del payload. |
| `status`            | string                | Estado técnico congelado: `TRACEABLE`, `OBSERVED`, `INCOMPLETE`. |
| `score`             | integer (def. 0)      | Score técnico de completitud (0-100). |
| `payload`           | jsonb                 | Payload técnico completo del snapshot. |
| `metadata`          | jsonb nullable        | Metadatos (algoritmo de hash, generador). |
| `generated_at`      | timestamp nullable    | Momento de generación. |
| `timestamps`        | —                     | |

Índices: `import_batch_id`, `verification_code` (unique), `footprint_hash`,
`status`.

## Servicios

`app/Modules/LegalFootprint/Services/LegalFootprintSnapshotService.php`.

- Usa `LegalFootprintService::buildFromImportBatch()` para obtener la huella
  técnica actual del lote.
- **Payload estable** (mínimo): `import_batch`, `status`, `completeness`,
  `alerts` (summary), `counts`, `graph` (meta) y `generated_at`.
- **Hash**: `sha256` sobre el JSON con **claves ordenadas recursivamente**
  (`JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES`), para reproducibilidad.
- **Código de verificación**: `HLF-{import_batch_id}-{8 hex del hash}`.
- **Idempotencia**: si el mismo lote ya tiene un snapshot con idéntico hash, se
  reutiliza (se actualiza `generated_at`) y se conserva el `verification_code`.
  Si el código ya estuviera tomado por otro hash, se anexa un sufijo de
  timestamp corto para no romper el `unique`.

## Endpoints agregados

| Método | Ruta                                                      | Descripción |
| ------ | --------------------------------------------------------- | ----------- |
| POST   | `/api/import-batches/{id}/legal-footprint/snapshot`       | Genera y persiste un snapshot de la huella del lote. |
| GET    | `/api/legal-footprints/verify/{verificationCode}`         | Verificación pública compacta por código. |
| GET    | `/api/demo/backend-summary`                               | Resumen técnico del backend para la demo. |

Controladores: `LegalFootprintSnapshotController` (módulo LegalFootprint) y
`DemoController` (`app/Http/Controllers`).

### Respuesta de `POST .../snapshot`

```json
{
  "data": {
    "id": 1,
    "verification_code": "HLF-1-ABC12345",
    "footprint_hash": "...",
    "status": "TRACEABLE",
    "score": 80,
    "generated_at": "..."
  },
  "message": "Legal footprint snapshot generated successfully"
}
```

Si el lote no existe: **404**.

### Respuesta de `GET .../verify/{verificationCode}`

```json
{
  "data": {
    "verification_code": "HLF-1-ABC12345",
    "status": "TRACEABLE",
    "score": 80,
    "footprint_hash": "...",
    "generated_at": "...",
    "summary": {
      "batch_code": "...",
      "import_type": "...",
      "source_records": 2,
      "errors": 0,
      "alerts": { "total": 0, "critical": 0, "errors": 0, "warnings": 0, "open": 0 },
      "graph_nodes": 3,
      "graph_edges": 2
    },
    "disclaimer": "Esta verificación no certifica legalidad; resume trazabilidad técnica, consistencia documental y alertas registradas."
  }
}
```

Si el código no existe: **404**.

### Respuesta de `GET /api/demo/backend-summary`

Devuelve `backend_status: READY_FOR_DEMO`, los sprints/módulos implementados, los
endpoints principales del flujo y el disclaimer. Ver
[backend-demo-checklist.md](../demo/backend-demo-checklist.md).

## Validación

```bash
cd backend
php artisan migrate:fresh --seed
php artisan migrate:status
php artisan route:list
```

Flujo demo completo:

1. `GET /api/health`
2. `POST /api/import-batches`
3. `POST /api/import-batches/{id}/normalize-demo`
4. `POST /api/import-batches/{id}/persist`
5. `POST /api/import-batches/{id}/project`
6. `POST /api/import-batches/{id}/project-operational`
7. `POST /api/import-batches/{id}/run-consistency`
8. `GET /api/import-batches/{id}/legal-footprint/summary`
9. `POST /api/import-batches/{id}/legal-footprint/snapshot`
10. `GET /api/legal-footprints/verify/{verificationCode}`
11. `GET /api/demo/backend-summary`

Validar: el snapshot genera `verification_code`; `verify` devuelve payload
público; `footprint_hash` existe; aparece el `disclaimer`; `backend-summary`
responde `READY_FOR_DEMO`; un código inexistente devuelve **404**.

## Límites de este sprint

- El snapshot **no certifica legalidad**; solo congela el estado técnico.
- El `footprint_hash` es un **sello de integridad local**, no una prueba
  distribuida (no es blockchain real). Ver
  [verificacion-publica-snapshot.md](../arquitectura/verificacion-publica-snapshot.md).
- El QR vive en otra capa: el backend solo entrega el `verification_code` y el
  payload compacto.
- La verificación pública es de **solo lectura** y no expone el grafo completo ni
  los registros operativos, solo el resumen.

## Pendientes para sprints futuros

- Generación real de QR y portal público de verificación (frontend).
- Firma criptográfica del snapshot (clave de organización) y/o anclaje externo.
- Historial de snapshots por lote y comparación de versiones.
- Política de expiración / revocación de códigos de verificación.
