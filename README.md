# Gastos de la pareja

Registra gastos mandando un mensaje de WhatsApp al bot, los guarda en una Google Sheet y los muestra en un dashboard categorizado.

## Como se manda un gasto

Escribile al numero de WhatsApp del bot con el formato:

```
<monto> <descripcion>
```

Ejemplos: `150 supermercado`, `$3200 nafta auto`, `gaste 150 en supermercado`, `$1.500,50 farmacia`.

El bot responde confirmando el monto, la categoria detectada y quien lo registro. Si no puede reconocer el monto, te pide que lo reformules.

**Importante — limitacion del WhatsApp Sandbox de Twilio (version gratuita):** no se puede agregar el bot a un grupo de WhatsApp real. Cada persona le escribe sus gastos directo al bot por su chat individual (1 a 1), y todos los gastos se juntan igual en la misma planilla y dashboard. Si mas adelante quieren que el bot lea mensajes de un grupo compartido, hay que migrar a WhatsApp Business Cloud API (Meta), lo cual requiere verificacion de negocio.

## Categorias

Supermercado, Comida afuera, Transporte, Servicios/Cuentas, Salud, Ocio, Ropa, Hogar, Otros (fallback si ninguna palabra clave matchea). Las palabras clave de cada categoria estan en `server/config/categorias.js`.

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
4. Crear una Google Sheet nueva con una hoja llamada `Gastos` y esta fila de encabezados:

   | Fecha | Persona | Monto | Categoria | Descripcion | Mensaje Original | Moneda |
   |---|---|---|---|---|---|---|

5. Compartir la Sheet con el email del service account (`...@...iam.gserviceaccount.com`), con permiso de **Editor**.
6. Copiar el `spreadsheetId` de la URL de la sheet (el string largo entre `/d/` y `/edit`).

### 3. Variables de entorno

Copiar `.env.example` a `.env` y completar:

```
cp .env.example .env
```

- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`: de Twilio.
- `GOOGLE_SHEETS_SPREADSHEET_ID`: el ID de la sheet.
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`: del JSON del service account (campos `client_email` y `private_key`).
- `PERSONAS_MAP`: JSON que mapea el numero de WhatsApp de cada persona (formato `whatsapp:+54911...`) a su nombre.

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
