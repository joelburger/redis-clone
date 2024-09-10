const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { constructSimpleInteger, constructArray } = require('../helpers/resp');
const { REPLICAS, REPLICA_ACK, REPLICA_WAIT } = require('../global');

/**
 * Stops any active timers waiting for acknowledgments.
 * Clears both the interval and timeout if they are set.
 */
function stopTimers() {
  if (REPLICA_WAIT.intervalId) clearInterval(REPLICA_WAIT.intervalId);
  if (REPLICA_WAIT.timeoutId) clearTimeout(REPLICA_WAIT.timeoutId);
}

/**
 * Checks if the required number of acknowledgments (acks) have been received
 * and responds to the client socket if the condition is met.
 *
 * @param {object} socket - The client socket to respond to.
 */
function checkAckAndRespond(socket) {
  REPLICA_WAIT.intervalId = setInterval(() => {
    if (REPLICA_WAIT.ack >= REPLICA_WAIT.requestedAck) {
      stopTimers();
      console.log(`Requested ack has been reached. Request was ${REPLICA_WAIT.requestedAck}`);
      socket.write(constructSimpleInteger(REPLICA_WAIT.ack));
    }
  }, 1);
}

/**
 * Sets a timeout for waiting for acknowledgments from replicas.
 * If the timeout is reached before the required number of acknowledgments
 * are received, it stops the timers and responds to the client socket
 * with the current acknowledgment count.
 *
 * @param {object} socket - The client socket to respond to.
 */
function setReplicaWaitTimeout(socket) {
  console.log(`Setting replica wait timeout to ${REPLICA_WAIT.timeout}`);
  REPLICA_WAIT.timeoutId = setTimeout(() => {
    console.log(`Timeout reached. Returning ack value of ${REPLICA_WAIT.ack || REPLICAS.length}`);
    stopTimers();
    socket.write(constructSimpleInteger(REPLICA_WAIT.ack || REPLICAS.length));
  }, REPLICA_WAIT.timeout);
}

/**
 * Sends an acknowledgment request to all replica sockets.
 */
function sendAckToAllReplicas() {
  REPLICAS.forEach((replicaSocket) => replicaSocket.write(constructArray(['REPLCONF', 'GETACK', '*'])));
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.WAIT, args, 2);
    REPLICA_WAIT.requestedAck = parseInt(args[0], 10);
    REPLICA_WAIT.timeout = parseInt(args[1], 10);

    // Reset ack counter
    REPLICA_WAIT.ack = 0;

    sendAckToAllReplicas();

    //The WAIT command should return when either
    // (a) the specified number of replicas have acknowledged the command,
    // (b) the timeout expires.
    checkAckAndRespond(socket);
    setReplicaWaitTimeout(socket);
  },
};
