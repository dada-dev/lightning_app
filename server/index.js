const express = require('express');
const {connectToMongoDB} = require('./src/database/db');
const cors = require('cors');
const bodyParser = require('body-parser');
const invoiceRouter = require('./src/routes/invoice.route');
const { initSocket } = require('./src/services/socket');
const { subscribeToInvoices } = require('./src/controllers/invoice.controller');
require('dotenv').config({ path: '../.env' });
require('./src/jobs/expireInvoices');

const app = express();
const PORT = 3000;

// Connect to MongoDB
connectToMongoDB();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/invoices', invoiceRouter);

const server = app.listen(PORT, () => {
    console.log(`Server listening at http://localhost:${PORT}`);
});


initSocket(server);

subscribeToInvoices();
