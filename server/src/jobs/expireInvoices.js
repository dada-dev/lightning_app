const cron = require('node-cron');
const { getIo } = require('../services/socket');
const InvoiceModel = require('../models/invoice.model');

cron.schedule('* * * * *', async () => {
    console.log('Running invoice expiration check...');
  
    const now = Date.now();
  
    const expiredInvoices = await InvoiceModel.find({
        expiresAt: { $lte: new Date(now) },
        status: 'pending',
    });
  
    if (expiredInvoices.length > 0) {
      // Log each expired invoice before updating
      expiredInvoices.forEach(invoice => {
        console.log(`Expiring invoice: ${invoice.paymentHash}, memo: ${invoice.memo}, amount: ${invoice.amount}`);
      });
  
      await InvoiceModel.updateMany(
        { _id: { $in: expiredInvoices.map(invoice => invoice._id) } },
        { status: 'expired' }
      );
  
      console.log(`${expiredInvoices.length} invoices have expired`);
  
      const io = getIo();
      expiredInvoices.forEach(invoice => {
        io.emit('invoiceUpdate', {
          status: 'expired',
          paymentHash: invoice.paymentHash,
          memo: invoice.memo,
          amount: invoice.amount,
        });
      });
    }
  });
  
