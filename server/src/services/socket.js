const socketIo = require('socket.io');

let io;

// Initialize Socket.IO with an HTTP server and CORS options
function initSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
}

// Provide a method to get the io instance
function getIo() {
  return io;
}

// Emit an event when an invoice is settled
function emitInvoiceSettled(invoiceData) {
  if (io) {
    io.emit('invoiceUpdate', invoiceData);
  } else {
    console.warn('Socket.IO not initialized');
  }
}

module.exports = {
  initSocket,
  emitInvoiceSettled,
  getIo,
};
