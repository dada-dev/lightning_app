const lnd = require('../services/grpc');
const InvoiceModel = require('../models/invoice.model');
const PaymentModel = require('../models/payment.model');

const bobLnd = require('../services/bobGrpc');
const { getIo } = require('../services/socket');
const bolt11 = require('bolt11');

const defaultExpiry = 3600;

exports.createInvoice = async (req, res) => {
  const { amount, memo = "Default Memo", expiry = defaultExpiry } = req.body;

  const request = {
    value: amount,
    memo,
    expiry
  };

  try {
    const response = await new Promise((resolve, reject) => {
      lnd.AddInvoice(request, (err, response) => {
        if (err) return reject(err);
        resolve(response);
      });
    });

    const expiresAt = new Date(Date.now() + expiry * 1000); // expiry in seconds

    // Store in MongoDB
    const invoice = new InvoiceModel({
      memo,
      amount,
      paymentHash: response.r_hash.toString('hex'),  // Convert buffer to hex string
      expiresAt
    });

    await invoice.save();

    res.status(201).json(response);
  } catch (err) {
    console.error('Error creating invoice:', err);
    res.status(500).json({ error: 'Invoice creation failed' });
  }
};

exports.payInvoice = async (req, res) => {
  const { payment_request } = req.body;

  try {
    // Decode the invoice first
    const decoded = bolt11.decode(payment_request);
    const memo = decoded.tags.find(tag => tag.tagName === 'description')?.data || 'No Memo';
    const amount = decoded.satoshis ? parseInt(decoded.satoshis) : 0;
    const paymentHashTag = decoded.tags.find(tag => tag.tagName === 'payment_hash');
    const paymentHash = paymentHashTag?.data;

    if (!paymentHash) {
      return res.status(400).json({ error: 'Invalid invoice: missing payment hash' });
    }

    // Find invoice in database
    const invoice = await InvoiceModel.findOne({ paymentHash });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Check if the invoice is expired
    if (invoice.status === 'expired') {
      return res.status(400).json({ error: 'Invoice has expired' });
    }

    // Check if the invoice has already been paid
    if (invoice.status === 'settled') {
      return res.status(400).json({ error: 'Invoice has already been paid' });
    }

    // Send payment via Bob's LND node
    const response = await new Promise((resolve, reject) => {
      bobLnd.SendPaymentSync({ payment_request }, (err, response) => {
        if (err) return reject(err);
        if (response.payment_error) return reject(new Error(response.payment_error));
        resolve(response);
      });
    });

    const paidHash = response.payment_hash.toString('hex');
    const fee = response.payment_route?.total_fees || 0;

    await InvoiceModel.findOneAndUpdate(
      { paymentHash },
      {
        status: 'settled',
        settledAt: new Date(), 
      }
    );

    await PaymentModel.create({
      paymentHash: paidHash,
      paymentRequest: payment_request,
      status: 'paid',
      amount,
      fee,
      memo,
    });

    // Emit real-time update
    const io = getIo();
    io.emit('invoiceUpdate', {
      status: 'paid',
      paymentHash: paidHash,
      memo,
      amount,
    });

    res.status(200).json({ message: 'Payment sent', paymentHash: paidHash, amount, fee });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ error: 'Payment failed', details: err.message });
  }
};


exports.subscribeToInvoices = function () {
  const call = lnd.SubscribeInvoices({});

  call.on('data', async (invoice) => {
    const paymentHash = Buffer.from(invoice.r_hash).toString('hex');
    const memo = invoice.memo;
    const amount = invoice.value;

    const io = getIo();

    if (invoice.state === 'CANCELED') {
      // Invoice has expired
      await InvoiceModel.findOneAndUpdate(
        { paymentHash },
        { status: 'expired' }
      );

      io.emit('invoiceUpdate', {
        status: 'expired',
        paymentHash,
        memo,
        amount,
      });

      console.log(`Invoice expired: Memo: ${memo}, Hash: ${paymentHash}`);
    }

    if (invoice.settled) {
      const settledAt = new Date(parseInt(invoice.settle_date) * 1000);

      await InvoiceModel.findOneAndUpdate(
        { paymentHash },
        {
          status: 'settled',
          settledAt,
        }
      );

      io.emit('invoiceUpdate', {
        status: 'settled',
        memo,
        amount,
        paymentHash,
        settledAt,
      });

      console.log(`Invoice settled: Memo: ${memo}, Hash: ${paymentHash}`);
    }
  });

  call.on('error', console.error);
};