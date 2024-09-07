const net = require('net');
const { parseString, cleanString, constructArray } = require('./utils');

function connect(host, port) {
  const client = new net.Socket();

  client.on('close', () => {
    console.log('Connection closed');
  });

  client.on('error', (err) => {
    console.error(`Connection error: ${err.message}`);
  });

  client.connect(port, host, () => {
    console.log(`Connected to ${host}:${port}`);
  });

  return client;
}

async function sendArray(client, stringValues) {
  return new Promise((resolve, reject) => {
    const payload = constructArray(stringValues);
    client.write(payload, (err) => {
      if (err) {
        return reject(err);
      }
    });

    client.once('data', (buffer) => {
      try {
        const { stringValue } = parseString(buffer);
        resolve(cleanString(stringValue));
      } catch (err) {
        reject(err);
      }
    });

    client.once('error', (err) => {
      reject(err);
    });
  });
}

function disconnect(client) {
  if (client) {
    client.destroy();
  }
}

module.exports = {
  connect,
  disconnect,
  sendArray,
};
