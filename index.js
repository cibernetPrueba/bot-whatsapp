const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth()
});

const qrcodeWeb = require('qrcode');

client.on('qr', (qr) => {
    console.log('--- COPIA ESTE ENLACE EN TU NAVEGADOR PARA VER EL QR ---');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
});

client.on('ready', () => {
    console.log('¡WhatsApp está listo y conectado!');
});

client.initialize();

// Endpoint que llamará tu PHP en Hostinger para enviar el mensaje
app.post('/enviar', async (req, res) => {
    const { telefono, mensaje } = req.body;
    
    if (!telefono || !mensaje) {
        return res.status(400).json({ error: 'Faltan datos (telefono o mensaje)' });
    }

    try {
        const chatId = telefono.includes('@c.us') ? telefono : `${telefono}@c.us`;
        await client.sendMessage(chatId, mensaje);
        res.json({ success: true, message: 'Mensaje enviado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
