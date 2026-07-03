const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const whatsappWebhookRouter = require('./routes/whatsappWebhook');
const gastosApiRouter = require('./routes/gastosApi');

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use('/webhook/whatsapp', whatsappWebhookRouter);
app.use('/api/gastos', gastosApiRouter);

const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('Backend de gastos-pareja corriendo. El frontend aun no fue compilado (npm run build en frontend/).');
  });
}

app.listen(env.port, () => {
  console.log(`Servidor escuchando en el puerto ${env.port} (${env.nodeEnv})`);
});
