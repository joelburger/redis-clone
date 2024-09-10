const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { constructSimpleInteger, constructArray } = require('../helpers/resp');
const { REPLICAS, REPLICA_ACK, REPLICA_WAIT, REPLICA_OFFSET } = require('../global');

function stopTimers() {
  if (REPLICA_WAIT.intervalId) clearInterval(REPLICA_WAIT.intervalId);
  if (REPLICA_WAIT.timeoutId) clearTimeout(REPLICA_WAIT.timeoutId);
}

function resetReplicaWait() {
  REPLICA_WAIT.ack = 0;
  REPLICA_WAIT.requestedAck = 0;
  REPLICA_WAIT.timeout = 0;
  REPLICA_WAIT.timeoutId = null;
  REPLICA_WAIT.intervalId = null;
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.WAIT, args, 2);

    //The WAIT command should return when either
    // (a) the specified number of replicas have acknowledged the command,
    // (b) the timeout expires.

    resetReplicaWait();

    const [replicaCount, timeout] = args;

    REPLICA_WAIT.requestedAck = parseInt(replicaCount, 10);
    REPLICA_WAIT.timeout = parseInt(timeout, 10);

    // Send GETACK to all replicas
    REPLICAS.forEach((replicaSocket) => replicaSocket.write(constructArray(['REPLCONF', 'GETACK', '*'])));

    if (REPLICA_WAIT.timeout > 0) {
      console.log(`Setting replica wait timeout to ${REPLICA_WAIT.timeout}`);
      REPLICA_WAIT.timeoutId = setTimeout(() => {
        console.log(`Timeout reached. Returning ack value of ${REPLICA_WAIT.ack || REPLICAS.length}`);
        stopTimers();
        socket.write(constructSimpleInteger(REPLICA_WAIT.ack || REPLICAS.length));
        resetReplicaWait();
      }, REPLICA_WAIT.timeout);
    }

    REPLICA_WAIT.intervalId = setInterval(() => {
      if (REPLICA_WAIT.ack >= REPLICA_WAIT.requestedAck) {
        stopTimers();
        console.log(`Requested ack has been reached. Request was ${REPLICA_WAIT.requestedAck}`);
        socket.write(constructSimpleInteger(REPLICA_WAIT.ack));
        resetReplicaWait();
      }
    }, 1);
  },
};
