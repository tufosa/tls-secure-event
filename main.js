'use strict';

const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');

const key = fs.readFileSync(path.join(__dirname,'./agent1-key.pem'));
const cert = fs.readFileSync(path.join(__dirname,'./agent1-cert.pem'));
const ca = fs.readFileSync(path.join(__dirname,'./ca1-cert.pem'));

const creds = tls.createSecureContext({
  key,
  cert,
  ca,
  checkServerIdentity: () => undefined
});

function createServer() {
  return new Promise(ok => {
    const server = tls.createServer({
      key,
      cert,
      ca
    }, ss => console.log('secureConnection - ', ss.getProtocol(), ' - ',
      ss.getCipher()));
    server.listen(() => ok(server.address().port));
  });
}

function createClientSecurePair(port, write = false) {
  return new Promise((ok, ko) => {
    setTimeout(() =>
      ko(`SecurePair with write ${write} did NOT receive secure event`), 1000);
    const pair = tls.createSecurePair(creds, false);
    pair.on('secure', () => {
      console.info('secure');
      ok();
    });
    const socket = net.connect(port, () => {
      pair.encrypted.pipe(socket);
      socket.pipe(pair.encrypted);
      if(write) pair.cleartext.write('');
    });
  });
}

function createClientTLSSocket(port, write = false) {
  return new Promise((ok, ko) => {
    setTimeout(() =>
      ko(`TLSSocket with write ${write} did NOT receive secure event`), 1000);
    const socket = net.connect(port, () => {
      const secureSocket = new tls.TLSSocket(socket, {
        key,
        cert,
        ca,
        isServer: false,
        rejectUnauthorized: false
      });
      secureSocket.on('secureConnect', () => {
        console.log('secureConnect');
        ok();
      });
      secureSocket.on('secure', () => {
        console.log('secure - ', secureSocket.getProtocol(), ' - ',
          secureSocket.getCipher());
        ok();
      });
      if(write) secureSocket.write('');
    });
  });
}

async function main() {
  const port = await createServer();
  for (const write of [false, true]) {
    console.log(`\nCreating SecurePair write ${write} client...`)
    try { await createClientSecurePair(port, write); }
    catch(e) { console.log('ERROR: ', e); }
    console.log(`\nCreating TLSSocket write ${write} client...`)
    try { await createClientTLSSocket(port, write); }
    catch(e) { console.log('ERROR: ', e); }
  }
}

main()
  .then(() => {
    console.log('\nFinished');
    process.exit(0);
  });
