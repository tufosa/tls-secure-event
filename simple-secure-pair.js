'use strict';

// A very simple example of secure pairs

const fs = require('fs');
const path = require('path');
const tls = require('tls');

const MSG = 'Once unpon a time in the West...';

const key = fs.readFileSync(path.join(__dirname,'./agent1-key.pem'));
const cert = fs.readFileSync(path.join(__dirname,'./agent1-cert.pem'));
const ca = fs.readFileSync(path.join(__dirname,'./ca1-cert.pem'));

const creds = tls.createSecureContext({key, cert, ca});

const clientPair = tls.createSecurePair(creds, false);

const serverPair = tls.createSecurePair(creds, true, true, true);

clientPair.encrypted.pipe(serverPair.encrypted);
serverPair.encrypted.pipe(clientPair.encrypted);

serverPair.cleartext.on('data', data => {
  console.log('Data received on the clear side of the server:',data.toString());
  process.exit(0);
});

clientPair.on('secure', () => {
  console.log('client secured');
  clientPair.cleartext.write(MSG);
});
