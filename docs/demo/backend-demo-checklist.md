# Checklist técnico de demo backend — Huella Legal Forestal

Guion para demostrar el backend de extremo a extremo, sin frontend. Todo se
ejecuta sobre la API. Servidor local en `http://127.0.0.1:8000`.

> El backend **no certifica legalidad** ni declara legal/ilegal. La demo muestra
> verificación **técnica**: trazabilidad, consistencia documental, evidencia y
> alertas.

## Preparación

```bash
cd backend
php artisan migrate:fresh --seed
php artisan migrate:status
php artisan route:list
php artisan serve
```

## Pasos de la demo

| # | Paso | Endpoint | Qué demuestra |
| - | ---- | -------- | ------------- |
| 1 | Health | `GET /api/health` | El servicio responde. |
| 2 | Crear batch | `POST /api/import-batches` | Alta de lote de importación. |
| 3 | Normalizar demo | `POST /api/import-batches/{id}/normalize-demo` | Normalización de registros crudos. |
| 4 | Persistir | `POST /api/import-batches/{id}/persist` | Persistencia de registros operativos. |
| 5 | Proyectar | `POST /api/import-batches/{id}/project` | Proyección del lote al grafo. |
| 6 | Proyectar operativo | `POST /api/import-batches/{id}/project-operational` | Proyección operativa al grafo. |
| 7 | Grafo | `GET /api/import-batches/{id}/graph` | Subgrafo de trazabilidad del lote. |
| 8 | Consistencia | `POST /api/import-batches/{id}/run-consistency` | Motor de consistencia / alertas. |
| 9 | Alertas | `GET /api/import-batches/{id}/alerts` | Observaciones técnicas/documentales. |
| 10 | Huella legal | `GET /api/import-batches/{id}/legal-footprint/summary` | Resumen técnico de la huella. |
| 11 | Snapshot | `POST /api/import-batches/{id}/legal-footprint/snapshot` | Snapshot con `verification_code` y `footprint_hash`. |
| 12 | Verificar por código | `GET /api/legal-footprints/verify/{verificationCode}` | Verificación pública compacta (QR/API). |
| 13 | Resumen backend | `GET /api/demo/backend-summary` | Estado del backend `READY_FOR_DEMO`. |

## Comandos de ejemplo

```bash
# 1. Health
curl http://127.0.0.1:8000/api/health

# 2. Crear batch
curl -X POST http://127.0.0.1:8000/api/import-batches \
  -H "Content-Type: application/json" \
  -d '{"batch_code":"S6-DEMO","name":"Demo Sprint 6","import_type":"LIBRO_OPERACIONES_TALA"}'

# 3. Normalizar demo
curl -X POST http://127.0.0.1:8000/api/import-batches/1/normalize-demo \
  -H "Content-Type: application/json" \
  -d '{"rows":[{"tree_code":"T-1","species":"Caoba","volume_m3":1.5},{"tree_code":"T-2","species":"Cedro","volume_m3":2.0}]}'

# 4-6. Persistir y proyectar
curl -X POST http://127.0.0.1:8000/api/import-batches/1/persist
curl -X POST http://127.0.0.1:8000/api/import-batches/1/project
curl -X POST http://127.0.0.1:8000/api/import-batches/1/project-operational

# 7-9. Grafo, consistencia, alertas
curl http://127.0.0.1:8000/api/import-batches/1/graph
curl -X POST http://127.0.0.1:8000/api/import-batches/1/run-consistency
curl http://127.0.0.1:8000/api/import-batches/1/alerts

# 10. Huella legal (summary)
curl http://127.0.0.1:8000/api/import-batches/1/legal-footprint/summary

# 11. Snapshot -> copiar verification_code
curl -X POST http://127.0.0.1:8000/api/import-batches/1/legal-footprint/snapshot

# 12. Verificación pública por código
curl http://127.0.0.1:8000/api/legal-footprints/verify/HLF-1-XXXXXXXX

# 13. Resumen backend
curl http://127.0.0.1:8000/api/demo/backend-summary
```

## Endpoints principales

- **Salud:** `/api/health`
- **Lotes:** `/api/import-batches`
- **Grafo:** `/api/import-batches/{id}/graph`
- **Huella legal:** `/api/import-batches/{id}/legal-footprint` (+ `/summary`)
- **Consistencia:** `/api/import-batches/{id}/run-consistency`, `/alerts`
- **Snapshot:** `/api/import-batches/{id}/legal-footprint/snapshot`
- **Verificación pública:** `/api/legal-footprints/verify/{verificationCode}`
- **Resumen backend:** `/api/demo/backend-summary`

## Qué mostrar al jurado (desde backend/API)

1. **Interoperabilidad:** un lote crudo se normaliza y persiste como registros
   operativos (pasos 2-4).
2. **Trazabilidad:** la cadena se proyecta a un grafo navegable (pasos 5-7).
3. **Consistencia:** el motor detecta observaciones técnicas/documentales sin
   declarar legalidad (pasos 8-9).
4. **Huella legal:** un resumen técnico con estado y score (paso 10).
5. **Verificación pública:** un snapshot con `verification_code` + `footprint_hash`
   verificable por cualquiera mediante el endpoint público, con disclaimer
   visible (pasos 11-12). Listo para QR en otra capa.
6. **Estado general:** `backend-summary` confirma `READY_FOR_DEMO` (paso 13).

## Pendientes backend post-hackathon

- Generación real de QR y portal público de verificación (frontend).
- Firma criptográfica / anclaje externo del snapshot (hoy es sello local).
- Historial y comparación de snapshots por lote.
- Disparo automático del motor de consistencia dentro del flujo de ingesta.
- Más reglas de discrepancia y cruces de la cadena forestal.
- Autenticación/roles sobre los endpoints de escritura.
