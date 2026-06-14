# Sprint 1 — Plataforma base y modelo de evidencia

## Objetivo

Dejar lista la plataforma base del SaaS de trazabilidad forestal **Huella Legal
Forestal** (reto OSINFOR): una API Laravel funcional, la base de datos
multi-tenant y forestal modelada, el modelo de evidencia en grafo y un caso
demo cargado (CCNN Bélgica) que pueda consultarse vía endpoints JSON.

Sprint 1 es de **fundaciones**: no incluye autenticación, importadores reales,
ni verificación automática de legalidad. Prepara el terreno para que el frontend
construya el dashboard inicial y el grafo visual semilla.

## Alcance

Incluido en Sprint 1:

- API Laravel mínima y modular.
- Configuración para PostgreSQL / Supabase.
- Migraciones SaaS base (roles, permisos, organizaciones, auditoría).
- Migraciones forestales (títulos, planes, parcelas, árboles).
- Migraciones del modelo de evidencia (sistemas fuente, documentos, grafo).
- Seed demo del caso CCNN Bélgica.
- Endpoints base de consulta (solo lectura).
- Documentación oficial del sprint.

Fuera de alcance (no implementado todavía):

- Autenticación / autorización.
- Importadores de datos (SIGOsfc, censo, libro de operaciones, etc.).
- Verificación automática de legalidad.
- Inmutabilidad por cadena de hashes (hash chain).
- Frontend.
- Integraciones reales con sistemas externos.

## Módulos implementados

El backend usa una estructura modular bajo `app/Modules/<Modulo>` con
subcarpetas `Controllers/`, `Models/`, `Requests/`, `Resources/`, `Services/`.
En Sprint 1 se usan estos módulos:

- **Evidence** — sistemas fuente del modelo de evidencia.
- **Forest** — dominio forestal (títulos, planes, parcelas, árboles).
- **TraceGraph** — grafo de trazabilidad (nodos, relaciones, grafo semilla).

El resto de módulos existen como andamiaje vacío para sprints posteriores.

## Migraciones creadas

Base SaaS:

- `roles`
- `permissions`
- `organizations`
- `organization_users`
- `audit_logs`

Dominio forestal:

- `forest_titles`
- `operational_plans`
- `cutting_parcels`
- `census_trees`

Modelo de evidencia y grafo:

- `source_systems`
- `source_records`
- `documents`
- `document_hashes`
- `trace_nodes`
- `trace_edges`
- `trace_events`

El detalle de cada tabla está en [modelo-inicial](../base-datos/modelo-inicial.md).

## Seed demo

`DemoCcnnBelgicaSeeder` carga de forma **idempotente** el caso demo
**CCNN Bélgica**:

- Organizaciones: OSINFOR Demo y CCNN Bélgica.
- Sistemas fuente de referencia (SIGOsfc, alertas, censo, etc.).
- Estructura forestal: Permiso Forestal → PO 19 → PC 01/02/03 → Árbol 3403.
- Grafo semilla con sus nodos y relaciones en `trace_nodes` / `trace_edges`.
- Un evento de trazabilidad `GRAFO_SEMILLA_CREADO`.

Al ser idempotente, puede ejecutarse varias veces sin duplicar filas.

## Endpoints creados

Todos son **GET, de solo lectura y sin autenticación**. Los listados responden
con `{ "data": [...], "meta": { "total": N } }`.

| Método | Ruta                     | Descripción                          |
| ------ | ------------------------ | ------------------------------------ |
| GET    | `/api/health`            | Estado del servicio.                 |
| GET    | `/api/source-systems`    | Sistemas fuente.                     |
| GET    | `/api/forest-titles`     | Títulos habilitantes + organización. |
| GET    | `/api/operational-plans` | Planes operativos.                   |
| GET    | `/api/cutting-parcels`   | Parcelas de corta.                   |
| GET    | `/api/census-trees`      | Árboles censados.                    |
| GET    | `/api/trace/nodes`       | Nodos del grafo.                     |
| GET    | `/api/trace/edges`       | Relaciones del grafo.                |
| GET    | `/api/graph/seed`        | Grafo semilla listo para frontend.   |

`/api/graph/seed` devuelve `{ nodes, edges, meta }` leídos siempre desde
`trace_nodes` y `trace_edges` (no hardcodeado).

## Cómo probar

Requisitos: PHP, Composer y una base PostgreSQL/Supabase configurada en `.env`.

```bash
cd backend
composer install
php artisan migrate:fresh --seed
php artisan serve
```

Listar rutas registradas:

```bash
php artisan route:list
```

Consultar endpoints (servidor en `http://127.0.0.1:8000`):

```bash
curl http://127.0.0.1:8000/api/health
curl http://127.0.0.1:8000/api/source-systems
curl http://127.0.0.1:8000/api/graph/seed
```

`GET /api/graph/seed` debe devolver nodos y relaciones provenientes de la base
de datos (el caso CCNN Bélgica).

## Pendientes para Sprint 2

- Autenticación y control de acceso multi-tenant.
- Importadores de datos desde fuentes (carga manual / archivos).
- Reglas de consistencia y generación de alertas.
- Inmutabilidad mediante cadena de hashes (hash chain) sobre documentos/eventos.
- Endpoints de escritura y de consulta avanzada del grafo.
- Frontend del dashboard y del grafo visual.
