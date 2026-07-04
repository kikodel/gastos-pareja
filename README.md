# Gastos de la pareja

Registra gastos mandando un mensaje de WhatsApp al bot, los guarda en una Google Sheet y los muestra en un dashboard categorizado. Soporta varios **grupos familiares** (por ejemplo, vos y tu pareja, y por separado la familia de tu hermano) compartiendo el mismo bot y numero de WhatsApp, cada uno con su propia planilla y su propio dashboard filtrado.

## Como se manda un gasto

Escribile al numero de WhatsApp del bot con el formato:

```
<monto> <descripcion>
```

Ejemplos: `150 supermercado`, `$3200 nafta auto`, `gaste 150 en supermercado`, `$1.500,50 farmacia`.

El bot responde confirmando el monto, la categoria detectada y quien lo registro. Si no puede reconocer el monto, te pide que lo reformules.

**Importante — limitacion del WhatsApp Sandbox de Twilio (version gratuita):** no se puede agregar el bot a un grupo de WhatsApp real. Cada persona le escribe sus gastos directo al bot por su chat individual (1 a 1), y todos los gastos se juntan igual en la misma planilla y dashboard. Si mas adelante quieren que el bot lea mensajes de un grupo compartido, hay que migrar a WhatsApp Business Cloud API (Meta), lo cual requiere verificacion de negocio.

## Categorias

Supermercado, Comida afuera, Transporte, Servicios/Cuentas, Salud, Ocio, Ropa, Hogar, Mascotas, Otros (fallback si ninguna palabra clave matchea). Las palabras clave de cada categoria estan en `server/config/categorias.js`. La comparacion ignora espacios, guiones y tildes, asi que "pedidos ya" y "pedidosya" matchean igual. La categorizacion se calcula una sola vez, al momento de guardar el gasto — si cambias las palabras clave despues, no re-categoriza los gastos ya guardados (hay que borrarlos con el boton 🗑️ y volver a cargarlos, o editar la columna Categoria a mano en la Sheet).

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
