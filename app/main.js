const { CONFIG } = require('./global');
const { loadDatabase, expireItems } = require('./database');
const { generateRandomString, isReplica, isMaster } = require('./helpers/common');
const { cliParameters, DEFAULT_HOST, DEFAULT_PORT, EXPIRE_INTERVAL } = require('./constants');
const { handshake } = require('./replica');
const processors = require('./processors');
const { createServer } = require('./helpers/network');
const { parseArrayBulkString } = require('./helpers/resp');

function setServerInfo() {
  CONFIG.serverInfo.role = CONFIG[cliParameters.REPLICA_OF] ? 'slave' : 'master';

  if (isMaster()) {
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

function handleDataEvent(socket, data) {
  try {
    const stringData = data.toString('utf-8');
    const commandGroups = parseArrayBulkString(stringData);
    commandGroups.forEach((commandGroup) => {
      console.log(`Incoming command: ${commandGroup}`);
      const [command, ...args] = commandGroup;
      const processor = processors[command.toLowerCase()];

      if (processor) {
        processor.process(socket, args);
      } else {
        console.log(`Unknown command: ${command}`);
      }
    });
  } catch (err) {
    console.log('Fatal error:', err);
  }
}

async function initialise() {
  setInterval(expireItems, EXPIRE_INTERVAL);
  parseCliParameters();
  setServerInfo();
  loadDatabase();

  const serverHost = DEFAULT_HOST;
  const serverPort = CONFIG[cliParameters.PORT] || DEFAULT_PORT;

  const server = createServer(serverHost, serverPort, handleDataEvent);
  server.listen(serverPort, serverHost);

  if (isReplica()) {
    handshake(serverHost, serverPort, handleDataEvent).then(() => console.log('Successful handshake with master'));
  }
}

initialise().catch((err) => {
  console.log('Fatal error:', err);
});
