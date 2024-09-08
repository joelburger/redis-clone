const net = require('net');
const { CONFIG } = require('./global');
const { cliParameters } = require('./constants');
const { writeArrayAsync, isMaster } = require('./utils');
const { handleDataEvent } = require('./processors');

function validateResponse(response, expectedResponse) {
  console.log(`Validating response: ${response}`);

  if (!new RegExp(`^${expectedResponse}$`).test(response)) {
    throw new Error(`Unexpected response: received "${response}", but expected "${expectedResponse}".`);
  }
}

async function ping(client) {
  const response = await writeArrayAsync(client, ['PING']);
  validateResponse(response, 'PONG');
}

async function sendListeningPort(client, listeningPort) {
  const response = await writeArrayAsync(client, ['REPLCONF', 'listening-port', listeningPort]);
  validateResponse(response, 'OK');
}

async function sendCapability(client) {
  const response = await writeArrayAsync(client, ['REPLCONF', 'capa', 'psync2']);
  validateResponse(response, 'OK');
}

async function sendPSync(client) {
  const response = await writeArrayAsync(client, ['PSYNC', '?', '-1']);
  validateResponse(response, 'FULLRESYNC.+');
}

function connect(host, port) {
  const socket = new net.Socket();

  socket.on('data', (data) => handleDataEvent(socket, data));

  socket.on('close', () => {
    console.log('Connection closed');
  });

  socket.on('error', (err) => {
    console.error(`Connection error: ${err.message}`);
  });

  socket.connect(port, host, () => {
    console.log(`Connected to ${host}:${port}`);
  });

  return socket;
}

async function handshake(serverHost, serverPort) {
  if (isMaster()) return;

  const [masterHost, masterPort] = CONFIG[cliParameters.REPLICA_OF].split(' ');
  const client = connect(masterHost, masterPort);
  await ping(client);
  await sendListeningPort(client, serverPort);
  await sendCapability(client);
  await sendPSync(client);
}

module.exports = {
  handshake,
};
