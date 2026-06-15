# Frontend — Huella Legal Forestal (demo)

Demo visual React + Vite que consume el backend Laravel y ejecuta el flujo
completo de verificación técnica: lote → normalizar → persistir → proyectar →
consistencia → huella → snapshot → verificación pública → grafo.

> Esta verificación no certifica legalidad; resume trazabilidad técnica,
> consistencia documental y alertas registradas.

## Requisitos
- Node 18+ (probado con Node 24)
- Backend corriendo (por defecto en `http://127.0.0.1:8123/api`)

## Configuración
Copia `.env.example` a `.env.local` y ajusta la URL si tu backend usa otro puerto:

```
cp .env.example .env.local
# VITE_API_BASE_URL=http://127.0.0.1:8123/api
```

## Ejecutar
```
npm install
npm run dev      # abre http://localhost:5173 (o 5174 si el puerto está ocupado)
```

Build de producción: `npm run build` (sale en `dist/`).

## Uso
1. Clic en **Verificar backend** (badge pasa a `READY_FOR_DEMO`).
2. Clic en **▶ Ejecutar todo** o los pasos uno a uno en orden.
3. Revisa los paneles de Huella, Verificación pública, Grafo y Log.

## Estructura
- `src/api.js` — cliente fetch con los 11 endpoints reales y los bodies demo.
- `src/App.jsx` — página única con todas las secciones.
- `src/styles.css` — estilos (colores por estado: TRACEABLE/OBSERVED/INCOMPLETE/ERROR).

No incluye login ni CRUD: es solo una demo de verificación para el jurado.
