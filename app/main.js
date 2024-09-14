const { CONFIG, REPLICA, TRANSACTION, STORAGE } = require('./global');
const { loadDatabase, expireItems } = require('./helpers/datastore');
const { generateRandomString, isReplica, isMaster } = require('./helpers/common');
const { cliParameters, DEFAULT_HOST, DEFAULT_PORT, EXPIRE_INTERVAL, commands } = require('./constants');
const { handshake } = require('./replica');
const processors = require('./processors');
const { createServer } = require('./helpers/network');
const { parseBulkStringArray, constructSimpleString } = require('./helpers/resp');

/**
 * Sets the server information based on the role (master or replica).
 */
function setServerInfo() {
  CONFIG.serverInfo.role = CONFIG[cliParameters.REPLICA_OF] ? 'slave' : 'master';

  if (isMaster()) {
    CONFIG.serverInfo.replication = { master_replid: generateRandomString(), master_repl_offset: 0 };
  }
}

/**
 * Parses command-line parameters and updates the CONFIG object.
 */
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
 * @param {Object} socket - The socket object representing the connection.
 * @param {string} commandName - The name of the command to be queued.
 * @param {Array} args - The arguments for the command.
 * @param {Function} processor - The processor function to handle the command.
 * @returns {boolean} - Returns true if the command was queued, false otherwise.
 */
function queueCommand(socket, commandName, args, processor) {
  const transaction = TRANSACTION.get(socket);

  if (!transaction.enabled) return false;

  // Transaction commands must not be queued!
  if ([commands.MULTI, commands.EXEC, commands.DISCARD].includes(commandName)) {
    return false;
  }

  console.log(`Transaction mode enabled. Queuing command "${commandName}".`);
  transaction.queue.push({ commandName, args, processor });
  socket.write(constructSimpleString('QUEUED'));

  return true;
}

/**
 * Initializes the transaction state for a given socket.
 * If the socket does not already have a transaction state, this function sets it up.
 *
 * @param {Object} socket - The socket object representing the connection.
 */
function initialiseTransactionState(socket) {
  if (!TRANSACTION.has(socket)) {
    TRANSACTION.set(socket, { enabled: false, queue: [] });
  }
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
    const redisCommands = parseBulkStringArray(stringData);
    redisCommands.forEach(({ command, size }) => {
      console.log(
        `Socket:  ${socket.remoteAddress}:${socket.remotePort}. Incoming command: ${command}. Bytes received: ${size}`,
      );

      const [commandName, ...args] = command;

      const processor = processors[commandName.toLowerCase()];

      if (processor) {
        initialiseTransactionState(socket);
        if (queueCommand(socket, commandName.toLowerCase(), args, processor)) return;

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

/**
 * Handles data events for the master.
 *
 * @param {Object} socket - The socket object representing the connection.
 * @param {Buffer} data - The data received from the socket.
 */
function handleMasterDataEvent(socket, data) {
  handleDataEvent(socket, data, processors.master);
}

/**
 * Handles data events for the replica.
 *
 * @param {Object} socket - The socket object representing the connection.
 * @param {Buffer} data - The data received from the socket.
 */
function handleReplicaDataEvent(socket, data) {
  handleDataEvent(socket, data, processors.replica, (size) => {
    const newOffset = REPLICA.bytesProcessed + size;
    console.log(`Incrementing replica offset. ${REPLICA.bytesProcessed} plus ${size} = ${newOffset}`);
    REPLICA.bytesProcessed = newOffset;
  });
}

/**
 * Initializes the server and sets up the necessary configurations.
 */
function initialise() {
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

initialise();
