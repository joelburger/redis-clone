const network = require('./network');
const { CONFIG, REPLICAS } = require('./global');
const { cliParameters } = require('./constants');
const { writeArray } = require('./utils');

function validateResponse(response, expectedResponse) {
  console.log(`Validating response: ${response}`);

  if (!new RegExp(`^${expectedResponse}$`).test(response)) {
    throw new Error(`Unexpected response: received "${response}", but expected "${expectedResponse}".`);
  }
}

async function ping(client) {
  const response = await network.sendArray(client, ['PING']);
  validateResponse(response, 'PONG');
}

async function sendListeningPort(client, listeningPort) {
  const response = await network.sendArray(client, ['REPLCONF', 'listening-port', listeningPort]);
  validateResponse(response, 'OK');
}

async function sendCapability(client) {
  const response = await network.sendArray(client, ['REPLCONF', 'capa', 'psync2']);
  validateResponse(response, 'OK');
}

async function sendPSync(client) {
  const response = await network.sendArray(client, ['PSYNC', '?', '-1']);
  validateResponse(response, 'FULLRESYNC.+');
}

function isMaster() {
  return CONFIG.serverInfo.role === 'master';
}

function isReplica() {
  return CONFIG.serverInfo.role === 'slave';
}

async function syncKeyWithReplicas(key, value) {
  if (isReplica()) return;

  REPLICAS.forEach((socket) => {
    writeArray(socket, ['SET', key, value]);
  });
}

async function connectToMaster(serverHost, serverPort) {
  if (isMaster()) return;

  const [masterHost, masterPort] = CONFIG[cliParameters.REPLICA_OF].split(' ');
  const client = network.connect(masterHost, masterPort);
  await ping(client);
  await sendListeningPort(client, serverPort);
  await sendCapability(client);
  await sendPSync(client);
}

module.exports = {
  connectToMaster,
  syncKeyWithReplicas,
  isReplica,
  isMaster,
};
