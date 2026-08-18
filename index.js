const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcodeWeb = require('qrcode');
const express = require('express');

const app = express();
app.use(express.json());

// Permitir peticiones desde cualquier página web (CORS)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    console.log('--- COPIA ESTE ENLACE EN TU NAVEGADOR PARA VER EL QR ---');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
});

client.on('ready', () => {
    console.log('¡Bot de WhatsApp conectado y listo para enviar mensajes automáticamente!');
});

// Ruta automática para enviar mensajes desde tu web
app.post('/enviar', async (req, res) => {
    try {
        let { numero, mensaje } = req.body;
        
        if (!numero || !mensaje) {
            return res.status(400).json({ error: 'Faltan datos (numero o mensaje)' });
        }

        // Limpiar formato del número y agregar sufijo de WhatsApp
        let chatId = numero.replace(/\D/g, '') + '@c.us';

        // Envío automático desde el servidor
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
