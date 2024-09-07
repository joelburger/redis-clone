const network = require('./network');
const { CONFIG } = require('./global');
const { cliParameters } = require('./constants');

async function pingMaster(client) {
  const response = await network.sendArray(client, ['PING']);
  if (response !== 'PONG') {
    throw new Error(`Invalid handshake #1 response from master: ${response}`);
  }
}

async function sendListeningPort(client, listeningPort) {
  const response = await network.sendArray(client, ['REPLCONF', 'listening-port', listeningPort]);
  if (response !== 'OK') {
    throw new Error(`Invalid handshake #2 response from master: ${response}`);
  }
}

async function sendCapability(client) {
  const response = await network.sendArray(client, ['REPLCONF', 'capa', 'psync2']);
  if (response !== 'OK') {
    throw new Error(`Invalid handshake #3 response from master: ${response}`);
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
  } finally {
    network.disconnect(client);
  }
}

module.exports = {
  doHandshake,
};
