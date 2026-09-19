# Auditoría de datos y revisión de la herramienta

Revisión completa de los 50 datasets bajo `src/data/`, los scripts de
construcción bajo `scripts/`, y el código que los consume.

Cada hallazgo está clasificado como:

- **Corregido** — arreglado en esta rama, con el check de regresión
  correspondiente en `npm run validate`.
- **Abierto** — confirmado, pero no se puede arreglar sin volver a la fuente
  oficial. Queda marcado como `OPEN` en el validador.
- **Nota** — no es un defecto; es una limitación de la fuente que conviene
  tener documentada.

---

## 1. Hallazgos críticos (corregidos)

### 1.1 Ausentismo de diputados inflado 5,6×

`scripts/compute-alignment.mjs` puntuaba las 6 votaciones de
`executivePositions.json` contra **todos** los legisladores, sin mirar en qué
cámara se votó. `ley_glaciares` fue una votación **solo del Senado** (está en
`SENADO_VOTES` y no en `DIPUTADOS_VOTES` dentro de `scripts/scrape-votes.mjs`),
así que los 256 diputados figuraban ausentes en ella.

| Métrica | Antes | Después |
|---|---|---|
| `rate_absent` promedio, diputados | **19,6 %** | **3,5 %** |
| Diputados con ausentismo exactamente 1/6 | 227 de 256 | 0 |
| `listed_total` de un diputado | 6 | 5 |

227 de 256 diputados (89 %) aparecían con 16,7 % de ausentismo cuando su
ausentismo real era 0 %.

**Arreglo**: el script deriva de `votaciones.json` qué cámaras registraron cada
votación y solo cuenta una votación contra el legislador si su propia cámara la
tuvo. Las que no corresponden quedan como `'N/A'` en el `breakdown`, no como
ausencia. El resultado se publica en `alignmentScores.listed_votes_by_chamber`.
Además se corrigió el campo `chamber` de `executivePositions.json`, que
contradecía los datos en 3 de 6 votaciones.

### 1.2 Puntajes provinciales partidos en dos

`normProvince()` en el mismo script normalizaba contra un mapa de 11 claves. El
scraper de Diputados emite *Title Case* (`Jujuy`) y el del Senado *MAYÚSCULAS*
con los nombres legales largos (`JUJUY`, `CIUDAD AUTÓNOMA DE BUENOS AIRES`,
`TIERRA DEL FUEGO, ANTÁRTIDA E ISLAS DEL ATLÁNTICO SUR`). Las que no estaban en
el mapa pasaban sin tocar.

Resultado: `per_province` tenía **41 claves en vez de 24**. En 17 provincias el
agregado quedaba dividido en dos entradas, y `getAlignScoreColor()` en
`ArgentinaMap.jsx` toma la **primera** coincidencia — o sea que el mapa
coloreaba esas provincias con el puntaje de **solo sus diputados**, ignorando a
sus senadores.

Ejemplo: Chaco pasó de `score_executive 0,629` sobre 35 votos emitidos (solo
diputados) a `0,660` sobre 53 (diputados + senadores).

**Arreglo**: normalización canónica contra las 24 jurisdicciones tal como las
escribe `public/argentina-provinces.geojson`, insensible a mayúsculas y
acentos, con manejo explícito de CABA y de los nombres legales largos.

### 1.3 Sin destinos de exportación para Buenos Aires ni CABA — los 32 años

`scripts/parse_exports.py` mapeaba los prefijos de columna del CSV con
`PROVINCE_MAP` (`buenos_aires_`, `ciudad_de_buenos_aires_`). El CSV de destinos
del INDEC usa prefijos distintos: **`pba_`** y **`caba_`**. Ninguno coincidía,
así que las dos jurisdicciones salían con `destinations: []` en las 32 ediciones
de la serie 1993–2024 — sin error ni advertencia.

Buenos Aires sola son ~29.400 M USD de exportaciones en 2024. El panel
"Top destinations" simplemente no se renderizaba para ella, y el agregado
nacional de destinos en `NationalEconomy.jsx` estaba calculado sin esas dos.

**Arreglo**: alias de prefijo `pba`/`caba`, y la construcción del mapa de
columnas pasa a estar indexada por **provincia** en vez de por prefijo, para que
los alias se fusionen en la misma fila en lugar de emitir una segunda fila
vacía. Regenerado `exports_by_destination.json`: 64 filas vacías → 0.

### 1.4 Dos senadores en la clase de renovación equivocada

El Senado se renueva por tercios y las 3 bancas de cada distrito pertenecen
siempre a la misma clase. `officialSenators.js` tenía:

- **Juan Luis Manzur** (Tucumán): `2023-2029` — Tucumán renovó en **2021**.
- **Rodolfo Suárez** (Mendoza): `2023-2029` — Mendoza renovó en **2021**.

La prueba es estructural y no depende de ninguna fuente externa: las otras dos
bancas de cada una de esas provincias figuran como `2021-2027`, y las 8
provincias que sí renovaron en 2023 ya tenían sus 3 bancas completas. El conteo
por clase daba **22 / 26 / 24** en lugar de 24 / 24 / 24.

**Arreglo**: ambos pasan a `2021-2027` (el año de asunción de la banca queda en
un comentario). El conteo por clase ahora es 24 / 24 / 24.

### 1.5 CABA sin noticias y sin gabinete

Dos joins rotos, los dos por la misma causa — el nombre de CABA escrito de tres
maneras distintas:

- `useNewsSummary.js` hacía `slugify('Ciudad de Buenos Aires')` →
  `ciudad-de-buenos-aires`, pero el scraper escribe el archivo como
  **`caba.json`**. Resultado: "No news data for Ciudad de Buenos Aires", con 52
  artículos y 3 resúmenes en disco sin poder alcanzarse.
- `gabinetesProvinciales.js` usaba `'Ciudad Autónoma de Buenos Aires'` mientras
  que `matchProvince()` recibe `'Ciudad de Buenos Aires'` y no normalizaba
  acentos. El panel de gabinete de CABA quedaba vacío.

**Arreglo**: override de slug para CABA; clave del dataset canonicalizada; y
`matchProvince()` reescrito con una normalización que trata a Buenos Aires y
CABA como cubetas separadas en lugar de depender de coincidencia por substring
(los dos nombres se contienen mutuamente).

### 1.6 `censo_pub_priv.json` — total nacional que no cerraba

`national.private` = 16.461.649, pero la suma de las 24 provincias da
15.961.649: exactamente 500.000 de diferencia (un dígito cambiado). Con el valor
correcto, `public + private + mixedEduSalud + ignorado` da exactamente
`total` = 21.094.987.

### 1.7 Planta automotriz duplicada

`vehicle_production.json` listaba Iveco / Ferreyra / Córdoba **dos veces**, con
idénticos `production` (4.000), `employees` (800) y coordenadas; solo cambiaba
el string `type` (`"truck / bus chassis"` vs `"trucks / bus chassis"`). El panel
de Córdoba contaba 4.000 vehículos y 800 empleos de más.

### 1.8 Tierra del Fuego con la capacidad instalada de Chubut

`PROV_TO_REGIONS` mapeaba `'tierra del fuego' → ['PATAGONICA']` como *fallback*
para las provincias ausentes de `cammesa-por-provincia.json`. TdF no forma parte
del MEM/SADI (es un sistema aislado), y PATAGONICA es esencialmente Chubut más
Santa Cruz: la provincia mostraba **2.066 MW**, del orden de diez veces su
capacidad real.

En el mismo mapa, la clave de CABA era `'ciudad autonoma de buenos aires'`
mientras que `normProv()` produce `'ciudad de buenos aires'`, así que el
*fallback* previsto para CABA nunca se activaba.

**Arreglo**: TdF sale del mapa (sin dato es más honesto que el dato de otra
provincia); la clave de CABA se corrige; y se elimina la copia duplicada de
`PROV_TO_REGIONS` que vivía dentro de `RightOverlayPanel.jsx` — ahora las dos
vistas importan la misma constante.

---

## 2. Bugs de código (corregidos)

| Archivo | Problema |
|---|---|
| `economy/ExportsSection.jsx` | `useMemo` después de un `return` temprano. `exports` pasa de `[]` a poblado al elegir provincia → *Rendered more hooks than during the previous render*. |
| `economy/FiscalSection.jsx` | Otro `useMemo` condicional, además calculando una serie que ya no se renderizaba. |
| `mobile/MobileProvinceTab.jsx` | Componente `Bar` definido **dentro** del render: identidad nueva en cada render, así que React desmontaba y remontaba las barras en vez de actualizarlas. |
| `ArgentinaMap.jsx` | Escritura a un ref durante el render. |
| `BottomBar.jsx` | Estado derivado vía efecto: un frame con la pestaña anterior antes de corregirse. |
| `hooks/useCongressData.js` | Hidrataba el cache desde un efecto — primer render vacío garantizado aunque el dato ya estuviera en `localStorage`. |

`npm run lint` pasaba de **55 errores** a **0**.

---

## 3. Performance (corregido)

### 3.1 Bundle de entrada: 905 kB → 443 kB

`ArgentinaMap.jsx` importaba `getAllFiscal` desde `hooks/useEconomyData`, y ese
módulo arrastra los datasets provinciales de exportaciones (~435 kB de JSON)
al chunk de entrada — solo para colorear el coropleto fiscal. Importar
`dnap_fiscal.json` directamente corta la dependencia.

| | Antes | Después |
|---|---|---|
| `index.js` | 905,29 kB (194,06 kB gzip) | **442,66 kB (128,97 kB gzip)** |

### 3.2 Capas de energía: 9,2 MB → 5,9 MB

Las coordenadas venían de la Secretaría de Energía con **13 decimales**
(~0,1 nanómetros), tres órdenes de magnitud más fino que cualquier zoom del
mapa. `scripts/normalize-energy-overlays.mjs` las redondea a 5 decimales
(~1,1 m) y canonicaliza `properties.provincia`. Es idempotente.

| Capa | Antes | Después |
|---|---|---|
| `yacimientos.json` | 8.451 kB | **5.196 kB** (61,5 %) |
| `gasoductos.json` | 691 kB | 635 kB |
| chunk `yacimientos` gzip | 2.829 kB | **1.078 kB** |

---

## 4. Consistencia de nombres de provincia (corregido)

El `NAME_1` del geojson es la clave de join de toda la app. Divergencias
encontradas y normalizadas:

- `officialDeputies.js`: 46 registros sin acentos (`Cordoba`, `Entre Rios`,
  `Neuquen`, `Rio Negro`, `Tucuman`) mientras `officialSenators.js` los
  acentuaba. Todos los consumidores actuales normalizan acentos, así que no se
  veía — pero cualquier join estricto entre las dos listas fallaba en 5
  provincias.
- `oilgas_production.json`: `Rio Negro` → `Río Negro`.
- `energy/centrales.json` (78), `energy/refinerias.json` (15),
  `energy/yacimientos.json` (96): MAYÚSCULAS sin acentos → canónico.
- `gabinetesProvinciales.js`: `Ciudad Autónoma de Buenos Aires` → `Ciudad de
  Buenos Aires`.

---

## 5. Hallazgos abiertos

### 5.1 `governors.poblacion_censo_2022` no es Censo 2022

Las 24 jurisdicciones particionan el país, así que sus poblaciones tienen que
sumar el total nacional. Suman **45.656.999** contra los **46.044.703** del
Censo 2022: faltan 387.704 (−0,84 %).

Un segundo control, independiente, lo confirma: el cociente entre la población
de 14 años y más (`censo2022_empleo_provincial.json`, Cuadro 4.1 del Censo 2022)
y la población declarada debería caer en una banda estrecha para todas las
provincias. Santa Cruz da **71,0 %**, muy por debajo del resto (el rango del
resto es 75–86 %), lo que apunta a una población sobredeclarada. En el otro
extremo, Corrientes, Neuquén, San Luis, Santiago del Estero y Jujuy quedan por
encima de 82 %, compatible con poblaciones subdeclaradas.

No se corrige acá porque este entorno no tiene salida a internet para traer los
resultados definitivos del INDEC, y **inventar los valores sería peor que
dejarlos marcados**. Queda como `OPEN` en `npm run validate`, con la nota de
qué cuadro hay que reimportar.

### 5.2 Cobertura de i18n ≈ 20 %

`react-i18next` está cableado y los dos locales tienen las mismas 611 claves,
pero solo hay **121 llamadas a `t()`** en 5 componentes. La mayor parte de la UI
—`ExportsSection`, `ProductionSection`, `ProvincePanel`, `Legend`,
`RigiTab`…— tiene el texto en inglés hardcodeado. Es una herramienta sobre
Argentina: el idioma por defecto debería ser el español y el resto de las
cadenas deberían pasar por `t()`.

### 5.3 Datasets construidos y nunca usados

Cinco datasets se generan y se versionan pero ningún componente los importa:
`censo2022_categoria_ocupacional`, `censo2022_empleo_provincial`,
`censo_pub_priv`, `fiscalSeries`, `vab_provincial`. Dos de ellos
(`censo_pub_priv`, `vab_provincial`) ni siquiera tienen script generador. O se
conectan a la UI o se sacan. El validador los reporta como `warn`.

### 5.4 Noticias congeladas en 2026-04-01

Los 24 archivos de `src/data/news/` son un snapshot del scraper del 1 de abril
de 2026 (685 artículos). La UI los etiquetaba "Hoy" / "Today". **Mitigado**: la
UI ahora dice "Day of snapshot" / "7 days before snapshot" y muestra la fecha
del snapshot; el disclaimer aclara que no es un feed en vivo. El arreglo de
fondo es volver a correr `scripts/scrape-news.mjs`.

### 5.5 Dos vintages de CAMMESA conviviendo

El panel nacional muestra **44,2 GW** (`powerConstants.js`, CAMMESA fin de 2024)
y los paneles provinciales suman **40,0 GW**
(`cammesa-por-provincia.json`, registro de febrero de 2020). Un 10 % de
diferencia sin aclaración en la UI. Además, el registro asigna a "BUENOS AIRES"
centrales que están físicamente en CABA (Costanera, Puerto Nuevo), por lo que
CABA figura sin generación propia.

### 5.6 `votaciones.json` tiene 256 diputados, no 257

La Rioja aparece con 4 de sus 5 diputados. Falta un registro del scrapeo de
HCDN. Afecta levemente el agregado provincial de La Rioja.

### 5.7 Serie de precio del litio casi vacía

`commodityPrices.js` tiene 97 meses (2018M01–2026M01) con oro, plata y cobre
completos, y **litio solo en 1 de 97**. El chip "Li" del header muestra el único
valor que existe.

### 5.8 Las barras de bancas no usan el feed en vivo

`useCongressData()` baja `comovoto.dev.ar/data/legislators.json` y calcula
bloques, pero `CongressPanel` y `MobileNationTab` renderizan el snapshot
hardcodeado de `congressBlocs.js`. El snapshot **está verificado y es correcto**
(suma 72 y 257, y coincide con las listas oficiales), así que no se cambió el
comportamiento — pero conviene decidir cuál es la fuente de verdad.

Nota relacionada: `COALITION_ORDER` en `useCongressData.js` es
`['LLA','JxC','UCR','PJ','OTROS']`, y los diputados usan `co: 'PRO'`, que no está
en esa lista y cae en `OTROS`. Los senadores usan `JxC` para `FRENTE PRO` y
`PROVINCIAS UNIDAS`, mientras los diputados usan `OTROS` para `PROVINCIAS
UNIDAS`: el mismo bloque recibe códigos distintos según la cámara.

---

## 6. Notas sobre las fuentes (no son defectos)

- **Los dos CSV de exportaciones del INDEC no coinciden entre sí.** Para 27
  pares provincia-año (2017, 2018 y 2024) el total del CSV "por rubro" difiere
  del total del CSV "por país de destino" —Formosa 2017: 37,7 vs 21,1 M USD
  (−44 %); Formosa 2018: 45,2 vs 66,8 (+48 %)—. El pipeline es fiel a ambos; son
  vintages distintos del OPEX. El validador tolera 1 % en la suma de rubros
  porque el propio CSV del INDEC trae ese ruido de redondeo.
- **Las exportaciones provinciales no suman el total nacional.** El CSV trae
  además `extranjero`, `indeterminado` y `plataforma_continental`, que el
  pipeline descarta por no ser jurisdicciones.
- **`gas_km3` en `oilgas_production.json` son miles de m³**, no km³ —es la
  nomenclatura de la Secretaría de Energía—. Las conversiones internas son
  exactas (petróleo: 6,28981 bbl/m³; gas: /365/1000). Se agregó un bloque
  `units` al dataset para que no se malinterprete.
- **`Estado Nacional`** en los datos de hidrocarburos son áreas costa afuera
  fuera de jurisdicción provincial. No es una provincia; el validador la
  permite explícitamente.
- **Residuos de SENASA en `livestock.json`**: las cabezas por provincia suman
  entre −0,001 % y −0,21 % del total declarado por especie (equinos es el mayor,
  −5.585 cabezas). Es el "sin especificar" de la fuente.
- **Hidro pequeña clasificada como `Renovable`** en los datos de CAMMESA
  (Las Maderas, Río Hondo, Reyes): es correcto bajo la Ley 27.191, que considera
  renovable la hidroeléctrica de hasta 50 MW.

---

## 7. Lo que quedó verificado y correcto

No todo estaba roto. Lo siguiente pasó cada control:

- **`dnap_fiscal.json`** — 24 provincias, 20 años de serie. Componentes de
  recursos, `dependency`, coparticipación ≤ transferencias, y el último punto de
  la serie contra los valores de cabecera: **0 inconsistencias**. El ranking de
  dependencia coincide con lo conocido (Formosa 92,8 % arriba, CABA 11,4 % abajo).
- **`agriculture.json`** — toneladas, hectáreas y rindes de todos los cultivos de
  las 24 provincias: **0 inconsistencias**. Los totales nacionales que se
  desprenden (maíz 51,7 Mt, soja 51,1 Mt, trigo 18,5 Mt) son los de la campaña
  2024/25.
- **`censo2022_empleo_provincial.json`** y **`censo2022_categoria_ocupacional.json`**
  — tasas, PEA = ocupados + desocupados, categorías que suman ocupados, y
  nacional = suma de provincias: todo exacto.
- **`sipa_pub_priv.json`**, **`dnap_empleo_provincial.json`**, **`biep_breakdown.json`**
  — todos los agregados cierran.
- **`oilgas_production.json`** — nacional = suma de provincias en las tres
  variables, y todas las conversiones a unidades diarias son exactas.
- **`cammesa-por-provincia.json`** / **`cammesa-por-region.json`** — 40.020 MW y
  315 centrales por los dos cortes, y `byFuente` cierra en cada provincia.
- **Composición del Congreso** — 257 diputados y 72 senadores, bancas por
  distrito exactas contra la asignación constitucional, sin nombres duplicados,
  y el snapshot de `congressBlocs.js` consistente con las listas nominales.
- **Proyectos mineros (328) y RIGI (17)** — todas las coordenadas dentro del
  bounding box de Argentina, sin duplicados reales.

---

## 7b. Contraste contra fuentes oficiales (búsqueda web)

El entorno bloquea el egreso a `indec.gob.ar`, `argentina.gob.ar` y al resto de
los `.gob.ar`, tanto por `curl` como por fetch directo. Lo único disponible es
búsqueda web, que devuelve síntesis de resultados y no las tablas fuente. Eso
alcanza para **confirmar defectos**, no para **redactar reemplazos**: dos
búsquedas devolvieron tablas "definitivas" distintas para las mismas
provincias, y una presentó cantidad de viviendas como si fuera población. Por
eso nada de lo de abajo se escribió en los datasets — se codificó como
checklist en `npm run validate`.

### Confirmado correcto

- **Pobreza 38,1 % de personas, 31 aglomerados, 2.º semestre 2024.** Coincide
  exactamente con lo que tiene el repo, y con el universo bien etiquetado.
- **Estructura fiscal provincial.** El agregado del repo da 55,5 % de
  transferencias nacionales sobre propios + transferencias, contra el "casi
  60 %" que reportan los informes del sector; el grupo de mayor dependencia
  (Formosa, Santiago del Estero, La Rioja, Chaco, Corrientes, todos por encima
  del 84 %) coincide con las provincias que las fuentes ubican cerca del 90 %; y
  CABA aparece como la más independiente en ambos. **La pestaña fiscal es
  sólida en los números** — lo que estaba mal ahí era la presentación, ya
  corregida.

### Confirmado incorrecto

- **46.044.703 es el total provisional del Censo 2022, no el definitivo.** El
  definitivo es **45.892.285**, y cierra contra la propia apertura por sexo de
  INDEC (22.186.791 + 23.705.494). El validador comparaba contra el provisional
  y lo etiquetaba como definitivo; corregido.
- **Seis provincias verificadas contra el dato definitivo, y las seis
  difieren:**

  | provincia | governors.js | Censo 2022 definitivo | error |
  |---|---|---|---|
  | Santa Cruz | 365.698 | 337.226 | +8,4 % |
  | Santiago del Estero | 978.313 | 1.060.906 | −7,8 % |
  | Corrientes | 1.120.801 | 1.212.696 | −7,6 % |
  | Neuquén | 664.604 | 710.814 | −6,5 % |
  | San Luis | 508.328 | 542.069 | −6,2 % |
  | San Juan | 781.217 | 822.853 | −5,1 % |

  Es exactamente el patrón que había predicho el cruce interno contra el cuadro
  de población de 14 años y más: con 337.226, el cociente de Santa Cruz pasa de
  71,0 % a 77,0 % y entra en la banda del resto. **No las parcheé una por una**
  — dejar seis valores definitivos entre dieciocho provisionales deja un campo
  con dos vintages mezclados que nada aguas abajo puede distinguir. Van como
  checklist para una reimportación única.

- **Desocupación EPH en provincias de un solo aglomerado.** Cuando una
  provincia tiene un único aglomerado EPH el mapeo es 1:1 y el valor tiene que
  ser idéntico al publicado. Dos de tres no lo son:

  | provincia | repo | aglomerado (Q3-2025 oficial) | dif |
  |---|---|---|---|
  | Chaco | 7,4 % | Gran Resistencia **9,7 %** | −2,3 pp |
  | Ciudad de Buenos Aires | 3,9 % | CABA **4,4 %** | −0,5 pp |
  | Santa Cruz | 10,7 % | Río Gallegos 10,8 % | −0,1 pp ✓ |

  Gran Resistencia 9,7 % está corroborado en dos búsquedas independientes (es
  el segundo más alto del país después de Río Gallegos). Con 7,4 % el dashboard
  muestra a Chaco por debajo del promedio y mal ubicado en el ranking.

- **Hay dos nacionales de desocupación para el mismo trimestre.** INDEC publica
  **6,3 %** para total urbano y **6,9 %** para los 31 aglomerados en Q3-2025.
  `EPH_UNEMPLOYMENT_NATIONAL` usa el primero, mientras que los valores
  provinciales salen de la serie de 31 aglomerados: el delta "+1,4 vs nacional"
  que muestra cada provincia compara universos distintos. No cambié la
  constante porque las fuentes secundarias además hacen circular un tercer
  número (6,6 %) y no puedo determinar cuál serie alimentó los valores
  provinciales sin la tabla de INDEC. Queda anotado en el validador.

### Sigue sin poder verificarse

Los **niveles** del APNF (los montos, no las proporciones), las cifras de BIEP
y DNAP, y los totales de SIPA por provincia. Todos viven en xlsx que hay que
descargar, y la búsqueda web no los expone.

## 7c. Empleo público: tres cifras que parecían contradecirse

El repo reporta empleo público con tres instrumentos y los muestra en la misma
pantalla sin decir en qué se diferencian. El resultado es que el lector ve
2,5 M, 3,4 M y 3,9 M para "empleo público" y no puede usar ninguno.

Las tres son correctas. Cada una incluye algo que la anterior deja afuera:

| | cifra | qué cuenta |
|---|---|---|
| **Censo 2022** | 2.459.952 | personas que declaran su ocupación principal en administración pública, educación o salud. No aísla empresas públicas y deja 2,46 M de casos sin clasificar. |
| **BIEP mid-2023** | 3.389.900 | personas en los tres niveles de gobierno. Suma FFAA y fuerzas de seguridad, universidades nacionales, bancos y empresas públicas. |
| **SIPA nov-2023** | 3.940.274 | puestos registrados, no personas: quien tiene doble cargo cuenta dos veces. Es la más alta por construcción. |

Dos controles internos respaldan que la escalera es metodológica y no un error:
el nivel provincial de BIEP (2.237.900) y los cargos provinciales de DNAP
(2.321.510) coinciden dentro del 4 %, y el orden Censo < BIEP < SIPA se cumple.

**Esto sí era un error**: `biep_breakdown.json` llevaba su propia copia del total
de SIPA público — **3.966.336** — mientras `sipa_pub_priv.json` decía
**3.940.274**, y `NationalEconomy.jsx` mostraba las dos en la misma pantalla: la
primera en la nota que compara contra BIEP, la segunda en el recuadro del split
público/privado. Mismo concepto, mismo mes, 26.062 de diferencia. El campo
duplicado se eliminó y la nota ahora deriva la cifra del dataset que la app ya
usa, así que hay un solo número.

Se agregó a la UI el bloque de reconciliación con la tabla de arriba, y tres
checks al validador: que ningún dataset duplique el total de SIPA público, que
se cumpla el orden Censo < BIEP < SIPA, y que BIEP-provincial y DNAP no se
separen más de 10 %. De paso, `censo_pub_priv.json` deja de ser un dataset
huérfano: ahora ancla el piso de la escalera.

### 7c.1 Por qué la vista provincial no lleva la misma escalera

La pestaña provincial muestra SIPA-público y los cargos provinciales de DNAP
uno al lado del otro. Copiar ahí el bloque de la vista nacional habría sido un
error, porque las dos cifras se diferencian en **dos ejes a la vez**:

| eje | SIPA-público | DNAP | ¿contiene? |
|---|---|---|---|
| nivel de gobierno | nacional + provincial + municipal | solo provincial | sí |
| atribución a la provincia | residencia del trabajador | jurisdicción empleadora | **no** |

El segundo eje rompe la contención: un residente bonaerense empleado por el
gobierno de CABA suma en el SIPA de Buenos Aires y en el DNAP de CABA. Por eso
no se restan, y por eso una escalera —que afirma anidamiento— habría dicho algo
falso. El cociente DNAP/SIPA-público lo confirma: va de **50 % a 150 %** con
mediana 65 %, una dispersión incompatible con una relación de subconjunto.

Tampoco se muestra ese cociente, justamente porque invitaría a la resta que la
nota desaconseja.

Lo que sí se agregó: cada cifra lleva su alcance escrito al lado (*3 niveles de
gobierno · por residencia* y *solo gobierno provincial · por jurisdicción*), y
debajo una línea que explica por qué no se combinan.

**Santa Cruz** es la única provincia donde DNAP supera a SIPA-público (150 %,
contra 50–90 % del resto). Ahí la pestaña muestra además un aviso: es una
anomalía sin resolver, no un dato para interpretar. Está seguida como `OPEN` en
el validador.

## 7d. Segunda pasada: lente semántica sobre el resto de los datos

La primera pasada fue estructural —esquemas, sumas, nombres, duplicados—. Lo que
encontró los defectos que importaban fue otra lente: **qué mide realmente este
número, el rótulo dice lo que el dato hace, estas dos cosas juntas pertenecen
juntas, la magnitud es plausible**. Esta sección aplica esa lente al resto.

### Coordenadas contra la provincia declarada

Cada registro geolocalizado lleva un nombre de provincia **y** un punto, y los
dos pueden discrepar sin que nada lo note: los paneles filtran por el nombre y
el mapa dibuja el punto, así que un par mal casado aparece en la lista de una
provincia y se dibuja dentro de otra. Nunca se había chequeado. Sobre 567
puntos:

| dataset | puntos | discrepancias |
|---|---|---|
| `miningProjects` | 328 | **2** |
| `renovablesProjects` | 136 | **2** |
| `vehicle_production` | 10 | 0 |
| `energy/centrales` | 78 | 0 |
| `energy/refinerias` | 15 | 0 |

- **Altos Sapitos** dice La Rioja y cae en San Juan.
- **El Bagual** dice Río Negro y cae en Santa Cruz, unos 9 grados de latitud al sur.
- **P.E. Vientos Olavarría** dice Buenos Aires y cae en La Pampa. Acá el error es
  la coordenada, no la provincia: Olavarría está en longitud ~−60,3 y el
  registro tiene −66,8.
- **Salto Dique Ballester** dice Río Negro y cae en Neuquén — está sobre el límite.

Los dos de minería con provincia `"Catamarca - Salta"` no cuentan: es una etiqueta
de yacimiento a caballo del límite, y el check la exceptúa a propósito.

### `politicalContext.js` estaba un mandato entero atrasado

Duplicaba cinco campos de `governors.js` —`gobernador`, `partido`,
`inicio_mandato`, `fin_mandato`, `proxima_eleccion_gobernador`— y la copia se
había desfasado:

- **Corrientes** seguía nombrando a Gustavo Valdés con mandato 2021-2025, cuando
  `governors.js` ya tenía a Juan Pablo Valdés en 2025-2029. Y el mismo registro,
  en sus campos de texto, **ya decía** *"Valdés deja el cargo por límite
  constitucional"* y *"Sucesor de Valdés asume dic-2025"*: se contradecía a sí mismo.
- **Catamarca** y **Salta** llevaban mandatos de **8 años** (2019-12 → 2027-12),
  que no existen.

Nada de eso se renderizaba —de `politicalContext` la UI solo lee
`rigi_adhesion_provincial`—, así que no llegó a la pantalla. **Arreglo**: se
eliminaron los cinco campos duplicados. `governors.js` es la fuente única y pasa
el control de coherencia de mandatos en las 24 provincias. Un check nuevo impide
que vuelvan a aparecer.

### Plata: un salto de 47,7 % en un mes

En `commodityPrices.js`, 2026M01 lleva la plata de 62,34 a 92,06 mientras el oro
y el cobre se mueven ~10 % ese mismo mes. El ratio oro/plata pasa de 69 a 52 en
un salto. Es además **el único mes de los 97 que trae valor de litio**, lo que
apunta a que esa fila vino de otra fuente. No lo corregí porque no puedo
verificar el valor correcto; queda como `OPEN` con un check que marca cualquier
mes que se mueva más de 40 %.

### `vab_provincial.json`: un agregado que no se puede reconciliar con su detalle

`sector_dominante` / `share_dominante_pct` son una **familia** de sectores, no un
sector: Santa Cruz declara "Minería e Hidrocarburos 38,48 %" y en su detalle
Oil & Gas 24,39 + Metal Mining 14,10 = 38,49. Correcto.

El problema es que **el dataset no tiene ningún campo que diga qué filas forman
cada familia**. Los colores son por sector (44 colores para 47 filas), así que la
composición no es derivable desde adentro. En 16 de 24 provincias el titular
choca de frente con el detalle a primera vista: Buenos Aires anuncia "Industria
29,45 %" sobre una lista cuya fila más alta es Commerce 16,09 %.

Hoy no molesta porque el dataset está huérfano. Es una condición a resolver
**antes** de conectarlo a la UI, no después.

### Lo que pasó la lente sin observaciones

- **`agriculture.json`** — ningún cultivo en provincia inverosímil (los tres que
  saltaron —algodón en Catamarca, cebada en Santiago, maíz en Chaco— son zonas
  marginales reales), y todos los rindes dentro de rango físico.
- **`livestock.json`** — densidades coherentes en las cinco especies: máximo
  63 bovinos/km² en Buenos Aires, 14,8 ovinos/km² en Tierra del Fuego, mínimos en
  Santa Cruz.
- **`oilgas_production.json`** — cada cuenca declarada corresponde a la provincia
  que la declara, y los `oil_pct` de cada una suman 100.
- **Energía** — el nuclear cierra por tres caminos: constante 1,8 GW, suma de
  centrales 1,763 GW, CAMMESA 1,755 GW. La brecha de 44,2 vs 40,0 GW del total es
  el desfase de vintage ya documentado (2024 vs 2020), no un error.
- **`rigiProjects.json`** — 17 proyectos, sin ids duplicados, US$ 65.711 M que
  cierran entre aprobados (18.211) y en revisión (47.500).
- **Noticias** — los 685 artículos tienen fecha y clasificación.
- **`sociodemographic.js`** — los rangos son plausibles y la dispersión también:
  PBG per cápita 6,2× entre CABA y Misiones, escolaridad 1,4×, alfabetismo 1,03×.

## 8. Red de regresión: `npm run validate`

`scripts/validate-data.mjs` codifica **87 invariantes** sobre los datasets.
Cada uno corresponde a un defecto que este repositorio tuvo al menos una vez:

```
npm run validate     # sale con código ≠ 0 si algo falla
```

Cubre: canonicidad de nombres de provincia en cada dataset; nacional = suma de
provincias; aritmética interna (tasas, participaciones, conversiones de
unidades); bancas por distrito y clases de renovación del Senado; aplicabilidad
por cámara de cada votación; ausencia de filas vacías en exportaciones;
duplicados de plantas; que cada jurisdicción resuelva a un archivo de noticias;
y la consistencia de la población contra el Censo 2022.

Los defectos confirmados pero no corregibles desde este repositorio se reportan
como `OPEN` y no hacen fallar la corrida. La entrada correspondiente en
`KNOWN_OPEN` debe borrarse en el mismo commit que arregle el dato.

Estado actual: **103/111 OK · 8 abiertos · 1 warning** (datasets huérfanos).
