const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { constructSimpleNumber, constructArray } = require('../helpers/resp');
const { REPLICA } = require('../global');

let timeout;
let requestedAck;
let intervalId;
let timeoutId;

/**
 * Stops any active timers waiting for acknowledgments.
 * Clears both the interval and timeout if they are set.
 */
function stopTimers() {
  if (intervalId) clearInterval(intervalId);
  if (timeoutId) clearTimeout(timeoutId);
}

/**
 * Checks if the required number of acknowledgments (acks) have been received
 * and responds to the client socket if the condition is met.
 *
 * @param {object} socket - The client socket to respond to.
 */
function checkAckAndRespond(socket) {
  intervalId = setInterval(() => {
    if (REPLICA.ack >= requestedAck) {
      stopTimers();
      console.log(`Requested ack has been reached. Request was ${requestedAck}`);
      socket.write(constructSimpleNumber(REPLICA.ack));
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
  console.log(`Setting replica wait timeout to ${timeout}`);
  timeoutId = setTimeout(() => {
    stopTimers();
    const result = REPLICA.ack || REPLICA.clients.length;
    console.log(`Timeout reached. Returning ack value of ${result}`);
    socket.write(constructSimpleNumber(result));
  }, timeout);
}

/**
 * Sends an acknowledgment request to all replica sockets.
 */
function sendAckRequestToAllReplicas() {
  // Reset the acknowledgment count to zero before sending acknowledgment requests.
  REPLICA.ack = 0;

  REPLICA.clients.forEach((replicaSocket) => replicaSocket.write(constructArray(['REPLCONF', 'GETACK', '*'])));
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.WAIT, args, 2);
    requestedAck = parseInt(args[0], 10);
    timeout = parseInt(args[1], 10);

    sendAckRequestToAllReplicas();

    //The WAIT command should return when either
    // (a) the specified number of replicas have acknowledged the command,
    // (b) the timeout expires.
    checkAckAndRespond(socket);
    setReplicaWaitTimeout(socket);
  },
};
