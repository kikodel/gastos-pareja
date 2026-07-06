# Estado del proyecto — Gastos Familiares

> Este archivo es un resumen de contexto para retomar el desarrollo (arquitectura, decisiones, pendientes).
> Para instrucciones de uso y setup paso a paso, ver [README.md](README.md).

## Qué es

Bot de WhatsApp + dashboard web para que varias familias registren y controlen sus gastos, compartiendo un mismo bot de Twilio pero con datos completamente separados (una Google Sheet por familia).

## Deploy actual

- **Repo**: https://github.com/kikodel/gastos-pareja
- **Producción**: https://gastos-pareja-production-ebf7.up.railway.app/ (Railway, redeploy automático en cada push a `master`)
- **WhatsApp**: Twilio Sandbox, número `+1 415 523 8886`, código de join `distance-sport`

## Familias configuradas (en `GRUPOS_JSON`, variable de entorno en Railway)

| Grupo | Integrantes |
|---|---|
| `fede` | Federico, Cande |
| `nestor-pri` | Nestor, Pri |
| `sergio-cati` | Sergio, Cati |
| `aldo-ana` | Aldo, Ana |

(Las contraseñas de cada dashboard y las credenciales viven solo en `.env` local y en las variables de Railway — no están en este archivo ni en git.)

## Stack

- **Backend**: Node.js + Express. Google Sheets como base de datos (via `googleapis`, service account). Twilio SDK para WhatsApp. `@anthropic-ai/sdk` (Claude) para categorización, preguntas y extracción de PDFs.
- **Frontend**: React + Vite + Recharts, servido como estático por el mismo Express.
- **Hosting**: Railway (Nixpacks, Node 18 — importante, ver limitaciones).

## Funcionalidades implementadas

1. **Registro de gastos por WhatsApp** — mensaje `<monto> <descripcion>`, parseo tolerante a `$`, miles con `.`, decimales con `,`.
2. **Multi-familia** — un bot, un número, varias Google Sheets. Config en `GRUPOS_JSON`.
3. **Dashboard con contraseña por familia** — opcional por grupo, validada server-side (no solo en el cliente).
4. **Categorización**: palabras clave primero (`server/config/categorias.js`), Claude Haiku como fallback si ninguna matchea.
5. **Ingreso mensual, meta de ahorro y límites por categoría** (como % del ingreso) — configurables desde el dashboard, guardados en una pestaña "Config" auto-creada en cada Sheet. Alertas por WhatsApp (al cruzar el límite) y visuales en el dashboard.
6. **Eliminar un gasto** desde la tabla del dashboard (botón 🗑️, con confirmación).
7. **Preguntas por WhatsApp** ("¿cuánto gasté en...?") respondidas por Claude, con los totales pre-calculados en código (no por la IA, para evitar errores de suma) y solo el texto de la respuesta generado por el modelo.
8. **Gastos en cuotas por WhatsApp** (`12000 zapatillas 6 cuotas`) — genera una fila por mes, con el monto ya prorateado.
9. **Importar resumen de tarjeta en PDF** — subida desde el dashboard o mandando el PDF directo por WhatsApp (como documento). Extrae texto (`pdf-parse` v1.1.1 — **no usar v2**, ver limitaciones) y le pide a Claude Sonnet que identifique los consumos (incluyendo cuotaActual/cuotasTotal como campos separados, si el resumen lo indica). Siempre pasa por una tabla de revisión editable antes de guardar nada; cada fila tiene un selector de tipo (Cuota única / Cuotas / Débito automático) y se puede quitar directamente de la lista.
10. **Proyección: "Pendiente para el próximo mes" y "Cuotas activas"** — agrupa las cuotas por descripción+persona (no por mensaje original, para que cuotas de WhatsApp e importadas del mismo PDF se reconozcan igual) y proyecta las cuotas restantes cuando no hay filas futuras reales, marcándolas como "(estimado)". Si al importar un PDF se marca un item como "Cuotas" (con cuota actual/total), se generan directamente las filas reales de los meses restantes — dejan de necesitar la proyección estimada.
11. **Dashboard mobile con más dinamismo** — en pantallas chicas, "Total del mes" y "Pendiente próximo mes" se muestran en un carrusel horizontal con scroll-snap; los filtros de Mes/Categoría/Persona son chips deslizables en vez de selects apilados; los montos grandes animan con un count-up al cargar o cambiar de filtro; las tarjetas hacen un fade-in suave al cambiar de mes/categoría/persona; "Cuotas activas" muestra una barra de progreso animada además del texto "N/M"; y la carga inicial usa skeleton loaders en vez de un texto plano "Cargando...".
12. **Detección de posibles duplicados al importar PDF** — cada item extraído se compara contra los gastos ya cargados (misma descripción normalizada, mismo monto, mismo mes); si hay match, la fila queda resaltada, con un aviso "posible duplicado" y desmarcada por defecto para que el usuario decida conscientemente si de verdad quiere incluirla.
13. **"Últimos gastos" como lista de tarjetas en mobile** — en vez de la tabla con scroll horizontal, cada gasto se muestra como una tarjeta apilada (descripción + monto arriba, fecha/persona/categoría abajo). El gráfico de torta dejó de mostrar porcentajes flotantes sobre las porciones (se superponían en pantallas chicas) y ahora el porcentaje aparece en la leyenda.

## Decisiones de diseño importantes (y por qué)

- **Sandbox de Twilio no soporta grupos de WhatsApp reales** — cada persona le escribe al bot 1 a 1, no hay un grupo compartido. Limitación de la versión gratuita.
- **PDF: siempre con revisión manual antes de guardar**, nunca auto-import ciego. Se probó con un resumen real (Tarjeta Naranja) y la IA cometió al menos un error real (un débito de plan Toyota mal etiquetado como cuota) — la revisión es la que lo hubiera detectado.
- **Cuotas de WhatsApp generan filas reales futuras automáticamente.** Las de PDF, en cambio, requieren que el usuario marque el item como "Cuotas" (con cuota actual/total) en la tabla de revisión antes de confirmar — recién ahí se generan las filas de los meses restantes. Si no se marca (o Claude no lo detectó y el usuario no lo corrige), queda como una sola fila y el dashboard la proyecta como "(estimado)" en vez de tener datos reales.
- **`calcularCuotasActivas` determina la cuota "actual" solo mirando filas cuya fecha ya llegó** (pasada o del mes en curso), nunca filas futuras. Esto es necesario porque tanto las cuotas de WhatsApp como las de PDF marcadas como "Cuotas" generan de una vez todas las filas futuras reales — si se usara el número de cuota más alto entre todas las filas sin filtrar por fecha, una compra recién cargada con todas sus cuotas ya generadas parecería "saldada" desde el primer día.
- **Categorización y preguntas**: la IA nunca hace cuentas — todos los totales/sumas se calculan en código; Claude solo clasifica o redacta texto. Esto evitó un bug real donde Haiku sumaba mal una lista larga de gastos.

## Limitaciones conocidas / cuidado al tocar

- **Railway corre Node 18.20.5.** `pdf-parse` v2.x bundla una versión de pdf.js que necesita `process.getBuiltinModule` (Node 22+) y **crashea el proceso entero** en producción si se instala. Usar siempre `pdf-parse@1.1.1` (API con función directa, no la clase `PDFParse`).
- **Las respuestas de Claude Sonnet pueden traer un bloque `{type: "thinking"}` antes del texto.** Nunca asumir `respuesta.content[0].text` — usar el helper `extraerTexto()` de `server/services/claudeService.js`, que busca el bloque `type: "text"`.
- **Las importaciones pendientes de WhatsApp (PDF recibido como documento) viven en memoria** (`server/services/importacionesPendientesService.js`), no en la Sheet. Se pierden si el servidor se reinicia, y expiran a las 24hs.
- El archivo `gastos-501317-f21bc1f4f122.json` (clave del service account) está en la carpeta del proyecto pero **gitignoreado** — no debería subirse nunca a git.

## Ideas charladas pero no implementadas todavía

- Enviar fotos de comprobantes (no PDF) para que la IA lea un ticket individual — se descartó por ahora a favor de las cuotas/PDF.
- Compromiso total en cuotas a futuro (no solo el próximo mes, sino todos los meses pendientes).
- Proyección de fin de mes según ritmo de gasto actual.
- Top gastos del mes (los N más grandes).
- Botón para borrar todas las cuotas de una compra en cuotas de una sola vez (hoy hay que borrar fila por fila).
