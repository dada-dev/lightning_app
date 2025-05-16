let currentInvoice = null;

document.getElementById('pay-button').onclick = async () => {
  const amount = document.getElementById('amount').value;
  if (!amount) return alert("Enter an amount!");

  const res = await fetch('http://localhost:3000/invoices/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount })
  });

  const invoice = await res.json();
  currentInvoice = invoice;

  const qrURL = `https://api.qrserver.com/v1/create-qr-code/?data=lightning:${invoice.payment_request}`;
  document.getElementById('qrcode').innerHTML = `<img src="${qrURL}" alt="Invoice QR Code">`;

  // Show payment section
  document.querySelector('.payment-section').style.display = 'block';
  document.getElementById('payment-status').textContent = '';
};

document.getElementById('pay-invoice-button').onclick = async () => {
  if (!currentInvoice) return alert("No invoice to pay.");

  const res = await fetch('http://localhost:3000/invoices/pay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payment_request: currentInvoice.payment_request })
  });

  const result = await res.json();

  if (res.ok) {
    document.getElementById('payment-status').textContent =
      `Payment successful: ${result.amount} sats`;
  } else {
    document.getElementById('payment-status').textContent =
      `Payment failed: ${result.details || result.error}`;
  }
};
