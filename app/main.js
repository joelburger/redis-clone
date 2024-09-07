const net = require('net');
const { CONFIG } = require('./global');
const { loadDatabase, expireItems } = require('./database');
const { generateRandomString, parseRespBulkString } = require('./utils');
const { cliParameters } = require('./constants');
const processors = require('./processors');
const { connectToMaster, isReplica } = require('./replica');

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 6379;
const EXPIRE_INTERVAL = 10;

function setServerInfo() {
  CONFIG.serverInfo.role = CONFIG[cliParameters.REPLICA_OF] ? 'slave' : 'master';

  if (CONFIG.serverInfo.role === 'master') {
    CONFIG.serverInfo.replication = { master_replid: generateRandomString(), master_repl_offset: 0 };
  }
}

function parseCliParameters() {
  const cliArguments = process.argv.slice(2);

  cliArguments.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      const parameter = cliArguments[index].replace('--', '').toLowerCase();
      CONFIG[parameter] = cliArguments[index + 1];
    }
  });
}

function handleDataEvent(connection, data) {
  try {
    const [command, ...args] = parseRespBulkString(data);
    const redisCommand = command.toLowerCase();
    const processor = processors[redisCommand];

    if (processor) {
      processor.process(connection, args);
    } else {
      console.log(`Unknown command: ${redisCommand}`);
    }
  } catch (err) {
    console.log('Fatal error:', err);
  }
}

function startServer(serverHost, serverPort) {
  const server = net.createServer((connection) => {
    connection.on('data', (data) => handleDataEvent(connection, data));
    connection.on('error', (err) => console.log('Connection error', err));
  });

  server.on('error', (err) => console.log('Server error', err));

  server.listen(serverPort, serverHost, () => {
    console.log(`Listening on ${server.address().address}:${server.address().port}`);
  });
}

async function initialise() {
  setInterval(expireItems, EXPIRE_INTERVAL);
  parseCliParameters();
  setServerInfo();
  loadDatabase();

  const serverHost = DEFAULT_HOST;
  const serverPort = CONFIG[cliParameters.PORT] || DEFAULT_PORT;

  startServer(serverHost, serverPort);

  if (isReplica()) {
    await connectToMaster(serverHost, serverPort);
  }
}

initialise().catch((err) => {
  console.log('Fatal error:', err);
});
