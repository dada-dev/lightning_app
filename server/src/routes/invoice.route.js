const express = require('express');
const invoiceRouter = express.Router();
const { createInvoice, payInvoice } = require('../controllers/invoice.controller');

invoiceRouter.post('/create', createInvoice);
invoiceRouter.post('/pay', payInvoice);

module.exports = invoiceRouter;