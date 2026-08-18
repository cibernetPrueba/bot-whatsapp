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
    authStrategy: new LocalAuth()
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('--- COPIA ESTE ENLACE EN TU NAVEGADOR PARA VER EL QR ---');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
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

client.initialize();
