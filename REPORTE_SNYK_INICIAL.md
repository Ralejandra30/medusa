# REPORTE INICIAL — Auditoría SCA (Software Composition Analysis) con Snyk

| Campo | Detalle |
|---|---|
| **Proyecto** | Medusa JS Monorepositorio (`medusa`) |
| **Herramienta** | Snyk SCA (`snyk test`) |
| **Organización** | ksant06br |
| **Package Manager** | Yarn (workspaces) |
| **Fuente del hallazgo** | `REPORTE_SNYK_SCA.txt` |
| **Fecha de análisis** | Agosto 2026 |
| **Clasificación** | Confidencial — Uso interno |

---

## 1. Resumen Ejecutivo

Se ejecutó un escaneo de composición de software (SCA) sobre el monorrepositorio de Medusa para
identificar dependencias de terceros con vulnerabilidades conocidas (CVE).

**Métricas globales del escaneo:**

| Métrica | Valor |
|---|---|
| Proyectos analizados | **70** |
| Proyectos con rutas vulnerables | **15** |
| Proyectos limpios | 55 |
| Total de dependencias inspeccionadas (acumulado) | ~7.000+ entradas resolvidas |

Los **15 proyectos afectados** son:

1. `root` (package.json raíz)
2. `@medusajs/admin-bundler`
3. `@medusajs/framework`
4. `@medusajs/modules-sdk`
5. `@medusajs/orchestration`
6. `@medusajs/query`
7. `@medusajs/utils`
8. `@medusajs/workflows-sdk`
9. `@medusajs/deps`
10. `@medusajs/medusa`
11. `@medusajs/telemetry`
12. `@medusajs/event-bus-redis`
13. `@medusajs/notification-sendgrid`
14. `@medusajs/workflow-engine-redis`
15. `@dtc/storefront` (`my-medusa-store/apps/storefront`)

---

## 2. Hallazgos Críticos por Paquete

### 2.1 axios (`axios@1.13.2`) — 🔴 CRÍTICO

* **Vector de introducción:** `@medusajs/telemetry` → `axios@1.13.2` (también propagado a `@medusajs/framework`, `@medusajs/medusa` y `@medusajs/deps`).
* **Vulnerabilidades asociadas (selección):**

| Tipo | Severidad | Referencia |
|---|---|---|
| **Prototype Pollution** | Crítica | [SNYK-JS-AXIOS-16299904](https://security.snyk.io/vuln/SNYK-JS-AXIOS-16299904) |
| **Prototype Pollution** | Crítica | [SNYK-JS-AXIOS-16417750](https://security.snyk.io/vuln/SNYK-JS-AXIOS-16417750) |
| **HTTP Response Splitting** | Crítica | [SNYK-JS-AXIOS-16298058](https://security.snyk.io/vuln/SNYK-JS-AXIOS-16298058) |
| **SSRF (Server-Side Request Forgery)** | Alta | [SNYK-JS-AXIOS-17111062](https://security.snyk.io/vuln/SNYK-JS-AXIOS-17111062) |
| Prototype Pollution | Alta | [SNYK-JS-AXIOS-15252993](https://security.snyk.io/vuln/SNYK-JS-AXIOS-15252993), [SNYK-JS-AXIOS-17111060](https://security.snyk.io/vuln/SNYK-JS-AXIOS-17111060), [SNYK-JS-AXIOS-17111079](https://security.snyk.io/vuln/SNYK-JS-AXIOS-17111079) |
| Insertion of Sensitive Information Into Sent Data | Alta | [SNYK-JS-AXIOS-17172681](https://security.snyk.io/vuln/SNYK-JS-AXIOS-17172681) |

* **Riesgo:** La *Prototype Pollution* permite a un atacante contaminar `Object.prototype` y lograr
  ejecución de código o denegación de servicio; el *SSRF* permite que el servidor realice peticiones
  a recursos internos controlados por el atacante (pivotación hacia la red interna).
* **Dependencias hijas afectadas:** `form-data@4.0.5` (CRLF Injection), `follow-redirects@1.15.11` (fuga de información sensible).
* **Remediación propuesta:** Forzar `axios >= 1.18.0` vía `resolutions`.

### 2.2 express / qs (`express@4.22.1` → `qs@6.14.2`) — 🟠 MEDIO

* **Vector de introducción:** `express@4.22.1` → `qs@6.14.2` (presente en `@medusajs/framework`,
  `@medusajs/utils`, `modules-sdk`, `orchestration`, `query`, `workflows-sdk`, `admin-bundler`).
* **Vulnerabilidad:** **NULL Pointer Dereference**
  [SNYK-JS-QS-16721866](https://security.snyk.io/vuln/SNYK-JS-QS-16721866) — Severidad Media.
* **Hallazgo colateral:** `body-parser@1.20.4` — Allocation of Resources Without Limits or Throttling
  [SNYK-JS-BODYPARSER-17906397](https://security.snyk.io/vuln/SNYK-JS-BODYPARSER-17906397) (DoS).
* **Riesgo:** Un atacante puede provocar un *crash* del proceso Node.js enviando una query string
  malformada → Denegación de Servicio (DoS) sobre la API de Medusa.
* **Remediación propuesta:** Forzar `express >= 4.22.2` y `qs >= 6.14.3` vía `resolutions`.

### 2.3 postcss / vite (`postcss@8.5.10`, `vite@5.4.21`) — 🔴 ALTO

* **Vectores de introducción:**
  * `@medusajs/admin-bundler` → `vite@5.4.21` → `postcss@8.5.10`
  * `@dtc/storefront` → `next@15.5.21` → `postcss@8.4.31`
* **Vulnerabilidades asociadas:**

| Paquete | Tipo | Severidad | Referencia |
|---|---|---|---|
| postcss | Directory Traversal | Alta | [SNYK-JS-POSTCSS-18313038](https://security.snyk.io/vuln/SNYK-JS-POSTCSS-18313038) |
| postcss | Directory Traversal | Alta | [SNYK-JS-POSTCSS-18313036](https://security.snyk.io/vuln/SNYK-JS-POSTCSS-18313036) |
| postcss | Directory Traversal | Media | [SNYK-JS-POSTCSS-18512282](https://security.snyk.io/vuln/SNYK-JS-POSTCSS-18512282) |
| vite | Directory Traversal | Alta | [SNYK-JS-VITE-17353904](https://security.snyk.io/vuln/SNYK-JS-VITE-17353904) |
| vite | Directory Traversal | Media | [SNYK-JS-VITE-15922213](https://security.snyk.io/vuln/SNYK-JS-VITE-15922213) |
| esbuild (hija de vite) | Recursos sobre protocolo inseguro | Crítica | [SNYK-JS-ESBUILD-17750822](https://security.snyk.io/vuln/SNYK-JS-ESBUILD-17750822) |

* **Riesgo:** El *Directory Traversal* permite leer archivos arbitrarios fuera del directorio raíz
  del servidor de desarrollo/bundling (exfiltración de `.env`, credenciales, código fuente).
* **Remediación propuesta:** Forzar `postcss >= 8.5.23` vía `resolutions` (la actualización mayor de
  `vite` a 7.x se gestiona como tarea separada por implicar breaking changes).

### 2.4 fast-uri (`fast-uri@3.1.0`) — 🟠 ALTO

* **Vector de introducción (cadena profunda):**
  `@medusajs/deps` → `@mikro-orm/migrations@6.6.14` → `umzug@3.8.2` → `@rushstack/ts-command-line@4.23.7`
  → `@rushstack/terminal@0.15.2` → `@rushstack/node-core-library@5.13.0` → `ajv@8.20.0` → `fast-uri@3.1.0`
* **Vulnerabilidades asociadas:**

| Tipo | Severidad | Referencia |
|---|---|---|
| Interpretation Conflict | Alta | [SNYK-JS-FASTURI-16642394](https://security.snyk.io/vuln/SNYK-JS-FASTURI-16642394) |
| Directory Traversal | Alta | [SNYK-JS-FASTURI-16642399](https://security.snyk.io/vuln/SNYK-JS-FASTURI-16642399) |
| Interpretation Conflict | Alta | [SNYK-JS-FASTURI-17675102](https://security.snyk.io/vuln/SNYK-JS-FASTURI-17675102) |
| Interpretation Conflict | Alta | [SNYK-JS-FASTURI-18021349](https://security.snyk.io/vuln/SNYK-JS-FASTURI-18021349) |
| Interpretation Conflict | Alta | [SNYK-JS-FASTURI-18506908](https://security.snyk.io/vuln/SNYK-JS-FASTURI-18506908) |

* **Riesgo:** Conflictos de interpretación en el parseo de URIs pueden evadir validaciones de esquema
  (ajv) y habilitar traversal de rutas al resolver identificadores.
* **Remediación propuesta:** Actualizar la cadena anidada (`ajv`/`fast-uri`) mediante `resolutions`
  específicas o actualización de `@mikro-orm/*`; mitigable además con la resolución global de `qs`,
  `express`, `postcss` y `axios` que elimina las rutas expuestas de mayor impacto.

---

## 3. Otros hallazgos relevantes (secundarios)

| Paquete vulnerable | Tipo | Severidad | Introducido por |
|---|---|---|---|
| `react-router@6.30.4` | Open Redirect / Unsafe Reflection | Alta/Media | `@medusajs/dashboard@2.18.0` |
| `brace-expansion@5.0.5` | ReDoS / Complejidad algorítmica | Alta | `glob` → `minimatch` |
| `browserslist@4.28.1` | Prototype Pollution / DoS | Alta | `autoprefixer` |
| `nanoid@3.3.11` | Infinite Loop / Integer Overflow | Alta | `postcss` |
| `picomatch@4.0.3` | ReDoS / Prototype Pollution | Alta/Media | `vite` → `tinyglobby` |
| `rollup@4.53.4` | Directory Traversal | Alta | `vite` |
| `ip-address@10.1.0` | XSS / SSRF | Media | `socks-proxy-agent` |
| `js-yaml@3.15.0` | Complejidad algorítmica | Alta | `@changesets/cli` |
| `uuid@9.0.1` | Validación incorrecta de índices | Media | `bullmq@5.13.0` |
| `next@15.5.21` / `postcss@8.4.31` | DoS / Directory Traversal | Alta/Media | `@dtc/storefront` |

---

## 4. Plan de Remediación

1. **Mitigación transversal inmediata (este cambio):** incorporar/actualizar el bloque `resolutions`
   del `package.json` raíz del monorepositorio para forzar versiones parcheadas en **todos** los
   workspaces:
   ```json
   {
     "resolutions": {
       "axios": "^1.18.0",
       "express": "^4.22.2",
       "postcss": "^8.5.23",
       "qs": "^6.14.3"
     }
   }
   ```
2. Regenerar el lockfile (`yarn install`) para consolidar las versiones parcheadas.
3. Re-escanear con `snyk test` para verificar la reducción de rutas vulnerables.
4. **Backlog (mediano plazo):** actualizar dependencias padre (`@medusajs/dashboard@2.19.0`,
   `vite@7.x`, `@mikro-orm/migrations@7.x`, `next@16.x`, `bullmq@5.58.x`) para eliminar las cadenas
   vulnerables de raíz.

---

*Documento generado como parte del proceso de gestión de vulnerabilidades (remediación SCA).
El reporte final con la evidencia de mitigación se encuentra en `REPORTE_SNYK_FINAL.md`.*
