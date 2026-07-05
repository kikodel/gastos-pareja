# Gastos de la pareja

Registra gastos mandando un mensaje de WhatsApp al bot, los guarda en una Google Sheet y los muestra en un dashboard categorizado. Soporta varios **grupos familiares** (por ejemplo, vos y tu pareja, y por separado la familia de tu hermano) compartiendo el mismo bot y numero de WhatsApp, cada uno con su propia planilla y su propio dashboard filtrado.

## Como se manda un gasto

Escribile al numero de WhatsApp del bot con el formato:

```
<monto> <descripcion>
```

Ejemplos: `150 supermercado`, `$3200 nafta auto`, `gaste 150 en supermercado`, `$1.500,50 farmacia`.

El bot responde confirmando el monto, la categoria detectada y quien lo registro. Si no puede reconocer el monto, te pide que lo reformules.

### Gastos en cuotas

Si agregas la cantidad de cuotas al mensaje, el bot divide el monto total en partes iguales y genera un gasto por mes (uno este mes, y el resto en los meses siguientes), en vez de cargar todo de una vez:

```
12000 zapatillas 6 cuotas
```

Esto crea 6 gastos de $2.000 (`zapatillas (cuota 1/6)`, `zapatillas (cuota 2/6)`, etc.), uno por mes, empezando este mes. Si la division no es exacta, el ultimo mes absorbe la diferencia de redondeo (para que la suma total sea siempre exacta). Las alertas de limite por categoria y meta de ahorro solo consideran el monto de la cuota de ese mes, no el total de la compra.

**Importante — limitacion del WhatsApp Sandbox de Twilio (version gratuita):** no se puede agregar el bot a un grupo de WhatsApp real. Cada persona le escribe sus gastos directo al bot por su chat individual (1 a 1), y todos los gastos se juntan igual en la misma planilla y dashboard. Si mas adelante quieren que el bot lea mensajes de un grupo compartido, hay que migrar a WhatsApp Business Cloud API (Meta), lo cual requiere verificacion de negocio.

## Categorias

Supermercado, Comida afuera, Transporte, Servicios/Cuentas, Salud, Ocio, Ropa, Hogar, Mascotas, Otros (fallback si ninguna palabra clave matchea). Las palabras clave de cada categoria estan en `server/config/categorias.js`. La comparacion ignora espacios, guiones y tildes, asi que "pedidos ya" y "pedidosya" matchean igual. La categorizacion se calcula una sola vez, al momento de guardar el gasto — si cambias las palabras clave despues, no re-categoriza los gastos ya guardados (hay que borrarlos con el boton 🗑️ y volver a cargarlos, o editar la columna Categoria a mano en la Sheet).

**Categorizacion con IA**: si ninguna palabra clave matchea, en vez de caer directo en "Otros" el bot le pregunta a Claude (Anthropic) que categoria le parece mas apropiada segun la descripcion del gasto. Esto requiere la variable de entorno `ANTHROPIC_API_KEY` (ver seccion de variables de entorno) — si no esta configurada, o si Claude no responde a tiempo, cae en "Otros" como antes, sin romper nada. Las palabras clave siguen siendo el primer filtro (mas rapido y sin costo); Claude solo se usa cuando ninguna keyword matcheo.

## Importar resumen de tarjeta (PDF)

Desde el botón **📄 Importar resumen** del dashboard se puede subir el PDF del resumen de una tarjeta de crédito (de cualquier banco). El proceso:

1. Se extrae el texto del PDF y se le manda a Claude, que identifica cada consumo individual (fecha, comercio, monto), ignorando saldo anterior, pagos, intereses, IVA y el total a pagar. Si un consumo está en cuotas, se respeta el monto de esa cuota puntual tal como figura en el resumen (no se recalcula nada).
2. Los movimientos extraídos se muestran en una tabla editable **antes** de guardar nada: se puede corregir fecha, descripción, monto, categoría y persona, o destildar los que no correspondan.
3. Recién al tocar "Confirmar importación" se guardan como gastos reales en la Google Sheet de esa familia.

Esto requiere `ANTHROPIC_API_KEY` configurada. Como el formato de cada banco es distinto, conviene siempre revisar la tabla antes de confirmar — la IA es buena extrayendo pero no infalible, sobre todo con resumenes muy largos o con formatos raros.

**También se puede mandar el PDF directo por WhatsApp** (como documento adjunto, no como foto) en vez de subirlo desde la web. El bot lo procesa igual (extrae y categoriza los movimientos) y responde con un mensaje confirmando cuántos encontró, pidiendo que entres al dashboard a revisarlos y confirmarlos — el paso de revisión se mantiene igual, solo cambia de dónde sale el archivo. Al abrir "📄 Importar resumen" en el dashboard, si hay un envío pendiente por WhatsApp se precarga solo, sin tener que volver a subir el archivo. Estos pendientes quedan en memoria del servidor (se pierden si el servidor se reinicia, o expiran a las 24hs) — no son persistentes.

## Preguntas por WhatsApp

Ademas de registrar gastos, le podés preguntar cosas al bot en lenguaje natural, por ejemplo:

- `¿Cuánto llevo gastado este mes?`
- `¿Cuánto gastamos en Supermercado?`
- `¿Cómo voy con el ahorro?`
- `¿Cuál fue mi último gasto?`

El bot detecta que es una pregunta (si el mensaje tiene "?" o arranca con una palabra interrogativa como "cuanto", "como", "que", etc. — si no, lo trata como intento de gasto) y le pasa a Claude los gastos de los ultimos 3 meses de esa familia junto con su configuracion (ingreso, meta de ahorro, limites). Los totales y sumas los calcula el codigo (no la IA), para evitar errores de suma; Claude solo redacta la respuesta y contesta preguntas puntuales (ultimo gasto, gastos de una fecha, etc). Requiere `ANTHROPIC_API_KEY` configurada — si no esta disponible, responde que la funcion no esta disponible.

## Eliminar un gasto

En la tabla "Ultimos gastos" del dashboard, cada fila tiene un ícono 🗑️ al final. Pide confirmación antes de borrar y elimina la fila directamente de la Google Sheet de esa familia (no se puede deshacer).

## Ingreso mensual, meta de ahorro y alertas

Desde el dashboard (botón **⚙️ Configuración**, arriba a la derecha) cada familia puede cargar:

- **Ingreso mensual**: para calcular el ahorro proyectado del mes (ingreso - gastos).
- **Meta de ahorro mensual**: si el ahorro proyectado cae por debajo de esta meta, se dispara una alerta.
- **Límites por categoría** (opcional, uno por categoría): se definen como **% del ingreso mensual**, no como monto fijo. El formulario muestra en vivo el equivalente en $ (ej. "10% = $50.000"). Requiere haber cargado el ingreso mensual primero. Si el gasto acumulado del mes en esa categoría supera ese monto, se dispara una alerta que muestra el % y el $ correspondiente.

Esta configuración se guarda en una pestaña nueva llamada **"Config"** dentro de la misma Google Sheet de cada familia (se crea sola la primera vez que se usa, no hay que crearla a mano).

Las alertas se muestran de dos formas:
1. **En el dashboard**: un banner rojo arriba de los gráficos mientras la alerta siga vigente.
2. **Por WhatsApp**: el bot manda un mensaje extra (además de la confirmación del gasto) justo en el momento en que un gasto hace que se cruce el límite o la meta de ahorro. Solo avisa una vez por cruce (no repite el aviso en cada gasto siguiente si ya estaban por encima).

## Setup

### 1. Twilio (WhatsApp Sandbox)

1. Crear cuenta gratuita en https://www.twilio.com/
2. Ir a **Messaging > Try it out > Send a WhatsApp message** y activar el Sandbox.
3. Anotar el numero de sandbox (normalmente `whatsapp:+14155238886`) y el codigo de "join".
4. Vos y tu pareja mandan el mensaje de join desde su WhatsApp personal al numero sandbox.
5. Copiar `Account SID` y `Auth Token` desde el Console Dashboard de Twilio.

### 2. Google Sheets

1. Crear un proyecto en https://console.cloud.google.com/
2. Habilitar la **Google Sheets API**.
3. Crear un **Service Account** (IAM & Admin > Service Accounts), generar una clave JSON.
4. Crear una Google Sheet nueva **por cada grupo familiar** que quieras soportar, cada una con una hoja llamada `Gastos` y esta fila de encabezados:

   | Fecha | Persona | Monto | Categoria | Descripcion | Mensaje Original | Moneda |
   |---|---|---|---|---|---|---|

5. Compartir **cada Sheet** con el mismo email del service account (`...@...iam.gserviceaccount.com`), con permiso de **Editor**.
6. Copiar el `spreadsheetId` de cada sheet (el string largo entre `/d/` y `/edit` en la URL).

### 3. Variables de entorno

Copiar `.env.example` a `.env` y completar:

```
cp .env.example .env
```

- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`: de Twilio.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: del JSON del service account (campos `client_email` y `private_key`), compartido entre todos los grupos.
- `ANTHROPIC_API_KEY` (opcional): key de Claude/Anthropic, se usa solo para categorizar gastos que no matchean ninguna palabra clave. Si se deja vacia, esos gastos caen en "Otros" como antes.
- `GRUPOS_JSON`: un JSON con un objeto por grupo familiar. Cada grupo tiene un `nombre` (se muestra en el selector del dashboard), un `spreadsheetId` (la planilla de ese grupo) y un `personas` (mapeo de numero de WhatsApp, formato `whatsapp:+54911...`, a nombre de esa persona). Ejemplo con dos grupos:

  ```json
  {
    "fede": {
      "nombre": "Federico y Cande",
      "spreadsheetId": "ID_DE_LA_SHEET_1",
      "personas": { "whatsapp:+5491100000000": "Federico", "whatsapp:+5491100000001": "Cande" }
    },
    "hermano": {
      "nombre": "Familia del hermano",
      "spreadsheetId": "ID_DE_LA_SHEET_2",
      "personas": { "whatsapp:+5491100000002": "Hermano", "whatsapp:+5491100000003": "Cunada" }
    }
  }
  ```

  Un numero de WhatsApp que no este en **ningun** grupo recibe un mensaje pidiendole al administrador que lo agregue, y no se guarda nada.

#### Proteger un grupo con contraseña

Cada grupo puede tener un campo opcional `password`. Si se define, el dashboard le va a pedir esa contraseña antes de mostrar los gastos de ese grupo (asi una familia no puede ver los gastos de otra cambiando el selector). Si un grupo no tiene `password`, queda visible sin pedir nada (compatibilidad con grupos ya configurados). Ejemplo:

```json
{
  "fede": {
    "nombre": "Federico y Cande",
    "password": "unaClaveCualquiera",
    "spreadsheetId": "ID_DE_LA_SHEET_1",
    "personas": { "whatsapp:+5491100000000": "Federico", "whatsapp:+5491100000001": "Cande" }
  }
}
```

Es una proteccion basica (la contraseña viaja y se valida en texto plano contra la variable de entorno) pensada para que una familia no husmee los gastos de otra por curiosidad, no para datos de alta sensibilidad.

#### Agregar un grupo familiar nuevo (ej. la familia de tu hermano)

Como todos comparten el mismo bot y numero de Twilio, no hace falta que el hermano cree su propia cuenta de Twilio ni Railway. Solo hay que:

1. Crear una Google Sheet nueva (hoja `Gastos` + encabezados de la seccion 2).
2. Compartirla con el mismo `GOOGLE_SERVICE_ACCOUNT_EMAIL` que ya estan usando (permiso Editor).
3. Que cada integrante de esa familia mande el codigo `join ...` al numero de Twilio sandbox desde su WhatsApp (igual que hiciste vos).
4. Agregar un nuevo grupo dentro de `GRUPOS_JSON` (en Railway → Variables) con el `spreadsheetId` de esa sheet y los numeros de esa familia.
5. En el dashboard va a aparecer un selector de **"Grupo familiar"** arriba de los filtros para elegir cual ver.

### 4. Instalar y correr en local

```
npm install
cd frontend && npm install && cd ..
npm run dev
```

Esto levanta el backend en `http://localhost:3000` con recarga automatica.

Para el dashboard en modo desarrollo (con recarga instantanea):

```
cd frontend
npm run dev
```

Abrir `http://localhost:5173` (Vite hace proxy de `/api` hacia el backend en el puerto 3000).

### 5. Probar el webhook en local con ngrok

1. Con el backend corriendo (`npm run dev`), en otra terminal: `ngrok http 3000`
2. Copiar la URL https que genera ngrok.
3. En Twilio Console, ir a **Sandbox Settings** y pegar `<url-ngrok>/webhook/whatsapp` en "When a message comes in", metodo POST.
4. Mandar el join por WhatsApp y despues un mensaje de prueba como `150 supermercado`.
5. Verificar que llega la confirmacion por WhatsApp y que aparece la fila en la Google Sheet.

### 6. Deploy en Railway

1. Crear cuenta en https://railway.app (login con GitHub).
2. Subir este proyecto a un repo de GitHub.
3. En Railway: **New Project > Deploy from GitHub repo**, elegir el repo.
4. Cargar todas las variables de entorno del `.env` en Railway (pestaña Variables).
5. Railway va a generar un dominio publico (`https://<app>.up.railway.app`).
6. Actualizar `PUBLIC_BASE_URL` en las variables de Railway con ese dominio, y poner `VALIDATE_TWILIO_SIGNATURE=true`.
7. En Twilio Console > Sandbox Settings, cambiar el webhook a `https://<app>.up.railway.app/webhook/whatsapp`.
8. Abrir `https://<app>.up.railway.app/` para ver el dashboard en produccion.

## Estructura del proyecto

```
server/     backend Express: webhook de WhatsApp + API de gastos
frontend/   dashboard en React (Vite + Recharts)
```
