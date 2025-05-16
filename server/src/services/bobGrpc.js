const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const protoPath = path.join(__dirname, '..', '..', 'protos', 'rpc.proto');

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const lnrpc = grpc.loadPackageDefinition(packageDefinition).lnrpc;

// TLS
const lndCert = fs.readFileSync(process.env.BOB_TLS_CERT);
const sslCreds = grpc.credentials.createSsl(lndCert);

// Macaroon
const macaroon = fs.readFileSync(process.env.BOB_MACAROON).toString('hex');
const metadata = new grpc.Metadata();
metadata.add('macaroon', macaroon);
const macaroonCreds = grpc.credentials.createFromMetadataGenerator((_, callback) => {
  callback(null, metadata);
});

const creds = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);

const bobLnd = new lnrpc.Lightning(process.env.BOB_GRPC_HOST, creds);

module.exports = bobLnd;
