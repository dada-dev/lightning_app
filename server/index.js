const express = require('express');
const { createInvoice, subscribeToInvoices } = require('./invoice');
const cors = require('cors');
require('dotenv').config();
const WebSocket = require('ws');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

//websocket connection
wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);
            if (data.r_hash){
                clients.set(data.r_hash, ws);
                console.log(`Client subscribed to invoice with hash: ${data.r_hash}`);
            }
        } catch (err) {
            console.error('Invalid Message from Client:', err);
        }
    });
});

// Create Invoice endpoint (REST endpoint)
app.post('/create-invoice', async (req, res) => {
    const { amount } = req.body;
    try {
        const invoice = await createInvoice(amount);
        res.json(invoice);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating invoice');
    }
});

// Start server and subscribe to invoices
server.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
    subscribeToInvoices();
});

// app.listen(PORT, () => {
//     console.log(`Server listening at http://localhost:${PORT}`);
//     subscribeToInvoices(); // start payment listener
// });
