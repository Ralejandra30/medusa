# Reporte Inicial de SonarQube — Proyecto `medusa-monorepo`

- **SonarQube:** http://localhost:9001
- **Project Key:** `medusa-monorepo`
- **Alcance analizado:** `packages/medusa/src` (según `sonar-project.properties`)
- **Fecha del análisis:** 2026-08-23
- **Hallazgos documentados:** **11 Vulnerabilidades** + **21 Bugs** = 32 issues

> Nota: los "21 bugs" corresponden a las issues con impacto de fiabilidad
> (`SOFTWARE_QUALITY.RELIABILITY`) según el modelo de impactos de SonarQube,
> consultado vía `GET /api/issues/search?componentKeys=medusa-monorepo`.

---

## 1. Vulnerabilidades de Seguridad (11)

### VULN-01 · typescript:S4036 — PATH no confiable al resolver binarios (BLOCKER de contexto)

| Campo | Valor |
|---|---|
| Regla | `typescript:S4036` |
| Archivo | `packages/medusa/src/commands/mcloud.ts` |
| Línea | 11 |
| Severidad | MINOR |
| Mensaje | *Make sure the "PATH" variable only contains fixed, unwriteable directories.* |

**Problema:** `spawnSync("mcloud", ["--version"], { stdio: "ignore" })` resuelve el
binario por nombre simple. El sistema operativo lo busca en cada directorio del
`PATH`; si alguno es escribible por otro usuario, un atacante puede colocar un
binario malicioso llamado `mcloud` (secuestro de PATH / elevación de privilegios).

---

### VULN-02 · typescript:S4036 — PATH no confiable al resolver binarios

| Campo | Valor |
|---|---|
| Regla | `typescript:S4036` |
| Archivo | `packages/medusa/src/commands/mcloud.ts` |
| Línea | 88 |
| Severidad | MINOR |
| Mensaje | *Make sure the "PATH" variable only contains fixed, unwriteable directories.* |

**Problema:** `spawn("mcloud", args, {...})` en `runMcloudProxy()` delega la
ejecución a un binario resuelto por nombre simple a través del `PATH`, heredando
el mismo riesgo de secuestro de ejecutables que VULN-01, pero esta vez con los
argumentos del usuario reenviados al proceso hijo.

---

### VULN-03 · typescript:S4036 — PATH no confiable al resolver binarios

| Campo | Valor |
|---|---|
| Regla | `typescript:S4036` |
| Archivo | `packages/medusa/src/utils/claude-code-plugin.ts` |
| Línea | 40 |
| Severidad | MINOR |
| Mensaje | *Make sure the "PATH" variable only contains fixed, unwriteable directories.* |

**Problema:** `spawnSync("claude", ["plugin", "marketplace", "add", ...])`
resuelve el CLI `claude` mediante búsqueda implícita en `PATH`. Un directorio
escribible al inicio del `PATH` permitiría ejecutar código arbitrario con los
permisos del usuario que invoca la CLI de Medusa.

---

### VULN-04 · typescript:S4036 — PATH no confiable al resolver binarios

| Campo | Valor |
|---|---|
| Regla | `typescript:S4036` |
| Archivo | `packages/medusa/src/utils/claude-code-plugin.ts` |
| Línea | 48 |
| Severidad | MINOR |
| Mensaje | *Make sure the "PATH" variable only contains fixed, unwriteable directories.* |

**Problema:** `spawnSync("claude", ["plugin", "install", PLUGIN_ID], ...)` repite
el patrón inseguro de resolución por nombre simple dentro de `runInstall()`.

---

### VULN-05 · typescript:S5689 — Divulgación de versión del framework

| Campo | Valor |
|---|---|
| Regla | `typescript:S5689` |
| Archivo | `packages/medusa/src/commands/exec.ts` |
| Línea | 26 |
| Severidad | MINOR |
| Mensaje | *This framework implicitly discloses version information by default...* |

**Problema:** La app Express creada en el comando `exec` emite por defecto la
cabecera `X-Powered-By: Express`, revelando tecnología y versión exactas.
Esta información facilita el reconocimiento previo (fingerprinting) para
atacar vulnerabilidades conocidas de esa versión concreta.

---

### VULN-06 · typescript:S5689 — Divulgación de versión del framework

| Campo | Valor |
|---|---|
| Regla | `typescript:S5689` |
| Archivo | `packages/medusa/src/commands/user.ts` |
| Línea | 19 |
| Severidad | MINOR |
| Mensaje | *This framework implicitly discloses version information by default...* |

**Problema:** Igual que VULN-05: `const app = express()` sin deshabilitar la
cabecera `X-Powered-By` en el comando de creación de usuarios/invitaciones.

---

### VULN-07 · typescript:S5689 — Divulgación de versión del framework

| Campo | Valor |
|---|---|
| Regla | `typescript:S5689` |
| Archivo | `packages/medusa/src/commands/start.ts` |
| Línea | 246 |
| Severidad | MINOR |
| Mensaje | *This framework implicitly discloses version information by default...* |

**Problema:** El servidor principal (`start`) crea la app Express sin desactivar
`X-Powered-By`. Es el punto más crítico de los tres porque expone la cabecera
en **todas** las respuestas HTTP de producción.

---

### VULN-08 · typescript:S5693 — Límite de longitud de contenido no seguro

| Campo | Valor |
|---|---|
| Regla | `typescript:S5693` |
| Archivo | `packages/medusa/src/api/admin/products/middlewares.ts` |
| Línea | 39 |
| Severidad | MAJOR |
| Mensaje | *Make sure the content length limit is safe here.* |

**Problema:** `multer({ storage: multer.memoryStorage() })` se configura sin
`limits`. Las subidas (p. ej. importación CSV en `/admin/products/import`) se
cargan completas en memoria sin cota de tamaño, permitiendo a un usuario
autenticado agotar la memoria del servidor con archivos gigantes
(Denial of Service por agotamiento de memoria).

---

### VULN-09 · typescript:S5693 — Límite de longitud de contenido no seguro

| Campo | Valor |
|---|---|
| Regla | `typescript:S5693` |
| Archivo | `packages/medusa/src/api/admin/uploads/middlewares.ts` |
| Línea | 14 |
| Severidad | MAJOR |
| Mensaje | *Make sure the content length limit is safe here.* |

**Problema:** Mismo patrón en `/admin/uploads`: almacenamiento en memoria sin
límite de `fileSize`. Cada petición de subida puede asignar memoria sin control
hasta agotar el heap del proceso Node.js.

---

### VULN-10 · typescript:S2245 — Uso de PRNG no criptográfico (`Math.random`)

| Campo | Valor |
|---|---|
| Regla | `typescript:S2245` |
| Archivo | `packages/medusa/src/api/admin/workflows-executions/[workflow_id]/subscribe/route.ts` |
| Línea | 19 |
| Severidad | MAJOR |
| Mensaje | *Make sure that using this pseudorandom number generator is safe here.* |

**Problema:** `const subscriberId = "__sub__" + Math.random().toString(36).substring(2, 9)`
genera el identificador de suscripción SSE con un PRNG MWC1616 predecible y con
solo ~35 bits de entropía efectiva. Los IDs pueden adivinarse o colisionar,
permitiendo suplantar suscripciones de ejecuciones de workflows ajenas.

---

### VULN-11 · typescript:S2245 — Uso de PRNG no criptográfico (`Math.random`)

| Campo | Valor |
|---|---|
| Regla | `typescript:S2245` |
| Archivo | `packages/medusa/src/api/admin/workflows-executions/[workflow_id]/[transaction_id]/subscribe/route.ts` |
| Línea | 19 |
| Severidad | MAJOR |
| Mensaje | *Make sure that using this pseudorandom number generator is safe here.* |

**Problema:** Idéntico a VULN-10, en la variante de la ruta con
`[transaction_id]` para suscribirse al progreso de una transacción específica.

---

## 2. Bugs (21)

> Severidades: CRITICAL ×2 · MAJOR ×2 · MINOR ×17

### BUG-01 · typescript:S2871 — `sort()` sin función de comparación [CRITICAL]

| Campo | Valor |
|---|---|
| Regla | `typescript:S2871` |
| Archivo | `packages/medusa/src/api/admin/rbac/me/permissions/route.ts` |
| Línea | 97 |
| Severidad | CRITICAL |

**Problema:** `Array.from(granted).sort()` ordena los permisos lexicográficamente
por unidades de código UTF-16. Con identificadores que contienen mayúsculas,
números o caracteres especiales el orden es impredecible e inconsistente entre
ejecuciones/clientes, rompiendo la comparación determinista de sets de permisos
que la propia API promete en su documentación.

---

### BUG-02 · typescript:S6861 — Exportación de binding mutable con `var` [CRITICAL]

| Campo | Valor |
|---|---|
| Regla | `typescript:S6861` |
| Archivo | `packages/medusa/src/commands/start.ts` |
| Línea | 106 |
| Severidad | CRITICAL |

**Problema:** `export var traceRequestHandler: (...) => Promise<any>` exporta un
binding mutable creado con `var` (hoisting, ámbito de función). El módulo de
instrumentación OpenTelemetry reasigna este export en tiempo de ejecución; usar
`var` para una mutable cross-module es frágil y propenso a errores según el modo
de emisión de módulos.

---

### BUG-03 · typescript:S2201 — Retorno de `map()` ignorado

| Campo | Valor |
|---|---|
| Regla | `typescript:S2201` |
| Archivo | `packages/medusa/src/api/utils/middlewares/products/set-pricing-context.ts` |
| Línea | 67 |
| Severidad | MAJOR |

**Problema:** `customerGroups.map((cg) => pricingContext.customer?.groups?.push(...))`
usa `map` como si fuera un bucle, descartando el array resultante. Semánticamente
confuso y genera allocations innecesarias en cada petición de precios.

---

### BUG-04 · typescript:S1764 — Subexpresiones idénticas en operador `||`

| Campo | Valor |
|---|---|
| Regla | `typescript:S1764` |
| Archivo | `packages/medusa/src/api/admin/promotions/[id]/[rule_type]/route.ts` |
| Línea | 96 |
| Severidad | MAJOR |

**Problema:** Dentro de `ruleAttributes.find(...)`, la condición era
`attr.value === promotionRule.attribute || attr.value === promotionRule.attribute`.
Ambos operandos son idénticos, por lo que el `||` es siempre redundante y la
segunda intención (comparar contra `attr.id`) nunca se evalúa: las reglas
disfrazadas (*disguised rules*) cuyo atributo coincide por `id` dejaban de
encontrarse, silenciando parte de la lógica de transformación de reglas de
promoción.

---

### BUG-05..08 · typescript:S7773 — `parseInt`/`parseFloat`/`isNaN` globales en `start.ts`

| Regla | Archivo | Línea | Detalle |
|---|---|---|---|
| S7773 | `packages/medusa/src/commands/start.ts` | 45 | `parseFloat(...)` → preferir `Number.parseFloat` |
| S7773 | `packages/medusa/src/commands/start.ts` | 46 | `isNaN(percent)` → preferir `Number.isNaN` |
| S7773 | `packages/medusa/src/commands/start.ts` | 54 | `parseInt(trimmed, 10)` → preferir `Number.parseInt` |
| S7773 | `packages/medusa/src/commands/start.ts` | 55 | `isNaN(num)` → preferir `Number.isNaN` |

**Problema:** En `parseValueOrPercentage()`, las funciones globales pueden ser
sombreadas (shadowing) o modificadas por polution del prototype/global; las
versiones de `Number` son más seguras, explícitas y no realizan coerción
innecesaria en `Number.isNaN`.

---

### BUG-09..10 · typescript:S7773 — `parseInt` global en validadores de pedidos

| Regla | Archivo | Línea | Detalle |
|---|---|---|---|
| S7773 | `packages/medusa/src/api/admin/orders/validators.ts` | 15 | `parseInt(val)` en preprocess de `version` |
| S7773 | `packages/medusa/src/api/admin/orders/validators.ts` | 32 | `parseInt(val)` en preprocess de `version` (items) |

**Problema:** Uso de la función global en lugar de `Number.parseInt` al
convertir el query param `version` de string a número en esquemas Zod.

---

### BUG-11..14 · typescript:S7773 — `parseFloat` global en validadores de inventory-items

| Regla | Archivo | Línea | Detalle |
|---|---|---|---|
| S7773 | `packages/medusa/src/api/admin/inventory-items/validators.ts` | 26 | `parseFloat` como coercer de `weight` |
| S7773 | `packages/medusa/src/api/admin/inventory-items/validators.ts` | 27 | `parseFloat` como coercer de `length` |
| S7773 | `packages/medusa/src/api/admin/inventory-items/validators.ts` | 28 | `parseFloat` como coercer de `height` |
| S7773 | `packages/medusa/src/api/admin/inventory-items/validators.ts` | 29 | `parseFloat` como coercer de `width` |

**Problema:** Se pasa la referencia global `parseFloat` a `createOperatorMap(...)`;
se debe usar la referencia estática `Number.parseFloat`.

---

### BUG-15 · typescript:S7773 — `parseFloat` global en validadores de reservas

| Regla | Archivo | Línea | Detalle |
|---|---|---|---|
| S7773 | `packages/medusa/src/api/admin/reservations/validators.ts` | 27 | `parseFloat` como coercer de `quantity` |

**Problema:** Igual que BUG-11..14, sobre el filtro numérico `quantity`.

---

### BUG-16..17 · typescript:S7773 — `parseInt` global en validadores compartidos

| Regla | Archivo | Línea | Detalle |
|---|---|---|---|
| S7773 | `packages/medusa/src/api/utils/validators.ts` | 76 | `parseInt(val)` en preprocess de `offset` |
| S7773 | `packages/medusa/src/api/utils/validators.ts` | 88 | `parseInt(val)` en preprocess de `limit` |

**Problema:** Afecta a **todos** los endpoints de listado del admin (paginación
global construida con `createFindParams`).

---

### BUG-18 · typescript:S7723 — `Error()` sin `new`

| Regla | Archivo | Línea |
|---|---|---|
| S7723 | `packages/medusa/src/loaders/api.ts` | 72 |

**Problema:** `throw Error(\`An error occurred while registering API Routes...\`)`.
Llamar al constructor como función funciona en modo sloppy pero produce objetos
con cadena de prototipos inconsistente en algunos entornos/transpilaciones y es
propenso a errores; lo correcto es `throw new Error(...)`.

---

### BUG-19..21 · typescript:S7781 — Patrones de reemplazo de strings frágiles/ineficientes

| Regla | Archivo | Línea | Patrón detectado |
|---|---|---|---|
| S7781 | `packages/medusa/src/utils/generate-resource-policies.ts` | 18 | `replace(/_/g, " ")` |
| S7781 | `packages/medusa/src/api/admin/promotions/[id]/[rule_type]/route.ts` | 28 | `split("-").join("_")` |
| S7781 | `packages/medusa/src/api/admin/promotions/utils/validate-rule-type.ts` | 6 | `split("-").join("_")` |

**Problema:** `String#replace()` con regex global y el truco `split().join()`
son patrones legados, menos legibles y con mayor coste de asignaciones que
`String#replaceAll()` (ES2021), además de ser susceptibles de errores al
mantener las expresiones.

---

## 3. Resumen por regla

| Regla SonarQube | Tipo | Cantidad | Archivos afectados |
|---|---|---|---|
| typescript:S2245 | Vulnerabilidad | 2 | workflows-executions subscribe ×2 |
| typescript:S4036 | Vulnerabilidad | 4 | mcloud.ts ×2, claude-code-plugin.ts ×2 |
| typescript:S5689 | Vulnerabilidad | 3 | exec.ts, user.ts, start.ts |
| typescript:S5693 | Vulnerabilidad | 2 | products/middlewares.ts, uploads/middlewares.ts |
| typescript:S2871 | Bug | 1 | rbac/me/permissions/route.ts |
| typescript:S6861 | Bug | 1 | commands/start.ts |
| typescript:S2201 | Bug | 1 | set-pricing-context.ts |
| typescript:S1764 | Bug | 1 | promotions/[id]/[rule_type]/route.ts |
| typescript:S7723 | Bug | 1 | loaders/api.ts |
| typescript:S7773 | Bug | 13 | orders, inventory-items, reservations, validators, start.ts |
| typescript:S7781 | Bug | 3 | generate-resource-policies.ts, promotions route, validate-rule-type |
| **Total** | | **32** | |

---

## 4. Refactorizaciones aplicadas

| Hallazgo(s) | Corrección aplicada |
|---|---|
| VULN-01..04 (S4036) | Nueva utilidad `packages/medusa/src/utils/resolve-executable.ts` que resuelve el binario a **ruta absoluta** explorando explícitamente el `PATH` (con extensiones PATHEXT en Windows). Usada en `mcloud.ts` y `claude-code-plugin.ts` antes de cada `spawn/spawnSync`. |
| VULN-05..07 (S5689) | `app.disable("x-powered-by")` tras crear la app Express en `exec.ts`, `user.ts` y `start.ts`. |
| VULN-08..09 (S5693) | Nueva constante `DEFAULT_UPLOAD_FILE_SIZE_LIMIT_BYTES` (50 MB) en `utils/middlewares/index.ts` y configuración `limits: { fileSize }` en ambos `multer({ storage: memoryStorage(), limits })`. |
| VULN-10..11 (S2245) | `subscriberId` generado con `crypto.randomUUID()` (`__sub__${randomUUID()}`) en ambas rutas de suscripción SSE. |
| BUG-01 (S2871) | `.sort((a, b) => a.localeCompare(b))` para ordenación alfabética fiable. |
| BUG-02 (S6861) | Sustitución de `export var traceRequestHandler` por el objeto const exportado `requestHandlerTracing = { handler }`; actualizado el consumidor en `instrumentation/index.ts` (misma funcionalidad de instrumentación OTel). |
| BUG-03 (S2201) | `customerGroups.map(...)` → `customerGroups.forEach(...)`. |
| BUG-04 (S1764) | Segundo operando corregido a `attr.id === promotionRule.attribute`, restaurando la búsqueda también por `id` (reglas disfrazadas). |
| BUG-05..17 (S7773) | `parseInt` → `Number.parseInt`, `parseFloat` → `Number.parseFloat`, `isNaN` → `Number.isNaN` (13 puntos). |
| BUG-18 (S7723) | `throw Error(...)` → `throw new Error(...)` en `loaders/api.ts`. |
| BUG-19..21 (S7781) | `replace(/_/g, " ")` → `replaceAll("_", " ")` y `split("-").join("_")` → `replaceAll("-", "_")` (3 puntos). |

**Verificación posterior:** compilación TypeScript del paquete `@medusajs/medusa`
(`tsc --build`) exitosa y formateo Prettier verificado en todos los archivos
modificados.
