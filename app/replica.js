const network = require('./network');
const { CONFIG } = require('./global');
const { cliParameters } = require('./constants');

async function pingMaster(client) {
  const response = await network.sendArray(client, ['PING']);
  if (response !== 'PONG') {
    throw new Error(`Invalid handshake  from master: ${response}`);
  }
}

async function sendListeningPort(client, listeningPort) {
  const response = await network.sendArray(client, ['REPLCONF', 'listening-port', listeningPort]);
  if (response !== 'OK') {
    throw new Error(`Invalid handshake response from master: ${response}`);
  }
}

async function sendCapability(client) {
  const response = await network.sendArray(client, ['REPLCONF', 'capa', 'psync2']);
  if (response !== 'OK') {
    throw new Error(`Invalid handshake response from master: ${response}`);
  }
}

async function sendPSync(client) {
  const response = await network.sendArray(client, ['PSYNC', '?', '-1']);
  if (!response.startsWith('FULLRESYNC')) {
    throw new Error(`Invalid handshake  response from master: ${response}`);
  }
}

async function doHandshake(serverHost, serverPort) {
  if (CONFIG.serverInfo.role === 'master') {
    return;
  }
  const [masterHost, masterPort] = CONFIG[cliParameters.REPLICA_OF].split(' ');
  let client;
  try {
    client = network.connect(masterHost, masterPort);
    await pingMaster(client);
    await sendListeningPort(client, serverPort);
    await sendCapability(client);
    await sendPSync(client);
  } finally {
    network.disconnect(client);
  }
}

module.exports = {
  doHandshake,
};
