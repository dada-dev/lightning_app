const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
require('dotenv').config();
const path = require('path');

// Load lnd rpc.proto file
const packageDefinition = protoLoader.loadSync(
    path.join(__dirname, '..', 'protos', 'rpc.proto'),
    {}
);

//log if there is an error loading the proto file
if (!process.env.LND_TLS_CERT || !process.env.LND_MACAROON || !process.env.LND_GRPC_HOST) {
    throw new Error('Missing one or more required environment variables: LND_TLS_CERT, LND_MACAROON, LND_GRPC_HOST');
}

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
