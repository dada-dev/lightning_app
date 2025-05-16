const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

// require('dotenv').config();

// Load lnd rpc.proto file
// Adjust the path to rpc.proto
const protoPath = path.join(__dirname, '..', '..', 'protos', 'rpc.proto');
const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

// Load the proto file and access the Lightning service
const lnrpc = grpc.loadPackageDefinition(packageDefinition).lnrpc;

// Load TLS cert
const lndCert = fs.readFileSync(process.env.LND_TLS_CERT);
const sslCreds = grpc.credentials.createSsl(lndCert);

// Macaroon Auth
const macaroon = fs.readFileSync(process.env.LND_MACAROON).toString('hex');
const metadata = new grpc.Metadata();
metadata.add('macaroon', macaroon);
const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_, callback) => {
    callback(null, metadata);
});

// Create combined credentials
const creds = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

// Connect to lnd
const lnd = new lnrpc.Lightning(process.env.LND_GRPC_HOST, creds);

module.exports = lnd;
