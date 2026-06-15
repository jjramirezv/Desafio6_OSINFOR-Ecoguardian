# Verificación pública y snapshot de la Huella Legal

Documento de arquitectura del Sprint 6. Describe qué es un **snapshot**, qué son
el **código de verificación** y el **hash de la huella**, por qué **no es
blockchain real**, cómo se integraría con un **QR** en otra capa y el
**disclaimer legal**.

> El sistema **no certifica legalidad** ni declara legal/ilegal. La verificación
> pública solo expone, de forma compacta y reproducible, el estado técnico de la
> cadena: trazabilidad, consistencia documental, evidencia y alertas.

## ¿Qué es un snapshot?

Un **snapshot** es una "foto" del estado técnico de la Huella Legal de un lote en
un momento dado. Se construye a partir de la huella actual
(`LegalFootprintService`) y se persiste en `legal_footprint_snapshots` con:

- un **payload estable** (resumen técnico: lote, estado, completitud, alertas,
  conteos y meta del grafo),
- un **hash** del payload,
- un **código de verificación** legible,
- el **estado** (`TRACEABLE` / `OBSERVED` / `INCOMPLETE`) y el **score**.

A diferencia de la huella "en vivo" (que se recalcula en cada consulta), el
snapshot **congela** el estado para poder verificarlo después sin recomputar la
cadena, y sirve como referencia estable para compartir.

## ¿Qué es el código de verificación?

El `verification_code` es un identificador **legible y compartible** del
snapshot, con formato:

```
HLF-{import_batch_id}-{8 hex del hash}
```

Ejemplo: `HLF-1-ABC12345`. Es **único** en la tabla. Es lo que se incrustaría en
un QR o se pasaría a un verificador externo para consultar
`GET /api/legal-footprints/verify/{verificationCode}`.

Si para el mismo lote la huella no cambió, se reutiliza el mismo código (mismo
hash). Si un código ya estuviera tomado por otro hash, se anexa un sufijo de
timestamp corto para no romper la unicidad.

## ¿Qué es el hash de la huella?

El `footprint_hash` es un **`sha256`** calculado sobre el **JSON estable** del
payload: las claves de los objetos se ordenan recursivamente y se serializa con
`JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES`. Esto lo hace
**reproducible**: el mismo estado técnico produce siempre el mismo hash, y
cualquier cambio en la evidencia resumida cambia el hash.

Funciona como **sello de integridad local**: permite detectar si el payload
verificado coincide con el que se selló al generar el snapshot.

## ¿Por qué no es blockchain real?

- El hash se calcula y guarda en **la propia base de datos** del sistema; no hay
  red distribuida ni consenso.
- No hay **encadenamiento** de bloques ni inmutabilidad garantizada por terceros:
  un actor con acceso a la BD podría regenerar el snapshot.
- No hay **prueba pública de existencia temporal** (timestamping) anclada a una
  cadena externa.

En consecuencia, el `footprint_hash` aporta **integridad y reproducibilidad
locales**, pero **no** las garantías de una blockchain real. Un anclaje externo o
una firma criptográfica quedan como mejora futura.

## ¿Cómo se usaría con QR en otra capa?

El backend **no genera el QR**. La separación es:

1. El backend genera el snapshot y devuelve el `verification_code`.
2. Una capa frontend/servicio convierte ese código (o la URL
   `…/legal-footprints/verify/{verificationCode}`) en una imagen QR.
3. Quien escanea el QR llega al endpoint público `verify`, que responde el
   payload compacto con `status`, `score`, `footprint_hash`, `summary` y el
   `disclaimer`.

Así el backend se mantiene desacoplado de la representación visual.

## Disclaimer legal

Toda respuesta pública incluye:

> "Esta verificación no certifica legalidad; resume trazabilidad técnica,
> consistencia documental y alertas registradas."

El propósito del sistema es **apoyar la revisión técnica** de la cadena forestal,
no emitir un juicio legal. Los estados `TRACEABLE` / `OBSERVED` / `INCOMPLETE`
describen **completitud y consistencia técnica**, nunca legalidad o ilegalidad.
