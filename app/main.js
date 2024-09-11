const { CONFIG, REPLICA, TRANSACTION } = require('./global');
const { loadDatabase, expireItems } = require('./database');
const { generateRandomString, isReplica, isMaster } = require('./helpers/common');
const { cliParameters, DEFAULT_HOST, DEFAULT_PORT, EXPIRE_INTERVAL, commands } = require('./constants');
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

/**
 * Queues a command for later execution, if transaction mode is enabled.
 *
 * @param {Array} command - The command to be queued.
 * @param {Function} processor - The processor function to handle the command.
 * @returns {boolean} - Returns true if the command was queued, false otherwise.
 */
function queueCommand(command, processor) {
  if (!TRANSACTION.enabled) return false;

  const commandName = command[0].toLowerCase();

  // Exclude transaction commands from being queued
  if (commandName === commands.MULTI || commandName === commands.EXEC) return false;

  console.log(`Transaction mode enabled. Queuing command "${commandName}".`);
  TRANSACTION.queue.push({ command, processor });

  return true;
}

/**
 * Handles incoming data events from a socket.
 *
 * @param {Object} socket - The socket object representing the connection.
 * @param {Buffer} data - The data received from the socket.
 * @param {Object} processors - An object containing command processors.
 * @param {Function} [updateReplicaOffset] - Optional function to update the replica offset.
 *                                           This function is called with the size of the data processed,
 *                                           allowing the replica to keep track of its synchronization state
 *                                           with the master by updating the offset.
 */
function handleDataEvent(socket, data, processors, updateReplicaOffset) {
  try {
    const stringData = data.toString('utf-8');
    const redisCommands = parseArrayBulkString(stringData);
    redisCommands.forEach(({ command, size }) => {
      console.log(`Incoming command: ${command}. Bytes received: ${size}`);

      const [commandName, ...args] = command;

      const processor = processors[commandName.toLowerCase()];

      if (processor) {
        if (queueCommand(command, processor)) return;

        processor.process(socket, args);

        if (updateReplicaOffset) updateReplicaOffset(size);
      } else {
        console.log(`Unknown command: ${commandName}`);
      }
    });
  } catch (err) {
    console.log('Fatal error:', err);
  }
}

function handleMasterDataEvent(socket, data) {
  handleDataEvent(socket, data, processors.master);
}

function handleReplicaDataEvent(socket, data) {
  handleDataEvent(socket, data, processors.replica, (size) => {
    const newOffset = REPLICA.bytesProcessed + size;
    console.log(`Incrementing replica offset. ${REPLICA.bytesProcessed} plus ${size} = ${newOffset}`);
    REPLICA.bytesProcessed = newOffset;
  });
}

async function initialise() {
  setInterval(expireItems, EXPIRE_INTERVAL);
  parseCliParameters();
  setServerInfo();
  loadDatabase();

  const serverHost = DEFAULT_HOST;
  const serverPort = CONFIG[cliParameters.PORT] || DEFAULT_PORT;

  const server = createServer(serverHost, serverPort, handleMasterDataEvent);
  server.listen(serverPort, serverHost);

  if (isReplica()) {
    handshake(serverHost, serverPort, handleReplicaDataEvent).then(() =>
      console.log('Successful handshake with master'),
    );
  }
}

initialise().catch((err) => {
  console.log('Fatal error:', err);
});
