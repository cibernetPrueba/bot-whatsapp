const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeWeb = require('qrcode');
const express = require('express');

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const client = new Client({
    authStrategy: new LocalAuth({ clientId: "mi-bot-personal" }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

let isReady = false;

let ultimoQR = null;

client.on('qr', (qr) => {
    ultimoQR = qr;
    console.log('--- NUEVO QR GENERADO. Visita /qr en tu navegador para verlo. ---');
});

client.on('loading_screen', (percent, message) => {
    console.log(`Cargando WhatsApp: ${percent}% - ${message}`);
});

client.on('ready', () => {
    isReady = true;
    console.log('¡Bot de WhatsApp conectado y listo para enviar mensajes automáticamente!');
});

client.on('auth_failure', () => {
    isReady = false;
    console.log('Fallo de autenticación en WhatsApp.');
});

client.on('disconnected', () => {
    isReady = false;
    console.log('El bot se ha desconectado.');
});

app.get('/qr', async (req, res) => {
    if (isReady) {
        return res.send('<h2>✅ El bot ya está conectado, no hay QR pendiente.</h2>');
    }
    if (!ultimoQR) {
        return res.send(`
            <html><head><meta http-equiv="refresh" content="5"></head>
            <body><h3>Aún no se ha generado el QR. Recargando en 5s...</h3></body></html>
        `);
    }
    const qrImage = await qrcodeWeb.toDataURL(ultimoQR);
    res.send(`
        <html>
        <head><meta http-equiv="refresh" content="15"></head>
        <body style="text-align:center; font-family:sans-serif;">
            <h3>Escanea este código (se actualiza solo cada 15s)</h3>
            <img src="${qrImage}" style="width:300px;height:300px;" />
            <p>Generado: ${new Date().toLocaleTimeString('es-GT', { timeZone: 'America/Guatemala' })}</p>
        </body>
        </html>
    `);
});

app.get('/estado', (req, res) => {
    res.json({ listo: isReady });
});

app.get('/', (req, res) => {
    res.send('Bot activo. Estado: ' + (isReady ? 'Conectado ✅' : 'Desconectado ❌'));
});

// Ruta automática para enviar mensajes desde tu web con validación
app.post('/enviar', async (req, res) => {
    if (!isReady) {
        return res.status(503).json({ error: 'El bot aún no está listo o conectado a WhatsApp. Espera un momento.' });
    }

    try {
        let { numero, mensaje } = req.body;
        
        if (!numero || !mensaje) {
            return res.status(400).json({ error: 'Faltan datos (numero o mensaje)' });
        }

        let chatId = numero.replace(/\D/g, '') + '@c.us';

        await client.sendMessage(chatId, mensaje);
        
        res.json({ success: true, message: 'Mensaje enviado automáticamente con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

client.initialize()
