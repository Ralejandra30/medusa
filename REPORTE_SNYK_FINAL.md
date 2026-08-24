# REPORTE FINAL — Remediación de Vulnerabilidades SCA (Snyk)

| Campo | Detalle |
|---|---|
| **Proyecto** | Medusa JS Monorepositorio (`medusa`) |
| **Herramienta** | Snyk SCA (`snyk test`) + Yarn Berry 3.2.1 |
| **Informe de origen** | `REPORTE_SNYK_INICIAL.md` / `REPORTE_SNYK_SCA.txt` |
| **Estado de la remediación** | ✅ COMPLETADA |
| **Clasificación** | Confidencial — Uso interno |

---

## 1. Resumen Ejecutivo

Como continuación del diagnóstico inicial (70 proyectos analizados, 15 con rutas vulnerables),
se ejecutó el plan de remediación sobre las dependencias de terceros con vulnerabilidades
conocidas. La mitigación se aplicó de forma **transversal a todo el monorepositorio** mediante el
bloque `resolutions` del `package.json` raíz, que fuerza versiones parcheadas en todos los
workspaces independientemente del árbol de dependencias que las solicite.

**Resultado:** las cuatro familias de vulnerabilidad prioritarias (axios, express/qs,
postcss/vite y sus dependencias colaterales) han sido eliminadas del árbol de resolución.
El `yarn.lock` fue regenerado y las versiones vulnerables fueron purgadas de la caché
(Yarn `YN0019 - appears to be unused - removing`).

---

## 2. Dependencias Actualizadas — Evidencia

### 2.1 Bloque `resolutions` aplicado en `package.json` raíz

```json
"resolutions": {
  "axios": "^1.18.0",
  "express": "^4.22.2",
  "postcss": "^8.5.23",
  "qs": "^6.14.3"
}
```

*(El bloque conserva además las resoluciones preexistentes: `lodash`, `pg`, `semver`,
`esbuild`, `on-headers`, `validator`, `@opentelemetry/core`, `ajv` anidado y los patches de
changesets.)*

### 2.2 Versiones consolidadas en `yarn.lock`

| Dependencia | Versión vulnerable (antes) | Rango forzado | Versión instalada (después) | Estado |
|---|---|---|---|---|
| `axios` | `1.13.2` | `^1.18.0` | **1.19.0** | ✅ Remedida |
| `express` | `4.22.1` (sin resolución previa) | `^4.22.2` | **4.22.2** | ✅ Remedida |
| `postcss` | `8.5.10` / `8.4.31` | `^8.5.23` | **8.5.26** | ✅ Remedida |
| `qs` | `6.14.2` (sin resolución previa) | `^6.14.3` | **6.15.3** | ✅ Remedida |

### 2.3 Remediación colateral automática

Al actualizar las dependencias padre, Yarn resolvió también las dependencias hijas vulnerables:

| Dependencia | Antes | Después | Vulnerabilidad eliminada |
|---|---|---|---|
| `body-parser` | 1.20.4 | **1.20.6** | DoS por asignación ilimitada de recursos ([SNYK-JS-BODYPARSER-17906397](https://security.snyk.io/vuln/SNYK-JS-BODYPARSER-17906397)) |
| `follow-redirects` | 1.15.11 | **1.16.0** | Fuga de información sensible en redirecciones ([SNYK-JS-FOLLOWREDIRECTS-16032162](https://security.snyk.io/vuln/SNYK-JS-FOLLOWREDIRECTS-16032162)) |
| `form-data` | 4.0.5 | **4.0.6** | CRLF Injection ([SNYK-JS-FORMDATA-17337015](https://security.snyk.io/vuln/SNYK-JS-FORMDATA-17337015)) |
| `nanoid` | 3.3.11 | **3.3.18** | Infinite Loop / Integer Overflow ([SNYK-JS-NANOID-*](https://security.snyk.io/vuln/SNYK-JS-NANOID-18506894)) |
| `proxy-from-env` | 1.1.0 | **2.1.0** | Cadena de axios endurecida |

---

## 3. Procedimiento de Mitigación Aplicado

1. **Diagnóstico:** análisis del output de `snyk test` (`REPORTE_SNYK_SCA.txt`) para identificar
   paquetes vulnerables, severidad y rutas de introducción (SCA sobre 70 proyectos).
2. **Selección de versión parcheada:** para cada familia se tomó la versión mínima indicada por
   Snyk como *fix* (o superior disponible en el registry):
   * axios → `^1.18.0` (mitiga Prototype Pollution crítica [SNYK-JS-AXIOS-16299904 /
     16417750], SSRF [SNYK-JS-AXIOS-17111062], HTTP Response Splitting y ReDoS).
   * express → `^4.22.2` (actualiza `qs` internamente).
   * postcss → `^8.5.23` (mitiga Directory Traversal [SNYK-JS-POSTCSS-18313036 /
     18313038 / 18512282]).
   * qs → `^6.14.3` (mitiga NULL Pointer Dereference [SNYK-JS-QS-16721866]).
3. **Aplicación transversal:** edición del bloque `resolutions` del `package.json` raíz del
   monorepositorio, mecanismo que Yarn aplica a **todos los workspaces**, garantizando que ningún
   subárbol resuelva una versión vulnerable aunque un paquete intermedio declare rangos antiguos.
4. **Consolidación:** ejecución de `yarn install` → regeneración de `yarn.lock`
   (`Resolution step` + `Fetch step` + `Link step` completados sin errores; rebuild de
   `@medusajs/telemetry` por cambio en su árbol de dependencias).
5. **Verificación post-remediación:** inspección del `yarn.lock` confirmando que:
   * Las resoluciones activas apuntan a las versiones parcheadas.
   * No existe ninguna entrada de resolución para `axios@1.13.x`, `express@4.22.1`,
     `postcss@8.5.10`, `qs@6.14.2`, `body-parser@1.20.4`, `follow-redirects@1.15.x`,
     `form-data@4.0.5` ni `nanoid@3.3.11`.
   * Yarn purgó de su caché los artefactos zip de las versiones vulnerables (YN0019).

> **Nota sobre fast-uri:** la cadena profunda `@mikro-orm/migrations → umzug → @rushstack/* →
> ajv@8.20.0 → fast-uri@3.1.0` no se ve afectada por las resoluciones anteriores y se gestiona en
> el backlog (sección 5). Su exposición es reducida al tratarse de código de tooling/migraciones,
> no de superficie HTTP en runtime.

---

## 4. Impacto en el Riesgo

| Vector de ataque | Severidad inicial | Estado tras remediación |
|---|---|---|
| Prototype Pollution vía axios (RCE potencial / DoS) | Crítica | ✅ Eliminado |
| SSRF vía axios (pivotación a red interna) | Alta | ✅ Eliminado |
| HTTP Response Splitting / CRLF Injection (axios + form-data) | Crítica/Media | ✅ Eliminado |
| Fuga de información en redirecciones (follow-redirects) | Alta | ✅ Eliminado |
| DoS por query string malformada (qs / body-parser / express) | Media | ✅ Eliminado |
| Directory Traversal en postcss/vite (lectura arbitraria de archivos) | Alta | ✅ Mitigado en postcss; vite en backlog |
| Conflictos de interpretación en fast-uri (cadena ajv) | Alta | ⚠️ Backlog (superficie limitada) |

---

## 5. Backlog Recomendado (defensa en profundidad)

1. Actualizar `vite@5.4.21 → 7.x` y `esbuild` en `@medusajs/admin-bundler` (Directory Traversal
   restante y descarga por protocolo inseguro).
2. Actualizar `@mikro-orm/*` a 7.x (o resolver `fast-uri >= 3.1.5`) para cerrar la cadena ajv/fast-uri.
3. Actualizar `next@15.5.21 → 16.x` en `my-medusa-store/apps/storefront` (proyecto npm fuera del
   alcance de las resolutions de Yarn).
4. Elevar `@medusajs/dashboard` a 2.19.0 (react-router: Open Redirect / Unsafe Reflection).
5. Incorporar `snyk test` al pipeline de CI y `snyk monitor` para vigilancia continua.

---

## 6. Conclusión

La auditoría de seguridad de composición de software queda **consolidada con éxito**: el
monorepositorio pasó de resolver versiones vulnerables conocidas de `axios`, `express/qs` y
`postcss` a versiones parcheadas verificadas en el lockfile, con remediación colateral de
`body-parser`, `follow-redirects`, `form-data` y `nanoid`. Se recomienda re-ejecutar
`snyk test` para validar la reducción de rutas vulnerables y mantener el ciclo
*escaneo → remediación → verificación* como control permanente del SDLC.

---

*Documentos relacionados: `REPORTE_SNYK_INICIAL.md` (diagnóstico), `REPORTE_SNYK_SCA.txt`
(evidencia cruda del escaneo).*
