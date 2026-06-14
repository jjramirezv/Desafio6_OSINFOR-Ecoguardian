# Modelo de datos inicial — Sprint 1

Este documento describe las tablas creadas en el Sprint 1. El modelo se divide
en tres bloques: **SaaS base**, **dominio forestal** y **modelo de evidencia /
grafo**.

Convenciones comunes:

- Toda tabla tiene `id` (bigint autoincremental) y `created_at` / `updated_at`.
- Las columnas `metadata` y `payload` son `jsonb` (PostgreSQL) y guardan
  información flexible sin alterar el esquema.
- Los estados (`status`) son cadenas controladas a nivel de aplicación.

## Bloque SaaS base

### `roles`

Roles del sistema (p. ej. administrador, analista). Base para el control de
acceso que se implementará en sprints posteriores.

### `permissions`

Permisos granulares que podrán asociarse a roles. Aún no se aplican en runtime.

### `organizations`

Organizaciones / tenants del SaaS. Tipos previstos: OSINFOR, productor, regente,
CTP, comprador, puesto de control, entidad pública, comunidad nativa. Campos
clave: `name`, `code`, `type`, `ruc`, `status`, `metadata`.

### `organization_users`

Tabla puente entre usuarios y organizaciones (pertenencia y rol dentro de cada
organización). Sustenta el modelo multi-tenant.

### `audit_logs`

Registro de auditoría de acciones relevantes sobre las entidades del sistema.

## Bloque dominio forestal

### `forest_titles`

Títulos habilitantes (p. ej. permiso forestal). Campos: `organization_id`
(opcional), `code` (único), `name`, `holder_name`, `title_type`, `status`,
`metadata`.

### `operational_plans`

Planes operativos asociados a un título habilitante. Campos: `forest_title_id`,
`code`, `name`, `period_start`, `period_end`, `status`, `approved_volume`,
`metadata`. Único por (`forest_title_id`, `code`).

### `cutting_parcels`

Parcelas de corta dentro de un plan operativo. Campos: `operational_plan_id`,
`code`, `name`, `authorized_trees_count`, `authorized_volume`, `status`,
`metadata`. Único por (`operational_plan_id`, `code`).

### `census_trees`

Árboles censados en una parcela. Campos: `cutting_parcel_id`, `tree_code`,
`species`, `scientific_name`, `authorized_volume`, `diameter`, `height`,
`status`, `metadata`. Estados previstos: DISPONIBLE, TALADO, TROZADO,
DESPACHADO, OBSERVADO, DESCARTADO, SIN_TRAZABILIDAD. Único por
(`cutting_parcel_id`, `tree_code`).

## Bloque modelo de evidencia / grafo

### `source_systems`

Sistemas fuente de información (SIGOsfc, alertas OSINFOR, censo forestal, libro
de operaciones, balance de extracción, GTF, CTP, etc.). Campos: `name`, `code`
(único), `type`, `description`, `integration_type`, `status`, `metadata`. El
`integration_type` indica el modo previsto: MANUAL_UPLOAD, API_FUTURE,
SIMULATED o SYSTEM_REFERENCE. En Sprint 1 ningún sistema externo se consume en
tiempo real.

### `source_records`

Registros crudos provenientes de un sistema fuente (la materia prima que luego
se proyecta sobre el dominio y el grafo). Se poblará con los importadores de
sprints futuros.

### `documents`

Documentos asociados a entidades del dominio (actos, planos, guías, etc.).

### `document_hashes`

Hashes de los documentos. Base para la futura inmutabilidad por cadena de
hashes; en Sprint 1 solo existe la estructura.

### `trace_nodes`

Nodos del grafo de evidencia. Campos: `node_type`, `label`, `entity_table`,
`entity_id` (referencia polimórfica opcional a la entidad de dominio que
respalda el nodo), `status`, `metadata`. Tipos de nodo: ENTIDAD,
TITULO_HABILITANTE, PLAN_OPERATIVO, PARCELA, ARBOL, DOCUMENTO, EVENTO, LOTE,
ALERTA, HASH, GTF, BALANCE, CTP, COMPRADOR, PUESTO_CONTROL.

### `trace_edges`

Relaciones dirigidas entre nodos. Campos: `source_node_id`, `target_node_id`,
`relation_type`, `status`, `metadata`. Único por (`source_node_id`,
`target_node_id`, `relation_type`). Tipos de relación: POSEE, AMPARA, AUTORIZA,
CONTIENE, ORIGINA, REGISTRA, MOVILIZA_CON, CONTRASTA_CON, TRANSFORMA_EN,
GENERA_ALERTA, TIENE_DISCREPANCIA, SELLADO_POR, VERIFICADO_POR, CONSULTADO_POR.

### `trace_events`

Eventos de trazabilidad sobre el grafo o las entidades. Campos: `event_type`,
`entity_type`, `entity_id`, `source_system_id`, `payload`. Ejemplo cargado por
el seed: `GRAFO_SEMILLA_CREADO`.

## Relaciones principales

```txt
organizations 1───* forest_titles
forest_titles 1───* operational_plans
operational_plans 1───* cutting_parcels
cutting_parcels 1───* census_trees

trace_nodes *───* trace_nodes   (vía trace_edges)
trace_nodes  ·····>  entidad de dominio   (entity_table + entity_id)
source_systems 1───* source_records
source_systems 1───* trace_events
documents 1───* document_hashes
```
