# Auditoría de datos — octubre 2026

Revisión integral de las cifras del tablero, contrastadas contra fuentes primarias el 20-oct-2026.
Cada tabla lista: archivo · campo · valor anterior · valor verificado · fuente · estado
(OK / CORRECTED / UPDATED / UNVERIFIABLE / STALE / ESTIMATE-FLAGGED).

Resumen visible para el público: pestaña **Fuentes y método** del tablero (`src/data/auditLog.js`).

## Pendientes conocidos

- `scripts/process_fiscal.py`, `scripts/build_dnap_empleo.py` y `scripts/process-fiscal-series.mjs` usan la fórmula/archivos anteriores: si se vuelven a correr, pisan los datos corregidos.
- `scripts/build_censo2022_categoria.py` tiene el mismo intercambio de columnas que se corrigió en `censo2022_categoria_ocupacional.json`.
- `votaciones.json` no tiene la votación final de la Ley de Glaciares en Diputados (9-abr-2026) ni Inocencia Fiscal II (ago-2026).
- `escolaridad` y `alfabetismo` en `sociodemographic.js` no son indicadores publicados por INDEC; se retiraron de rankings y comparador.
- Stock de deuda provincial (`meconDnapDeuda`): hay datos al 2T-2026 sin incorporar.


## Political data audit — pol-econ (as of 2026-10-20)

Scope: governors.js, congressBlocs.js, politicalContext.js, gabinetesProvinciales.js, officialDeputies.js, officialSenators.js, votaciones.json, executivePositions.json, sources.js (political entries).
Primary sources fetched live on 2026-10-20: official Diputados roster (https://www.diputados.gob.ar/diputados/), Senate bloc listing (https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques), Senate roster (https://www.senado.gob.ar/senadores/listados/listaSenadoRes), INDEC Censo 2022 resultados definitivos Cuadro 2 (https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx).

## Census 2022 (definitive) — governors.js
File sum before: 45,656,999 (mixed provisional/other values). INDEC definitive total: **45,892,285** (the 46,044,703 figure was the *provisional* Jan-2023 release). New file sum = 45,892,285.
Areas = INDEC Cuadro 2 (IGN continental), rounded to km²; CABA kept at 205.9. Tierra del Fuego: Isla Grande 21,571 km² (INDEC footnote 3), population 185,732 (jurisdiction total; includes ~207 people censused in Antártida/Orcadas, negligible). Note INDEC footnote says 5.9 hab/km² for Isla Grande, which is arithmetically inconsistent (185,732/21,571 = 8.6); 8.6 used.

| file | field/entity | old value | verified value | source URL | status |
|---|---|---|---|---|---|
| governors.js | Buenos Aires: pob / sup km² / densidad | 17,541,141 / 307571 / 57.0 | 17,523,996 / 305907 / 57.3 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Ciudad de Buenos Aires: pob / sup km² / densidad | 3,120,612 / 203 / 15373.5 | 3,121,707 / 205.9 / 15161.3 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Catamarca: pob / sup km² / densidad | 415,438 / 102602 / 4.0 | 429,562 / 101486 / 4.2 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Chaco: pob / sup km² / densidad | 1,142,947 / 99633 / 11.5 | 1,129,606 / 99763 / 11.3 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Chubut: pob / sup km² / densidad | 618,994 / 224686 / 2.8 | 592,621 / 224302 / 2.6 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Córdoba: pob / sup km² / densidad | 3,978,984 / 165321 / 24.1 | 3,840,905 / 164708 / 23.3 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Corrientes: pob / sup km² / densidad | 1,120,801 / 88199 / 12.7 | 1,212,696 / 89123 / 13.6 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Entre Ríos: pob / sup km² / densidad | 1,385,961 / 78781 / 17.6 | 1,425,578 / 78384 / 18.2 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Formosa: pob / sup km² / densidad | 605,193 / 72066 / 8.4 | 607,419 / 75488 / 8.0 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Jujuy: pob / sup km² / densidad | 770,881 / 53219 / 14.5 | 811,611 / 53244 / 15.2 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | La Pampa: pob / sup km² / densidad | 358,428 / 143440 / 2.5 | 361,859 / 143492 / 2.5 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | La Rioja: pob / sup km² / densidad | 393,531 / 89680 / 4.4 | 383,865 / 91494 / 4.2 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Mendoza: pob / sup km² / densidad | 2,014,533 / 148827 / 13.5 | 2,043,540 / 149069 / 13.7 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Misiones: pob / sup km² / densidad | 1,261,294 / 29801 / 42.3 | 1,278,873 / 29911 / 42.8 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Neuquén: pob / sup km² / densidad | 664,604 / 94078 / 7.1 | 710,814 / 94422 / 7.5 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Río Negro: pob / sup km² / densidad | 747,610 / 203013 / 3.7 | 750,768 / 202169 / 3.7 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Salta: pob / sup km² / densidad | 1,440,672 / 155488 / 9.3 | 1,441,351 / 155340 / 9.3 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | San Juan: pob / sup km² / densidad | 781,217 / 89651 / 8.7 | 822,853 / 88296 / 9.3 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | San Luis: pob / sup km² / densidad | 508,328 / 76748 / 6.6 | 542,069 / 75347 / 7.2 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Santa Cruz: pob / sup km² / densidad | 365,698 / 243943 / 1.5 | 337,226 / 244458 / 1.4 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Santa Fe: pob / sup km² / densidad | 3,556,522 / 133007 / 26.7 | 3,544,908 / 133249 / 26.6 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Santiago del Estero: pob / sup km² / densidad | 978,313 / 136351 / 7.2 | 1,060,906 / 136934 / 7.7 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Tierra del Fuego: pob / sup km² / densidad | 190,641 / 21571 / 8.8 | 185,732 / 21571 / 8.6 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |
| governors.js | Tucumán: pob / sup km² / densidad | 1,694,656 / 22524 / 75.2 | 1,731,820 / 22592 / 76.7 | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_est_c2.xlsx | CORRECTED |

## Governors / vice-governors
| file | field/entity | old value | verified value | source URL | status |
|---|---|---|---|---|---|
| governors.js | 24 governors (names) | as listed | all 24 match | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina | OK |
| governors.js | Chaco vicegobernador | Silvana Pérez | Vacant — Silvana Schneider (elected vice 2023) became national senator (LLA list, 2025-2031) 10-Dec-2025 | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques ; https://en.wikipedia.org/wiki/Leandro_Zdero | CORRECTED |
| governors.js | Córdoba vicegobernador | Manuel Calvo | Myrian Prunotto | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina ; https://www.letrap.com.ar/politica/martin-llaryora-2026-todos-los-cambios-el-gabinete-y-la-legislatura-cordoba-n5420532 | CORRECTED |
| governors.js | Entre Ríos vicegobernador | Pedro Galimberti | Alicia Aluani | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina | CORRECTED |
| governors.js | La Pampa vicegobernador | Mariano Fernández (2019-23 vice) | Alicia Mayoral | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina | CORRECTED |
| governors.js | San Luis vicegobernador | Gabriela Sosa | Ricardo Endeiza | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina ; https://viapais.com.ar/san-luis/claudio-poggi-asumio-como-gobernador-de-san-luis/ | CORRECTED |
| governors.js | Salta partido / coalición | Partido Justicialista / Salta de Todos | Partido Identidad Salteña (PAIS) / Primero los Salteños (2025 front; Senate roster lists Royón under "Primero Los Salteños"). Note: Sáenz's faction took control of PJ Salta on 2-Aug-2026 | https://en.wikipedia.org/wiki/Salta_Identity_Party ; https://www.letrap.com.ar/politica/mensaje-san-jose-1111-gustavo-saenz-se-quedo-el-partido-justicialista-salta-n5425521 | CORRECTED (resolves conflict with politicalContext "Identidad Salteña") |
| governors.js | Tucumán mandate | 2023-12 → 2027-12 | 2023-10 (29-Oct-2023) → 2027-10 | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina | CORRECTED |
| governors.js | Tierra del Fuego mandate | 2023-12 | term runs 17-Dec to 17-Dec (month still Dec) | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina | OK |
| governors.js | Corrientes (J.P. Valdés / Braillard Poccard, 2025-12→2029-12) | — | confirmed; won 31-Aug-2025 with 51.9% | https://www.lanacion.com.ar/politica/quien-gano-las-elecciones-a-gobernador-en-corrientes-2025-nid31082025/ | OK |
| governors.js | Santiago del Estero (Elías Suárez / Carlos Silva Neder, 2025-12→2029-12) | — | confirmed | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina | OK |
| governors.js | Neuquén vice Gloria Ruiz; other vices | — | match | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina | OK |
| governors.js | alineamiento_nacion / posicion_ideologica | editorial | not fact-checkable; Chaco "primer gobernador no peronista en décadas" is loose (UCR's Rozas governed 1995-2003) | — | UNVERIFIABLE |

## Congress composition — congressBlocs.js
| file | field/entity | old value | verified value | source URL | status |
|---|---|---|---|---|---|
| congressBlocs.js | Senate LLA / PJ / UCR / PRO / Prov. | 21/21/10/3/17 | 21/21/10/3/17 (Justicialista 21; Prov. = Convicción Federal 3, Justicia Social Federal 2, FCxS 2, Movere SC 2, Mov. por Misiones 2, Provincias Unidas 2, Despierta Chubut 1, Independencia 1, La Neuquinidad 1, Primero los Salteños 1) | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques | OK (as of 2026-10-20) |
| congressBlocs.js | Deputies UxP | 93 | 92 (Ernesto "Pipi" Alí now in Primero San Luis) | https://www.diputados.gob.ar/diputados/ | CORRECTED |
| congressBlocs.js | Deputies Prov. / Other | 43 / 4 | 42 / 6 (classification documented in header) | https://www.diputados.gob.ar/diputados/ | CORRECTED |
| congressBlocs.js | Deputies LLA / PRO / UCR / FIT | 95/12/6/4 | 95/12/6/4 (+1 CABA LLA seat "pendiente de incorporación") | https://www.diputados.gob.ar/diputados/ | OK |

## Legislator rosters
| file | field/entity | old value | verified value | source URL | status |
|---|---|---|---|---|---|
| officialDeputies.js | total / per-province counts | 257 | 257, all province counts match; roster reflects 10-Dec-2025 renewal (127 with 2025-2029 mandates) | https://www.diputados.gob.ar/diputados/ | OK |
| officialDeputies.js | Pitrola, Néstor (FIT, BA) | listed | replaced by Juan Carlos Giordano (IS-FIT, jura 26-Aug-2026, FIT rotation) | https://www.diputados.gob.ar/diputados/ | CORRECTED |
| officialDeputies.js | Ravier, Adrián (LLA, La Pampa) | listed | replaced by Martín Matzkin (LLA, jura 24-Jun-2026) | https://www.diputados.gob.ar/diputados/ | CORRECTED |
| officialDeputies.js | 9 deputies bloc "INNOVACIÓN FEDERAL" | Innovación Federal | "ARGENTINA FEDERAL" (Álvarez, Arrúa, Biella, González G.G., Outes, Ruíz, Vancsik, Vega, Herrera) | https://www.diputados.gob.ar/diputados/ | CORRECTED |
| officialDeputies.js | Alí, Ernesto "Pipi" | UxP / PJ | PRIMERO SAN LUIS / OTROS | https://www.diputados.gob.ar/diputados/ | CORRECTED |
| officialDeputies.js | Bregman, del Caño, Del Plá | FIT-U (generic) | PTS-FIT-U (2), PO-FIT-U (1) | https://www.diputados.gob.ar/diputados/ | CORRECTED |
| officialDeputies.js | Herrera, Oscar (Misiones) | Herrera, Oscar | Official name "Herrera Ahuad, Oscar A." — name kept as-is because ProvincialCongressPanel matches votaciones.json by surname ("HERRERA") | https://www.diputados.gob.ar/diputados/ | STALE (kept for compatibility) |
| officialDeputies.js | other ~245 names/blocs/provinces | — | all match official list exactly (automated diff) | https://www.diputados.gob.ar/diputados/ | OK |
| officialSenators.js | 72 senators, names, provinces, blocs | — | all 72 match; post-renewal (24 with 2025-2031 mandates) | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques | OK |
| officialSenators.js | Arce, Rojas Decut (Misiones) bloc | Frente Renovador de la Concordia Social | Movimiento por Misiones | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques | CORRECTED |
| officialSenators.js | Carambia, Gadano (Santa Cruz) bloc | Movere por Santa Cruz | Movere Santa Cruz | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques | CORRECTED |

## Votes — votaciones.json / executivePositions.json
| file | field/entity | old value | verified value | source URL | status |
|---|---|---|---|---|---|
| votaciones.json | presupuesto_2026 Senate | A46 N25 X1 | 46-25-1, 26-Dec-2025 | https://www.ambito.com/politica/la-celebracion-javier-milei-las-victorias-del-gobierno-el-senado-es-historico-n6228526 | OK |
| votaciones.json | presupuesto_2026 Deputies | A132 N97 | approved 17-Dec-2025 (tally not independently confirmed) | https://www.c5n.com/politica/sesiones-extraordinarias-diputados-prespuesto-2026-miercoles-17-diciembre-2026 | UNVERIFIABLE (plausible) |
| votaciones.json | inocencia_fiscal Deputies / Senate | 130-107-2 / 43-26 | 130-107-2 (17-Dec-2025) / 43-26 (26-Dec-2025) | https://www.c5n.com/politica/diputados-le-dio-media-sancion-la-ley-presuncion-inocencia-fiscal-n224208 | OK |
| votaciones.json | regimen_penal_juv | D 149-100; S 44-27-1 | D 149-100 (12-Feb-2026); S 44-27-1 (27-Feb-2026), Ley 27.801 | https://eleconomista.com.ar/politica/el-congreso-sanciono-baja-edad-imputabilidad-14-anos-n92974 | OK |
| votaciones.json | modernizacion_laboral | D 135-115; S 42-30 / 42-28 | D 135-115 (20-Feb-2026), back to Senate for final 27-Feb-2026 | https://aldiaargentina.microjuris.com/2026/02/20/actualidad-se-aprobo-la-reforma-laboral-en-diputados-y-vuelve-al-senado-para-su-sancion-definitiva/ | OK (Senate tallies not independently confirmed) |
| votaciones.json | mercosur_ue | D 203-42-4; S 69-3 | D 203-42-4; S 69-3 (Di Tullio, de Pedro, C. López against) | https://www.c5n.com/acuerdo-mercosur-union-europea-aprobado-por-el-senado | OK |
| votaciones.json | ley_glaciares Senate | 40-31-1 | 40-31-1, 26-Feb-2026 (abst. Corroza) | https://www.diariodecuyo.com.ar/politica/el-senado-aprobo-general-la-reforma-la-ley-glaciares-y-la-giro-diputados-n6566961 | OK |
| votaciones.json | ley_glaciares Deputies | no records | Diputados final sanction 9-Apr-2026, 137-111-3 | https://www.subrayado.com.uy/congreso-a4269 | STALE (roll call missing) |
| votaciones.json | Inocencia Fiscal II (Diputados, Aug-2026, ~139-110) | absent | new vote not in dataset | https://www.diariojudicial.com/news-104256-avanza-la-inocencia-fiscal | STALE |
| executivePositions.json | dates: presupuesto 2025-11, inocencia 2025-09, laboral 2025-12, penal juv 2025-10, glaciares 2025-08 | as listed | 2025-12, 2025-12, 2026-02, 2026-02, 2026-02 (Senate) / 2026-04 (Deputies) | sources above | CORRECTED |
| executivePositions.json | chamber for inocencia_fiscal / regimen_penal_juv | deputies | both (data includes Senate votes) | sources above | CORRECTED |
| executivePositions.json | executive_position = A for all six | A | Executive-sponsored/backed in all cases | sources above | OK |

## politicalContext.js
| file | field/entity | old value | verified value | source URL | status |
|---|---|---|---|---|---|
| politicalContext.js | Corrientes governor/mandate | Gustavo Valdés 2021-12→2025-12, election "Dic-2025" | Juan Pablo Valdés 2025-12→2029-12; election 31-Aug-2025 (51.9%) | https://www.lanacion.com.ar/politica/quien-gano-las-elecciones-a-gobernador-en-corrientes-2025-nid31082025/ | CORRECTED |
| politicalContext.js | Tucumán mandate | 2023-12→2027-12 | 2023-10→2027-10 | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina | CORRECTED |
| politicalContext.js | Salta partido | Identidad Salteña (aliado LLA) | consistent with corrected governors.js | https://en.wikipedia.org/wiki/Salta_Identity_Party | OK |
| politicalContext.js | Salta 2025 result | "Sáenz arrasó…" | May-2025 provincial: Sáenz front won, LLA won Capital; Oct-2025: LLA won Senate (Orozco, Guzmán Coraita), Royón minority | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques; https://www.canal26.com/politica/2025/10/27/quien-gano-las-elecciones-legislativas-2025-los-resultados-provincia-por-provincia/ | CORRECTED |
| politicalContext.js | Buenos Aires 2025 | "Oct-2025: LLA avanzó… PJ retuvo mayoría" | 7-Sep-2025 provincial: Fuerza Patria 47.3% vs LLA 33.7%; Oct-2025 national: LLA narrowly ahead | https://www.canal26.com/politica/2025/09/08/elecciones-en-la-provincia-de-buenos-aires-que-partido-gano-en-cada-seccion-electoral/ | CORRECTED |
| politicalContext.js | CABA 2025 | "Jun-2025… alianza PRO-LLA" | 18-May-2025: LLA 30.1%, Santoro ~27%, PRO ~16% (separate lists); allied only in Oct | https://eleconomista.com.ar/politica/gano-adorni-supero-30-duplico-caudal-pro-fin-n84841 | CORRECTED |
| politicalContext.js | Córdoba 2025 | "May-2025: elecciones provinciales concurrentes" | no provincial election in 2025; Oct-2025 LLA ~42% | https://dolarhoy.com/otras-categorias/ganadores-de-las-elecciones-legislativas-2025-por-provincia-20251027121834 | CORRECTED |
| politicalContext.js | Chaco 2025 | generic | 11-May-2025 provincial; Oct-2025 LLA-Zdero won Senate (Godoy, Schneider), Capitanich minority | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques; https://www.letrap.com.ar/politica/elecciones-2025-este-es-el-calendario-electoral-fecha-fecha-y-provincia-provincia-n5414571 | CORRECTED |
| politicalContext.js | Santa Fe 2025 | "sin elecciones provinciales" | 13-Apr-2025 convencionales + PASO, 29-Jun-2025 generales; constitutional reform 2025 | https://www.ellitoral.com/politica/santa-fe-inaugura-calendario-electoral-culminara-pais-octubre-elecciones-2025-paso-buenos-aires_0_nJxyHmqcPr.html | CORRECTED |
| politicalContext.js | Misiones / Formosa 2025 | generic; Formosa "PJ retuvo todas las bancas" | Misiones 8-Jun-2025 provincial; Formosa 29-Jun-2025 provincial + convencionales; Formosa Oct-2025: LLA got 1 seat (Atilio Basualdo) | https://www.diputados.gob.ar/diputados/; Letra P calendar | CORRECTED |
| politicalContext.js | Río Negro 2025 | "Abr-2025: municipales menores" | Oct-2025: FP won Senate majority (Soria, Marks), LLA minority (Fullone); LLA won Diputados | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques; Canal 26 | CORRECTED |
| politicalContext.js | Neuquén 2025 | "MPN/Comunidad mantuvo representación" | Oct-2025: LLA won Senate (Márquez, Cervi), La Neuquinidad minority (Corroza) | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques | CORRECTED |
| politicalContext.js | Chubut partido | Despierta Chubut | Torres is PRO; Despierta Chubut is his provincial front/Senate bloc (Terenzi) — both defensible | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques | OK |
| politicalContext.js | RIGI adhesion law numbers, legislature composition %, mining positions | as listed | not re-verified | — | UNVERIFIABLE |

## gabinetesProvinciales.js (8 largest provinces spot check)
| file | field/entity | old value | verified value | source URL | status |
|---|---|---|---|---|---|
| gabinetesProvinciales.js | Buenos Aires Educación | Claudia Bracchi | Flavia Terigi, Directora General de Cultura y Educación (replaced Sileoni, nov/dec-2025) | https://www.gba.gob.ar/comunicacion_publica/gacetillas/comunicado_oficial | CORRECTED |
| gabinetesProvinciales.js | Buenos Aires Infraestructura | Gabriel Katopodis | stays minister (took provincial Senate seat & licence Dec-2025) | https://www.letrap.com.ar/gabriel-katopodis-se-queda-infraestructura-y-la-campora-ocupa-su-butaca-el-senado-n5420630 | OK |
| gabinetesProvinciales.js | Córdoba Manuel Calvo | Gobierno | Jefe de Gabinete (new post, Jul-2026); successor at Gobierno not identified | https://www.perfil.com/noticias/cordoba/reestructuracion-en-el-gobierno-de-cordoba-calvo-encabezara-la-nueva-jefatura-de-gabinete.phtml | CORRECTED |
| gabinetesProvinciales.js | Córdoba Siciliano (Vinculación), Busso (Bioagroindustria) | — | confirmed Dec-2025 | Letra P (above) | OK |
| gabinetesProvinciales.js | Entre Ríos vice | Pedro Galimberti | Alicia Aluani | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina | CORRECTED |
| gabinetesProvinciales.js | Chaco vice | Silvana Romero | vacant (Schneider → Senate) | https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques | CORRECTED |
| gabinetesProvinciales.js | La Rioja vice | Florencia López (she is a national senator) | Teresita Madera | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina; https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques | CORRECTED |
| gabinetesProvinciales.js | Misiones vice | Lucas Romero | Lucas Romero Spinelli | https://en.wikipedia.org/wiki/List_of_provincial_governors_in_Argentina | CORRECTED |
| gabinetesProvinciales.js | CABA Desarrollo Económico Lombardi | — | appointed Mar-2025; ministry reportedly slated for dissolution mid-2025; current status unconfirmed | https://www.sitioandino.com.ar/politica/tras-la-fuga-presos-jorge-macri-hizo-cambios-seguridad-se-va-wolff-y-suma-lombardi-al-gabinete-caba-n5694511/amp | UNVERIFIABLE |
| gabinetesProvinciales.js | Mendoza Hacienda (Allasino) | — | post-2023 changes (Fayad→Nieri→Allasino) reported, current holder not confirmed | https://www.unidiversidad.com.ar/lisandro-nieri-es-el-nuevo-ministro-de-hacienda-y-finanzas | UNVERIFIABLE |
| gabinetesProvinciales.js | Santa Fe, Tucumán, Salta ministers | — | consistent with known appointments; no 2026 changes found | — | UNVERIFIABLE |

## sources.js
| file | field/entity | old value | verified value | source URL | status |
|---|---|---|---|---|---|
| sources.js | congresoSenado notes | — | added verification URLs/date | https://www.diputados.gob.ar/diputados/; https://www.senado.gob.ar/senadores/listados/agrupados-por-bloques | CORRECTED |
| sources.js | govOfficial.updated | Mar 2026 | Oct 2026 | — | CORRECTED |

## Events through Oct-2026 that affect freshness
- Chaco vice-governorship vacant since 10-Dec-2025 (Schneider to Senate).
- Diputados replacements: Matzkin for Ravier (24-Jun-2026), Giordano for Pitrola (26-Aug-2026); one CABA LLA seat pending incorporation.
- Bloc renames: Innovación Federal → Argentina Federal (Diputados); Movimiento por Misiones and Movere Santa Cruz (Senado).
- Córdoba created a Jefatura de Gabinete (Calvo, Jul-2026).
- Sáenz faction took over PJ Salta (2-Aug-2026; pending federal electoral court ruling).
- Ley de Glaciares reform sanctioned by Diputados 9-Apr-2026 (roll call missing in votaciones.json); Inocencia Fiscal II passed Diputados Aug-2026 (not in dataset).
- No governor changes, federal interventions or governor resignations found for 2026.
- Other data files (e.g. sociodemographic.js) may still use provisional census figures — outside this audit's scope.

## Audit — socio-demographic & labor-market data (2026-10-20)

Primary files downloaded to `dl_socio/`: INDEC `cuadros_informe_pobreza_09_26.xls` (S1 2026), `cuadros_informe_pobreza_03_25.xls` (S2 2024), `cuadros_eph_informe_09_26.xls` (Q2 2026), `cuadros_eph_informe_12_25.xls` (Q3 2025), Censo 2022 `c2022_tp_actividad_economica_c1/c3/c6.xlsx`, `c2022_tp_educacion_c1-c3.xlsx`, `censo2022_caracteristicas_economicas.pdf`, `censo2022_educacion.pdf`; Argendata CSVs (`CRECIM/provincia_pib_pc*.csv`, `CRECIM/vab_por_provincia.csv`, `ESTPRO/vab_sectorial_provincia.csv`).

National reference values: poverty S1 2026 = **32.3 %** persons (S2 2025 28.2 %, S2 2024 38.1 %); unemployment Q2 2026 = **7.9 %** (Q3 2025 = 6.6 %, so the old "Q3 2025: 6.3 %" was wrong).

Weighting: poverty pooled by persons (sheet "Poblaciones"); unemployment pooled by PEA (Cuadro 1.3). BA = Partidos GBA + Gran La Plata + Bahía Blanca-Cerri + Mar del Plata + San Nicolás-V. Constitución; SF = Gran Rosario + Gran Santa Fe; Cba = Gran Córdoba + Río Cuarto; ER = Gran Paraná + Concordia; Chubut = Comodoro + Rawson-Trelew; RN = Viedma-C. de Patagones; others single agglomerate.

| file | province/field | old | verified/new | source URL | status |
|---|---|---|---|---|---|
| sociodemographic.js | Buenos Aires / pobreza | 40.6 | 36 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old = H2-2024 weighted (multi-aglom.)) |
| sociodemographic.js | Buenos Aires / desempleo | 7.7 | 8.9 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Buenos Aires / pbg_per_capita_usd | 23517 | 23517 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Ciudad de Buenos Aires / pobreza | 16.7 | 11.1 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Ciudad de Buenos Aires / desempleo | 3.9 | 5.6 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Ciudad de Buenos Aires / pbg_per_capita_usd | 79898 | 79898 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Catamarca / pobreza | 45.8 | 37.3 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Catamarca / desempleo | 4.6 | 6.4 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Catamarca / pbg_per_capita_usd | 18600 | 18601 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | Chaco / pobreza | 60.8 | 48.6 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Chaco / desempleo | 7.4 | 7.5 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Chaco / pbg_per_capita_usd | 13500 | 18313 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | Chubut / pobreza | 35.5 | 36.4 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old = H2-2024 weighted (multi-aglom.)) |
| sociodemographic.js | Chubut / desempleo | 4.8 | 8.7 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Chubut / pbg_per_capita_usd | 40783 | 40783 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Córdoba / pobreza | 35.5 | 30.3 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old = H2-2024 weighted (multi-aglom.)) |
| sociodemographic.js | Córdoba / desempleo | 5 | 10.1 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Córdoba / pbg_per_capita_usd | 28137 | 28137 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Corrientes / pobreza | 36 | 41 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Corrientes / desempleo | 4.6 | 9.1 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Corrientes / pbg_per_capita_usd | 13291 | 13291 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Entre Ríos / pobreza | 45.1 | 42.3 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old = H2-2024 weighted (multi-aglom.)) |
| sociodemographic.js | Entre Ríos / desempleo | 4.1 | 6.5 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Entre Ríos / pbg_per_capita_usd | 22000 | 24753 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | Formosa / pobreza | 46.2 | 29.9 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Formosa / desempleo | 4.5 | 4.8 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Formosa / pbg_per_capita_usd | 13377 | 13377 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Jujuy / pobreza | 40 | 27.6 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Jujuy / desempleo | 3.9 | 3.4 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Jujuy / pbg_per_capita_usd | 16500 | 17054 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | La Pampa / pobreza | 33 | 25.4 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old ≠ H2-2024 (32.1)) |
| sociodemographic.js | La Pampa / desempleo | 7.8 | 6.7 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | La Pampa / pbg_per_capita_usd | 37186 | 37186 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | La Rioja / pobreza | 46 | 38.4 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | La Rioja / desempleo | 3.8 | 4.5 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | La Rioja / pbg_per_capita_usd | 18959 | 18959 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | UNVERIFIABLE (pbg_estimado: true) |
| sociodemographic.js | Mendoza / pobreza | 42.2 | 36.9 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Mendoza / desempleo | 5.4 | 8.1 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Mendoza / pbg_per_capita_usd | 24000 | 20240 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | Misiones / pobreza | 43 | 42.2 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old ≠ H2-2024 (43.4)) |
| sociodemographic.js | Misiones / desempleo | 4.8 | 5.9 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Misiones / pbg_per_capita_usd | 12930 | 12930 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Neuquén / pobreza | 32 | 19.6 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Neuquén / desempleo | 4.3 | 3.2 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Neuquén / pbg_per_capita_usd | 61128 | 61128 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Río Negro / pobreza | 39.4 | 33.2 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Río Negro / desempleo | 3 | 0.7 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Río Negro / pbg_per_capita_usd | 26000 | 23745 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | Salta / pobreza | 41.2 | 29.7 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Salta / desempleo | 5.4 | 4.3 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Salta / pbg_per_capita_usd | 15500 | 16261 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | San Juan / pobreza | 41 | 36.8 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old ≠ H2-2024 (42.3)) |
| sociodemographic.js | San Juan / desempleo | 3.2 | 3.2 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | San Juan / pbg_per_capita_usd | 18000 | 19961 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | San Luis / pobreza | 39 | 35.7 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old ≠ H2-2024 (39.7)) |
| sociodemographic.js | San Luis / desempleo | 2.5 | 2.6 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | San Luis / pbg_per_capita_usd | 22500 | 24079 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | Santa Cruz / pobreza | 30 | 25.6 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Santa Cruz / desempleo | 10.7 | 8.8 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Santa Cruz / pbg_per_capita_usd | 52400 | 52400 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Santa Fe / pobreza | 36 | 27.6 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old = H2-2024 weighted (multi-aglom.)) |
| sociodemographic.js | Santa Fe / desempleo | 7.2 | 10.8 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Santa Fe / pbg_per_capita_usd | 28307 | 28307 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Santiago del Estero / pobreza | 48.6 | 38.5 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Santiago del Estero / desempleo | 3.7 | 0.9 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Santiago del Estero / pbg_per_capita_usd | 15000 | 21719 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | Tierra del Fuego / pobreza | 31.8 | 25.9 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Tierra del Fuego / desempleo | 6.8 | 8.1 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Tierra del Fuego / pbg_per_capita_usd | 65967 | 65967 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | OK |
| sociodemographic.js | Tucumán / pobreza | 40.8 | 27.9 (S1 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_09_26.xls | UPDATED (old matched H2-2024) |
| sociodemographic.js | Tucumán / desempleo | 6.6 | 5.5 (Q2 2026) | https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_09_26.xls | UPDATED |
| sociodemographic.js | Tucumán / pbg_per_capita_usd | 14400 | 14437 | Argendata 2022 via diariojornada.com.ar/396983, x.com/_EncuestAR_/status/2051128136411054197, diarionorte.com/297325 | CORRECTED |
| sociodemographic.js | all / escolaridad (avg years 25+) | 9.7–13.6 | not published by INDEC (Censo 2022 publishes only asistencia & máximo nivel alcanzado) | https://www.indec.gob.ar/ftp/cuadros/poblacion/censo2022_educacion.pdf | ESTIMATE-FLAGGED (sociodemographicMeta.estimates) |
| sociodemographic.js | all / alfabetismo (10+) | 96.3–99.5 | Censo 2022 questionnaire has no literacy question (glossary lists variables; no "alfabet" table) | https://www.indec.gob.ar/ftp/cuadros/poblacion/censo2022_educacion.pdf | ESTIMATE-FLAGGED |
| sociodemographic.js | header / national refs | 38.1 (H2 24), 6.3 (Q3 25) | 32.3 (S1 26), 7.9 (Q2 26); new export `sociodemographicMeta` | INDEC xls above | UPDATED |
| sociodemographic.js | sector_clave | qualitative | not checked numerically | — | OK (qualitative) |
| censo2022_empleo_provincial.json | national + all 24 jurisdictions / pob14, pea, ocupados, desocupados, 3 rates | — | exact match | https://www.indec.gob.ar/ftp/cuadros/poblacion/c2022_tp_actividad_economica_c1.xlsx | OK |
| censo2022_categoria_ocupacional.json | national + 24 jurisdictions / patron, trabajadorFamiliar, servicioDomestico (+shares) | e.g. nat. patron 1,508,897; TF 970,167; SD 593,051 | patron 970,167; TF 593,051; SD 1,508,897 (INDEC column order: Serv. doméstico, Empleada/o, Cuenta propia, Patrón, Trab. familiar, Ignorado) | censo2022_caracteristicas_economicas.pdf p.47-48 table; c2022_tp_actividad_economica_c3.xlsx & c6.xlsx (row "hogares como empleadores" = 1,508,897 in SD column) | CORRECTED (rotation bug; same bug in scripts/build_censo2022_categoria.py — not edited) |
| censo2022_categoria_ocupacional.json | ocupados, empleadaObrera, cuentaPropia, ignorado (all 25 rows) | — | exact match | same | OK |
| censo_pub_priv.json | national / private | 16,461,649 | 15,961,649 (= Σ provinces; national components now sum to total 21,094,987) | internal consistency + Censo ocupados total (c1.xlsx) | CORRECTED (typo +500,000) |
| censo_pub_priv.json | 24 provinces / total | — | each equals Censo ocupados (c1.xlsx) and components sum to total | c2022_tp_actividad_economica_c1.xlsx | OK |
| censo_pub_priv.json | public/private split | — | Redatam P33 processing; not reproducible without Redatam | — | UNVERIFIABLE (plausible) |
| vab_provincial.json | vab_total (BA, CABA, Catamarca, Córdoba, Neuquén) | 193076.2 / 119523.9 / 4091.2 / 47892.3 / 23045.2 | exact match with Argendata VAB **2023**, millones de pesos de 2004 | https://raw.githubusercontent.com/argendatafundar/data/main/CRECIM/vab_por_provincia.csv | OK (vintage = 2023; file has no source field) |
| vab_provincial.json | share_dominante (Neuquén 52.86, BA 29.45, SC 38.48, TdF 27.72, San Luis 36.2, Corrientes 25.88) | — | Argendata ESTPRO 2022: 49.72 / 30.18 / 38.31 / 29.45 / 36.55 / 25.85 — close, consistent with a 2023 CEPAL update not in Argendata's sectoral CSV | https://raw.githubusercontent.com/argendatafundar/data/main/ESTPRO/vab_sectorial_provincia.csv | OK (approx., exact 2023 sector table not retrieved) |
| sources.js | census2022, ephPoverty, ephUnemployment, fundarArgendata, cepalProvincial, censo2022Empleo | H2 2024 / Q3 2025 / 6,3 % / cuadros 4.1-4.2 | S1 2026 / Q2 2026 / 32,3 % / 7,9 % / cuadros 1 y 3; VAB vintage 2023; estimate notes | — | UPDATED |
| i18n es/en | legend.poverty, employment.ephLabel, employment.footer | S2 2024/H2 2024, EPH Q3 2025, EPH Q3-25 | S1 2026/H1 2026, EPH Q2 2026, EPH Q2-26 | — | UPDATED |

## Notes
- Old poverty values were genuinely H2 2024 for most single-agglomerate provinces (Jujuy 40.0, Neuquén 32.0, Santa Cruz 30.0, Corrientes 36.0 were real), but San Luis (39.0 vs 39.7), San Juan (41.0 vs 42.3), La Pampa (33.0 vs 32.1), Misiones (43.0 vs 43.4) did not match. Córdoba used Gran Córdoba only.
- Old unemployment did not consistently match Q3 2025 (e.g. Mendoza 5.4 vs 6.2; national 6.3 vs 6.6).
- PBG sources are press reproductions of the Argendata 2022 table (primary chart CSV not reachable); Fundar's jul-2026 republication (La Nación, 30-jul-2026) uses another base and was not mixed in.
- None of the three census JSONs nor vab_provincial.json is imported by any src component today (orphan data).

## Component hardcodes (not edited)
- src/components/economy/EmploymentSection.jsx:16 `EPH_NATIONAL_UNEMPLOYMENT = 6.3` → should be 7.9 (or import sociodemographicMeta.desempleo.national)
- src/components/economy/EmploymentSection.jsx:65 label `Q3-25` → Q2-26
- src/components/panels/OverviewPanel.jsx:204 "INDEC EPH H2 2024" → S1 2026
- src/components/panels/OverviewPanel.jsx:211 "INDEC EPH 2024 Q2" → Q2 2026
- src/components/ProvincePanel.jsx:251 "INDEC EPH H2 2024"; :252 "INDEC EPH 2024 Q2"
- src/components/Legend.jsx:48 'Poverty (EPH urban, H2 2024)'
- src/lib/indicators.js:73-74 VINTAGES `'EPH · 1er sem. 2025'`, `'EPH · 2º trim. 2025'` → 'EPH · 1er sem. 2026', 'EPH · 2º trim. 2026'; :122-123 escolaridad labelled "INDEC — Censo 2022" (not an official INDEC indicator)

## Audit — Provincial fiscal & public/formal employment data (2026-10-20)

## Verdict on the fiscal-dependency conflict
- **Neither dataset was right; dnap_fiscal.json's line items were correct but its formula was too narrow; fiscalData.js values were not reproducible from any official cut** (e.g. Buenos Aires 58% vs 40.8% official 2024 / 42.3% 2025).
- Old `dnap_fiscal.json` formula: Trib. Origen Nacional / (Trib. Origen Provincial + Regalías + Otros No Trib. + Trib. Origen Nacional). It omits social-security contributions, sales, property income, capital revenue from the denominator and **non-automatic national transfers (Transferencias corrientes + de capital)** from the numerator.
- **Adopted formula (official):** Dependencia = (Tributarios de Origen Nacional + Transferencias Corrientes + Transferencias de Capital) / Ingresos Totales (I+IV) × 100 = **100 − "Autonomía Fiscal"** published by DNAP (Indicadores AIF cierre 2025, Ingresos Propios / Ingresos Totales). Recomputed from serie_aif-apnf-2025.xlsx it matches DNAP's indicator **to 0.1 pp in all 24 jurisdictions for both 2024 and 2025**.
- Year: **2025** (cierre provisorio IV trim.); La Pampa = 2024 in dnap_fiscal.json (its 2025 execution is blank in the series and in the IV-trim file); fiscalData.js uses DNAP's 2025 indicator for La Pampa (autonomía 45.9% → 54%).
- Semantics fix that also corrects the UI: `nationalTransfers − coparticipation` was labelled "discrecionales / non-automatic" in FiscalTriptych/NationalEconomy, but in the old file it equalled Fin. Educativo + "Otros de Origen Nacional" — both **automatic**. Now `coparticipation` = all automatic transfers (Trib. Origen Nacional), `nationalTransfers` = automatic + non-automatic, so the difference is truly non-automatic (`nonAutomaticTransfers`). Pure Ley 23.548 secondary distribution kept as `coparticipationNet`. Old ratio kept as `dependencyTax`. A `fields` dictionary and `units` ("Millones de pesos corrientes") were added.
- Note: Santiago del Estero 2025 autonomy jumps to 34% (14.5% in 2024) because of $922,387M of Rentas de la Propiedad — official figure, flagged in comments.

## Table
| file | province/field | old | verified/new | source URL | status |
|---|---|---|---|---|---|
| fiscalData.js | Buenos Aires / transferencias_pct | 58 (2023, unsourced) | 42 (2025; DNAP autonomía 57.7%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Ciudad de Buenos Aires / transferencias_pct | 12 (2023, unsourced) | 18 (2025; DNAP autonomía 81.9%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Catamarca / transferencias_pct | 87 (2023, unsourced) | 82 (2025; DNAP autonomía 18.0%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Chaco / transferencias_pct | 91 (2023, unsourced) | 73 (2025; DNAP autonomía 26.7%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Chubut / transferencias_pct | 55 (2023, unsourced) | 35 (2025; DNAP autonomía 65.0%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Córdoba / transferencias_pct | 56 (2023, unsourced) | 45 (2025; DNAP autonomía 54.8%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Corrientes / transferencias_pct | 83 (2023, unsourced) | 71 (2025; DNAP autonomía 28.6%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Entre Ríos / transferencias_pct | 74 (2023, unsourced) | 60 (2025; DNAP autonomía 40.3%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Formosa / transferencias_pct | 93 (2023, unsourced) | 75 (2025; DNAP autonomía 25.1%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Jujuy / transferencias_pct | 84 (2023, unsourced) | 76 (2025; DNAP autonomía 23.7%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | La Pampa / transferencias_pct | 68 (2023, unsourced) | 54 (2025; DNAP autonomía 45.9%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | La Rioja / transferencias_pct | 91 (2023, unsourced) | 86 (2025; DNAP autonomía 14.0%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Mendoza / transferencias_pct | 62 (2023, unsourced) | 54 (2025; DNAP autonomía 46.1%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Misiones / transferencias_pct | 78 (2023, unsourced) | 56 (2025; DNAP autonomía 44.2%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Neuquén / transferencias_pct | 30 (2023, unsourced) | 14 (2025; DNAP autonomía 85.5%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Río Negro / transferencias_pct | 71 (2023, unsourced) | 59 (2025; DNAP autonomía 40.7%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Salta / transferencias_pct | 75 (2023, unsourced) | 71 (2025; DNAP autonomía 29.0%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | San Juan / transferencias_pct | 82 (2023, unsourced) | 76 (2025; DNAP autonomía 24.3%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | San Luis / transferencias_pct | 70 (2023, unsourced) | 74 (2025; DNAP autonomía 25.8%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Santa Cruz / transferencias_pct | 50 (2023, unsourced) | 40 (2025; DNAP autonomía 60.3%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Santa Fe / transferencias_pct | 57 (2023, unsourced) | 50 (2025; DNAP autonomía 50.3%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Santiago del Estero / transferencias_pct | 88 (2023, unsourced) | 66 (2025; DNAP autonomía 34.0%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Tierra del Fuego / transferencias_pct | 43 (2023, unsourced) | 52 (2025; DNAP autonomía 48.4%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| fiscalData.js | Tucumán / transferencias_pct | 79 (2023, unsourced) | 69 (2025; DNAP autonomía 30.8%) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx ; https://www.argentina.gob.ar/sites/default/files/indicadores_aif_2025_0.pdf | CORRECTED |
| dnap_fiscal.json | Buenos Aires / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 9,701,952.3 / 0.0 / 416,623.8 / 9,368,302.8 / 6,946,613.9 / 10,400,465.5 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Buenos Aires / dependency | 48.1 (2024, narrow ratio) | 42.3 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=48.8 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Buenos Aires / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 9,368,302.8 · 6,946,613.9 · n/a · 19,486,878.8 (2024; totalRevenue was own+trib.nac only) | 14,604,888.8 · 13,691,853.9 · 913,034.8 · 34,522,844.8 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Ciudad de Buenos Aires / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 6,923,280.5 / 0.0 / 262,777.0 / 926,655.8 / 726,367.9 / 4,044,771.8 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Ciudad de Buenos Aires / dependency | 11.4 (2024, narrow ratio) | 18.1 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=11.2 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Ciudad de Buenos Aires / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 926,655.8 · 726,367.9 · n/a · 8,112,713.3 (2024; totalRevenue was own+trib.nac only) | 2,445,513.5 · 1,310,197.9 · 1,135,315.5 · 13,546,590.0 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Córdoba / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 2,043,053.6 / 0.0 / 436,690.7 / 3,565,932.9 / 3,044,266.8 / 2,574,716.7 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Córdoba / dependency | 59.0 (2024, narrow ratio) | 45.2 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=54.9 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Córdoba / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 3,565,932.9 · 3,044,266.8 · n/a · 6,045,677.1 (2024; totalRevenue was own+trib.nac only) | 5,366,290.4 · 5,021,540.3 · 344,750.0 · 11,861,922.4 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Santa Fe / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 1,880,950.0 / 0.0 / 61,084.1 / 3,662,405.6 / 3,149,862.6 / 3,006,265.9 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Santa Fe / dependency | 65.3 (2024, narrow ratio) | 49.7 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=63.4 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Santa Fe / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 3,662,405.6 · 3,149,862.6 · n/a · 5,604,439.8 (2024; totalRevenue was own+trib.nac only) | 5,333,952.3 · 5,155,859.3 · 178,093.0 · 10,728,945.3 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Mendoza / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 987,889.0 / 154,485.6 / 179,639.1 / 1,664,045.6 / 1,383,200.9 / 1,230,010.2 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Mendoza / dependency | 55.7 (2024, narrow ratio) | 53.9 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=54.7 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Mendoza / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 1,664,045.6 · 1,383,200.9 · n/a · 2,986,059.4 (2024; totalRevenue was own+trib.nac only) | 2,426,731.0 · 2,377,210.8 · 49,520.3 · 4,503,702.3 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Neuquén / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 1,151,756.3 / 1,545,683.8 / 213,878.2 / 709,051.6 / 583,909.3 / 2,135,121.8 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Neuquén / dependency | 19.6 (2024, narrow ratio) | 14.5 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=18.6 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Neuquén / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 709,051.6 · 583,909.3 · n/a · 3,620,369.9 (2024; totalRevenue was own+trib.nac only) | 1,073,408.8 · 1,018,357.6 · 55,051.2 · 7,402,259.7 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Chubut / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 398,137.4 / 377,344.4 / 135,838.4 / 645,727.6 / 533,947.5 / 955,457.9 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Chubut / dependency | 41.5 (2024, narrow ratio) | 35.0 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=42.7 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Chubut / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 645,727.6 · 533,947.5 · n/a · 1,557,047.8 (2024; totalRevenue was own+trib.nac only) | 961,639.5 · 930,533.9 · 31,105.6 · 2,743,747.3 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Santa Cruz / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 280,684.2 / 339,173.9 / 62,661.8 / 640,870.6 / 560,750.2 / 762,138.2 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Santa Cruz / dependency | 48.4 (2024, narrow ratio) | 39.7 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=48.5 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Santa Cruz / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 640,870.6 · 560,750.2 · n/a · 1,323,390.5 (2024; totalRevenue was own+trib.nac only) | 924,875.3 · 907,861.1 · 17,014.1 · 2,331,646.4 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Misiones / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 777,299.9 / 16,849.9 / 48,391.3 / 1,347,643.2 / 1,088,573.1 / 916,722.2 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Misiones / dependency | 61.5 (2024, narrow ratio) | 55.8 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=64.1 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Misiones / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 1,347,643.2 · 1,088,573.1 · n/a · 2,190,184.2 (2024; totalRevenue was own+trib.nac only) | 2,100,708.3 · 1,984,759.1 · 115,949.2 · 3,763,367.3 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Tierra del Fuego / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 209,024.6 / 47,238.3 / 82,504.1 / 493,309.6 / 446,260.2 / 513,870.5 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Tierra del Fuego / dependency | 59.3 (2024, narrow ratio) | 51.6 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=59.2 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Tierra del Fuego / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 493,309.6 · 446,260.2 · n/a · 832,076.6 (2024; totalRevenue was own+trib.nac only) | 729,166.5 · 698,622.7 · 30,543.9 · 1,412,749.9 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Formosa / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 104,038.9 / 1,973.1 / 6,633.3 / 1,456,963.3 / 1,280,091.2 / 582,233.1 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Formosa / dependency | 92.8 (2024, narrow ratio) | 74.9 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=88.5 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Formosa / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 1,456,963.3 · 1,280,091.2 · n/a · 1,569,608.7 (2024; totalRevenue was own+trib.nac only) | 2,083,073.7 · 2,065,122.9 · 17,950.8 · 2,780,994.4 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | La Rioja / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 99,814.3 / 0.0 / 928.3 / 822,190.7 / 727,168.4 / 449,476.2 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | La Rioja / dependency | 89.1 (2024, narrow ratio) | 86.0 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=88.1 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | La Rioja / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 822,190.7 · 727,168.4 · n/a · 922,933.4 (2024; totalRevenue was own+trib.nac only) | 1,173,687.6 · 1,163,068.0 · 10,619.7 · 1,364,783.1 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | Salta / 2024 ownTaxes, royalties, otherNonTax, nationalTransfers(=Trib. Origen Nacional), coparticipation(=Distr. Sec. Neta), personnel | 581,927.7 / 31,365.4 / 46,274.5 / 1,556,021.4 / 1,288,172.3 / 1,281,178.7 | match serie_aif-apnf-2024_1.xlsx exactly (labels correct, units = millones de $ corrientes) | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2024_1.xlsx | OK (values) |
| dnap_fiscal.json | Salta / dependency | 70.2 (2024, narrow ratio) | 71.0 (2025; = 100 − DNAP Autonomía Fiscal); old ratio kept as dependencyTax=72.7 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | CORRECTED+UPDATED |
| dnap_fiscal.json | Salta / 2025 nationalTransfers · coparticipation(auto) · nonAutomatic · totalRevenue | 1,556,021.4 · 1,288,172.3 · n/a · 2,215,589.0 (2024; totalRevenue was own+trib.nac only) | 2,337,513.2 · 2,283,771.6 · 53,741.6 · 3,294,558.5 | https://www.argentina.gob.ar/sites/default/files/serie_aif-apnf-2025.xlsx | UPDATED (redefined, see notes) |
| dnap_fiscal.json | all / lastUpdated, source, formula | "2024", APNF 2005-2024, narrow formula | "2025", serie_aif-apnf-2025.xlsx, official formula + units + fields | https://www.argentina.gob.ar/economia/sechacienda/coordinacion-fiscal-provincial/ejecucion-presupuestaria-provincial/ejecuciones | UPDATED |
| dnap_fiscal.json | all / timeSeries | 2005-2024, own/transfers on narrow basis | 2005-2025, own = Ingresos Totales − nacional; transfers = nacional; added auto/nonAuto per year | serie_aif-apnf-2025.xlsx | UPDATED |
| dnap_fiscal.json | Buenos Aires / totalCurrentRevenue 2024 | 24,155,049.1 | 23,975,098.6 in the 2025 file (DNAP revised 2024) | serie_aif-apnf-2025.xlsx | UPDATED (revision) |
| fiscalSeries.json | 24 provinces / series | empty seed | 2005-2025 annual: recursos_propios, transferencias_automaticas, transferencias_discrecionales (= transf. corrientes + capital), gasto_total, ingresos_totales, dependencia_pct (nominal $M; NOT deflated — real own revenue not computed) | serie_aif-apnf-2025.xlsx | UPDATED |
| sipa_employment.json | 24 provinces / private (Nov-2023 puestos) | e.g. BA 2,111,440; CABA 1,593,973; Córdoba 550,629; Santa Fe 548,968; Neuquén 143,546; Formosa 25,295 | identical, recomputed from CEP CDN puestos_priv.csv (por-provincia-clae2) | https://cdn.produccion.gob.ar/cdn-cep/datos-por-provincia/por-provincia-clae2/puestos/puestos_priv.csv | OK (24/24) |
| sipa_employment.json | limitations[0] caja-propia list | listed CABA, omitted La Pampa | 13 non-transferred: BA, Cba, SF, Chaco, Chubut, Corrientes, ER, Formosa, La Pampa, Misiones, Neuquén, SC, TdF (CABA transferred) | ST nota metodológica (trabajoregistrado_2607) | CORRECTED |
| sipa_employment.json | stLatest (new block) | — | Private salaried persons by province, Nov-2023 vs Jul-2026 (e.g. BA 2,023,221 → 1,902,951; Neuquén 143,568 → 156,361; Santa Cruz 60,867 → 49,096) | https://www.argentina.gob.ar/sites/default/files/trabajoregistrado_2607_estadisticas.xlsx (A.5.1) | UPDATED |
| sipa_pub_priv.json | Formosa, La Rioja, Chaco, BA, Córdoba, Santa Fe, Neuquén, CABA / public (Nov-2023) | 69,308; 64,424; 116,669; 1,291,766; 237,178; 257,359; 96,226; 340,490 | identical, recomputed from CDN puestos_depto_pub.csv | https://cdn.produccion.gob.ar/cdn-cep/datos-por-departamento/puestos/puestos_depto_pub.csv | OK |
| sipa_pub_priv.json | national private/public | 6,612,937 / 3,940,274 | OK but excludes unassigned-department puestos (38,960 priv / 26,062 pub); with them pub = 3,966,336 — added nationalNote | same CDN files | OK (+note) |
| sipa_pub_priv.json | discontinuedNote "discontinued Nov 2023" | claim | Verified: CDN still ends 2023-11-01 (both per-depto and per-provincia CLAE2) as of 2026-10-20 | CDN above | OK (reworded) |
| sipa_pub_priv.json | stNational (new) | — | ST persons: Nov-2023 priv 6,385,764 / pub 3,484,305; Jul-2026 priv 6,082,314 / pub 3,384,789 (provisional) | trabajoregistrado_2607_estadisticas.xlsx (T.2.1) | UPDATED |
| sipa_pub_priv.json | cajaPropiaNote (SIPA-público excludes caja-propia provincial staff) | claim | Consistent with ST methodology for SIPA proper; but CEP per-depto public counts look high for that (BA 1.29M public puestos vs DNAP 657k provincial cargos) — cannot confirm CEP's treatment | ST nota metodológica | UNVERIFIABLE |
| dnap_empleo_provincial.json | national 2024 employees / ratio | 2,321,510 / 50.14 | matches old xlsx; revised 2,316,387 / 50.03; **2025: 2,308,763 / 49.77** | https://www.argentina.gob.ar/sites/default/files/ocupacion_salarios_2017_2025.xlsx | UPDATED |
| dnap_empleo_provincial.json | Buenos Aires | 657,328 / 37.71 (2024) | 2025: 655,614 / 37.59 | same | UPDATED |
| dnap_empleo_provincial.json | Córdoba | 131,305 / 33.27 | 2025: 130,135 / 32.88 | same | UPDATED |
| dnap_empleo_provincial.json | Santa Fe | 151,850 / 41.27 | 2025: 152,870 / 41.49 | same | UPDATED |
| dnap_empleo_provincial.json | Neuquén | 77,560 / 111.05 | 2025: 79,839 / 113.60 | same | UPDATED |
| dnap_empleo_provincial.json | Tierra del Fuego | 25,618 / 141.33 | 2025: 25,422 / 139.68 | same | UPDATED |
| dnap_empleo_provincial.json | Salta | 85,940 / 58.05 (2024) | 2024 revised 77,814 / 52.57; 2025: 72,396 / 48.70 | same | CORRECTED+UPDATED |
| dnap_empleo_provincial.json | ratioPer1000 calc | — | checked employees/population×1000 = DNAP ratio (±0.02) for all 24 in 2025 | same | OK |
| dnap_empleo_provincial.json | timeSeries 2017-2024 | old file | replaced with revised 2017-2025 file; 1987-2016 kept | same + ejec-presupuestaria-ocupacion_salarios_1.xlsx | UPDATED |
| dnap_empleo_provincial.json | scope label | "AC+OD+CE" | new file labelled "Administración Pública No Financiera" (2024 diff < 0.3%) | same | UPDATED |
| biep_breakdown.json | national | 711,000 | 711,879 | https://www.argentina.gob.ar/noticias/se-realizo-la-conferencia-magistral-mito-y-realidad-sobre-el-empleo-publico | CORRECTED |
| biep_breakdown.json | provincial | 2,237,900 | 2,237,334 | same | CORRECTED |
| biep_breakdown.json | municipal | 441,000 | 440,687 | same | CORRECTED |
| biep_breakdown.json | total | 3,389,900 | 3,389,900 | same | OK |
| biep_breakdown.json | national detail 193,346 / 201,857 | exact values | Only "395 mil APN, 193 mil civiles" published; third row recomputed as residual 316,676 | https://argentina.gob.ar/sites/default/files/2023/09/presentacion_empleo_publico_25-09-23_vf_1.pdf | UNVERIFIABLE (exact) / CORRECTED (residual) |
| biep_breakdown.json | provincial detail label "AC+OD (DNAP)" | label | Source gives no DNAP attribution; DNAP 2022 = 2,275,751 ≠ 2,237,334 → relabelled | — | CORRECTED |
| biep_breakdown.json | newer figures | none | INDEC dotación APN+empresas Aug-2026 = 269,025; ST public salaried Jul-2026 = 3,384,789; no newer 3-level breakdown exists | https://www.indec.gob.ar/uploads/informesdeprensa/dotacion_personal_apn_09_2679845EB044.pdf | UPDATED (context block) |
| sources.js | meconDnap | updated 2024, generic URL | 2025 (IV trim provisorio; La Pampa 2024), ejecuciones URL, formula note | — | UPDATED |
| sources.js | dnapEmpleoProvincial | 2024, AC+OD+CE | 2025, APNF, revised series | — | UPDATED |
| sources.js | biep / cepxxiSipa / sipaDeptoPubPriv / minTrabajo | — | exact figures, still-discontinued confirmation, pointer to ST Jul-2026 | — | UPDATED |

## Stale / not done
- sources.js `meconDnapDeuda` says 3T 2025; DNAP has published stock at II trim 2026 (stock_ii_trim_2026.xlsx). Not edited (the underlying debt data file is not in my scope).
- `secHaciendaTop` still "2024" (TOP data not audited).
- `scripts/process_fiscal.py` still points at serie_aif-apnf-2024_1.xlsx and the old formula — re-running it will **overwrite** the corrected dnap_fiscal.json. The scratchpad generator (work/build_fiscal.py) implements the new formula. Same for scripts/build_dnap_empleo.py (old xlsx) and scripts/process-fiscal-series.mjs (expects CSVs).
- Real (deflated) own revenue not computed (needs IPC deflator).
- NationalEconomy aggregate mixes La Pampa 2024 with 2025 for the others.

## Component usage (for UI unification)
- fiscalData.js (hand table): src/components/ProvincePanel.jsx:9, :230-245 (color by transferencias_pct); src/components/mobile/MobileProvinceTab.jsx:3, :211, :216, :257, :279.
- dnap_fiscal.json: src/components/shared/FiscalTriptych.jsx:5, :14, :66-95 (dependency, ownTotal, nationalTransfers, coparticipation → "discrecional"); src/components/panels/NationalEconomy.jsx:10, :197-210 (aggregate & ranking); src/hooks/useEconomyData.js:3, :25, :37 → consumed by src/components/economy/FiscalSection.jsx:73-107 and src/components/economy/EconomySummary.jsx:19-80; src/lib/indicators.js:11, :172-174; ProvincePanel.jsx:265 tooltip.
- Employment: EmploymentSection.jsx:12-13; NationalEconomy.jsx:7-9, :140-174 (biep.levels, sipaContext); MobileNationTab.jsx:4-6, :200-205; indicators.js:12-13; useEconomyData.js:2.
- Recommendation: drop fiscalData.js and read `dependency` from dnap_fiscal.json in ProvincePanel/MobileProvinceTab (now consistent anyway).
