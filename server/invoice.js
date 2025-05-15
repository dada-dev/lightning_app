const { Client } = require('@grpc/grpc-js');
const lnd = require('./grpc');

// Create Invoice
async function createInvoice(amountSats) {
    return new Promise((resolve, reject) => {
        const request = {
            memo: "Test Invoice",
            value: amountSats
        };
        lnd.AddInvoice(request, (err, response) => {
            if (err) {
                return reject(err);
            }

            // Log the response for debugging
            console.log("invoice response:", response);

            //to return the payment request and r_hash
            resolve({
                payment_request: response.payment_request,
                r_hash: response.rHash
                    ? Buffer.from(response.rHash).toString('hex')
                    : null
            });
        });
    });
}

// Subscribe to Invoices
function subscribeToInvoices() {
    const call = lnd.SubscribeInvoices({});
    call.on('data', (invoice) => {
        console.log("Invoice update received:", invoice);
        if (invoice.settled) {
            if (invoice.r_hash) {
                const hash = Buffer.from(invoice.r_hash).toString('hex');
                console.log(`Invoice settled! ${invoice.memo}, hash: ${hash}`);

                const ws = Clients.get(hash);
                if (ws && ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ paid: true }));
                    Clients.delete(hash);
                }
            } else {
                console.warn("Missing r_hash on settled invoice:", invoice);
            }
        }
    });
}

module.exports = { createInvoice, subscribeToInvoices };
