// services/payWithBob.js
const bobLnd = require('../grpc/bobGrpc');

const payWithBob = (payment_request) => {
  return new Promise((resolve, reject) => {
    const request = { payment_request };

    bobLnd.SendPaymentSync(request, (err, response) => {
      if (err) return reject(err);
      if (response.payment_error) return reject(new Error(response.payment_error));

      resolve({
        payment_hash: response.payment_hash.toString('hex'),
        payment_preimage: response.payment_preimage.toString('hex'),
        payment_route: response.payment_route,
        amount: response.payment_route.total_amt, // in sat
        fee: response.payment_route.total_fees,   // in sat
      });
    });
  });
};

module.exports = payWithBob;
