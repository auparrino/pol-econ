# Atlas Federal — Argentina, provincia por provincia

Tablero público que cruza política y economía de las 24 jurisdicciones argentinas con datos oficiales, cada uno con su fuente y su fecha.

## Qué se puede hacer

- **Mapa**: colorear las provincias por partido o postura del gobernador, pobreza, desempleo, producto per cápita, exportaciones por habitante, empleo privado registrado, dependencia fiscal, empleo público, votos de sus legisladores con el Ejecutivo, población o densidad. Capas de minería, hidrocarburos, refinerías y centrales eléctricas.
- **Resumen de provincia**: en qué puesto está la provincia en cada indicador frente a las otras 23, su mejor y su peor posición, y su gobierno.
- **Rankings y comparador** (botón del encabezado o pestaña *Ranking* en el celular):
  - *Ranking*: las 24 ordenadas por indicador, con el promedio del país, o la tabla completa ordenable. Se descarga en CSV.
  - *Comparar provincias*: dos o tres provincias lado a lado.
  - *Relaciones*: cruza dos indicadores en un gráfico de dispersión con su correlación, e incluye preguntas guía (por ejemplo, "¿las provincias que más dependen de Nación son más pobres?").
  - *Fuentes y método*: de dónde sale cada dato, de cuándo es y qué se verificó.
- **Links compartibles**: la provincia, el modo de mapa y la vista abierta se guardan en la URL (`#p=salta&m=pobreza&v=ranking`).

## Datos

Todos los indicadores comparables pasan por `src/lib/indicators.js`, así que el mapa, los rankings, el comparador y las fichas muestran exactamente la misma cifra. La auditoría completa de octubre de 2026, con cada valor corregido y su fuente, está en [`docs/auditoria-datos-2026-10.md`](docs/auditoria-datos-2026-10.md).

## Desarrollo

```bash
npm ci
npm run dev     # servidor local
npm run build   # build de producción (se publica en GitHub Pages)
npm run lint
```
