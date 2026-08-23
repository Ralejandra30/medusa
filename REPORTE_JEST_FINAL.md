# Reporte Final de Jest — Validación Exitosa de Pruebas Unitarias

- **Proyecto:** `medusa-monorepo` (paquete `@medusajs/medusa`)
- **SonarQube:** http://localhost:9001
- **Dashboard:** http://localhost:9001/dashboard?id=medusa-monorepo
- **Fecha de validación:** 2026-08-23
- **Reportes previos:** [`REPORTE_JEST_INICIAL.md`](./REPORTE_JEST_INICIAL.md) · [`REPORTE_SONARQUBE_FINAL.md`](./REPORTE_SONARQUBE_FINAL.md)

---

## 1. Resumen ejecutivo

| Indicador | Resultado | Estado |
|---|---|---|
| Pruebas unitarias ejecutadas | **207** (0 fallos en las suites nuevas y en los flujos validados¹) | ✅ |
| Cobertura de Código Nuevo (`new_coverage`) en SonarQube | **96.9 %** (umbral: 80 %) | ✅ Superado |
| Quality Gate (`medusa-monorepo`) | **PASSED / OK** | ✅ |
| `new_duplicated_lines_density` | 0.0 % (≤ 3 %) | ✅ |
| `new_violations` | 0 | ✅ |

> ¹ Las suites con fallo que persisten son **pre-existentes y ambientales** (rutas Windows `\` vs `/`
> y ausencia de la dependencia `supertest`, ver §5). Ninguna está relacionada con el código
> modificado ni con los tests incorporados en esta intervención.

Confirmación del Quality Gate vía API:

```json
// GET http://localhost:9001/api/qualitygates/project_status?projectKey=medusa-monorepo
{
  "projectStatus": {
    "status": "OK",
    "conditions": [
      { "metricKey": "new_coverage",                 "status": "OK", "actualValue": "96.9" },
      { "metricKey": "new_duplicated_lines_density", "status": "OK", "actualValue": "0.0" },
      { "metricKey": "new_violations",               "status": "OK", "actualValue": "0" }
    ]
  }
}
```

---

## 2. Suites de pruebas creadas

Se incorporaron **14 archivos de test nuevos + 1 extendido**, todos en verde:

| # | Archivo | Alcance |
|---|---|---|
| 1 | `src/commands/__tests__/start.spec.ts` *(extendido)* | Helper `parseValueOrPercentage`: ramas de `Number.parseInt`, `Number.parseFloat`, `Number.isNaN`, porcentajes, rangos inválidos, valores no string |
| 2 | `src/api/admin/orders/__tests__/validators.spec.ts` | Conversión de `version` (`z.preprocess` + `Number.parseInt`) |
| 3 | `src/api/admin/inventory-items/__tests__/validators.spec.ts` | Conversión de `weight`, `length`, `height`, `width` y operator maps |
| 4 | `src/api/admin/reservations/__tests__/validators.spec.ts` | Conversión de `quantity` y strict mode del payload |
| 5 | `src/api/admin/uploads/__tests__/middlewares.spec.ts` | Configuración multer con límite de 50 MB |
| 6 | `src/api/admin/products/__tests__/middlewares.spec.ts` | Registro de middlewares de rutas admin de productos |
| 7 | `src/api/admin/workflows-executions/__tests__/subscribe-routes.spec.ts` | Rutas SSE: `randomUUID()`, cabeceras event-stream, unsubscribe |
| 8 | `src/api/utils/middlewares/products/__tests__/set-pricing-context.spec.ts` | Poblado del pricing context con customer groups (`forEach`) |
| 9 | `src/api/admin/promotions/utils/__tests__/validate-rule-type.spec.ts` | `replaceAll("-","_")` y rechazo de tipos inválidos |
| 10 | `src/api/admin/promotions/__tests__/rule-type-route.spec.ts` | Hidratación de reglas vía remoteQuery (`attr.id === attribute`) |
| 11 | `src/api/admin/rbac/me/permissions/__tests__/route.spec.ts` | Orden estable con `localeCompare` y respuesta sin actor |
| 12 | `src/commands/__tests__/mcloud.spec.ts` | Resolución absoluta del binario `mcloud` y proxy |
| 13 | `src/instrumentation/__tests__/http-layer.spec.ts` | Registro de `requestHandlerTracing.handler` |
| 14 | `src/loaders/__tests__/api-loader.spec.ts` | Envoltura de errores de registro de rutas (`throw new Error`) |
| 15 | `src/commands/__tests__/cli-hardening.spec.ts` | `app.disable("x-powered-by")` en comandos `exec` y `user` |

Resultado de la ejecución final:

```
Test Suites: 35 passed (+4 pre-existentes fallando, ver §5)
Tests:       201 passed, 6 failed (pre-existentes), 207 total
Snapshots:   0 total
Time:        ~80 s
```

Cobertura por archivo objetivo (LCOV final):

| Archivo | Líneas cubiertas | Cobertura |
|---|---|---|
| `api/admin/inventory-items/validators.ts` | 175/175 | **100.0 %** |
| `api/admin/orders/validators.ts` | 185/191 | **96.9 %** |
| `api/admin/reservations/validators.ts` | 54/54 | **100.0 %** |
| `api/admin/uploads/middlewares.ts` | 74/74 | **100.0 %** |
| `api/admin/products/middlewares.ts` | 435/445 | **97.8 %** |
| `commands/start.ts` | 128/435 | 29.4 %² |

> ² El resto de `start.ts` corresponde al bootstrap completo del servidor (cluster, HTTP,
> loaders), fuera del alcance de pruebas unitarias ligeras; las líneas nuevas modificadas
> por el refactor sí quedaron cubiertas.

---

## 3. Fix técnico aplicado en `jest.config.js`

### 3.1 Problema detectado

Con la configuración original, la cobertura reportada era **incorrecta**: líneas ejecutadas
en runtime aparecían como no cubiertas (p. ej. los callbacks `z.preprocess` de los
validadores, o la función `parseValueOrPercentage` llamada 15 veces sin registrar hits).

Evidencia (LCOV defectuoso):

```
FN:39,_interop_require_default        ← helpers del transform CJS instrumentados
FN:44,_getRequireWildcardCache
FN:88,parseValueOrPercentage          ← ¡declarada realmente en start.ts:38!
FNDA:15,parseValueOrPercentage        ← se ejecutó 15 veces, pero...
DA:45,0                               ← ...los hits caían en líneas desplazadas (~+50)
```

**Causa raíz:** con `@swc/jest`, el plugin WASM `swc-plugin-coverage-instrument`
instrumentaba el código **después** de la transformación a CommonJS. Los contadores de
Istanbul quedaban referenciando las líneas del código transpilado (con los offsets que
introducen `_interop_require_default` y compañía), **sin remapeo via source-maps** hacia el
`.ts` original.

### 3.2 Solución

```diff
 // packages/medusa/jest.config.js
 module.exports = {
-  transform: { "^.+\\.[jt]s?$": "@swc/jest" },
+  transform: { "^.+\\.[jt]s?$": ["@swc/jest", { sourceMaps: true }] },
+  coverageProvider: "v8",
   ...
 }
```

1. **`sourceMaps: true`** — garantiza que el transform emita sourcemaps utilizables.
2. **`coverageProvider: "v8"`** — sustituye la instrumentación estática de Istanbul por
   cobertura V8 recolectada en runtime, que se remapa al fuente original mediante los
   sourcemaps inline de SWC (`v8-to-istanbul`).

### 3.3 Verificación del fix

Después del cambio, las mismas suites producen LCOV fiel al fuente:

```
DA:38,1     ← declaración parseValueOrPercentage
DA:39,15    ← 15 invocaciones reales registradas en su línea correcta
DA:45,8     ← rama de porcentaje cubierta
DA:55,5     ← rama Number.isNaN(num) cubierta
```

Impacto directo sobre `new_coverage` en SonarQube: **70.3 % → 96.9 %** con el mismo
conjunto de pruebas, únicamente corrigiendo la atribución de líneas.

---

## 4. Pipeline de validación ejecutado

```powershell
# 1) Suite completa con cobertura (desde packages/medusa)
cd packages/medusa
npx jest --coverage --collectCoverageFrom="src/**/*.ts"

# 2) Normalización de rutas del LCOV a la estructura del monorepo
#    SF:src\...\file.ts  →  SF:packages/medusa/src/.../file.ts

# 3) SonarQube Scanner (desde la raíz)
$env:NODE_OPTIONS="--max-old-space-size=2048"
$env:SONARQUBE_SCANNER_PARAMS='{"sonar.host.url":"http://localhost:9001","sonar.token":"sqp_***"}'
npx sonarqube-scanner
# ANALYSIS SUCCESSFUL — Analysis total time: 12:56 s
```

Evolución del indicador durante la intervención:

| Escaneo | `new_coverage` | QG | Nota |
|---|---|---|---|
| Inicial (sin suite ejecutable) | 57.6 %* | ERROR | Sin cobertura fiable |
| Post-tests + LCOV mal mapeado | 70.3 % → 71.9 % | ERROR | Atribución de líneas incorrecta |
| **Final (fix v8 + sourcemaps)** | **96.9 %** | **PASSED** | ✅ Umbral 80 % superado |

\* Valor de referencia del punto de partida solicitado.

---

## 5. Fallos pre-existentes (fuera de alcance)

Las siguientes suites ya fallaban **antes** de esta intervención y no fueron modificadas;
sus causas son ambientales (Windows / dependencias), no de regresión:

| Suite | Causa |
|---|---|
| `src/loaders/__tests__/search.spec.ts` | Expectativa de rutas POSIX (`/app/search`) vs Windows (`\app\search`) |
| `src/commands/__tests__/run-scripts.spec.ts` | Ídem (`\app\workflows` vs `/app/workflows`) |
| `src/commands/plugin/db/integration-tests/__tests__/plugin-generate.spec.ts` | Mensajería del logger en generación de migraciones |
| `src/instrumentation/__tests__/index.spec.ts` | Módulo `supertest` no instalado en el workspace |

Recomendación futura: normalizar rutas con `path.join`/`path.sep` en esos tests y añadir
`supertest` como devDependency si se desea llevar la suite al 100 % verde.

---

## 6. Conclusión

✅ **207 pruebas unitarias** ejecutadas con las suites nuevas al 100 % en verde.
✅ **`new_coverage` = 96.9 %**, superando holgadamente el umbral del 80 %.
✅ **Quality Gate: PASSED** confirmado programáticamente en http://localhost:9001.
✅ Fix estructural documentado (`coverageProvider: "v8"` + `sourceMaps`) que corrige de raíz
la medición de cobertura para todo el paquete, no solo para este análisis.
