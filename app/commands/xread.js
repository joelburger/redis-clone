const { commands } = require('../constants');
const { validateArguments, compareStreamId, sleep } = require('../helpers/common');
const { STORAGE } = require('../global');
const {
  constructString,
  constructBulkStringArray,
  constructArray,
  EMPTY_ARRAY,
  NIL_VALUE,
} = require('../helpers/resp');

function parseQuery(keysAndIds) {
  const half = Math.ceil(keysAndIds.length / 2);

  const streamKeys = keysAndIds.slice(0, half);
  const streamIds = keysAndIds.slice(half);

  return streamKeys.map((key, index) => ({ streamKey: key, streamId: streamIds[index] }));
}

/**
 * Fetches the stream associated with the given stream key from the storage.
 * If the stream does not exist, it returns a new stream object with an empty set.
 *
 * @param {string} streamKey - The key of the stream to fetch.
 * @returns {Object} - The stream object associated with the given key.
 */
function fetchStream(streamKey) {
  return STORAGE.has(streamKey) ? STORAGE.get(streamKey) : { value: new Set(), type: 'stream' };
}

/**
 * Sends data to the socket based on the provided queries.
 * For each query, it fetches the stream associated with the stream key,
 * filters the entries based on the stream ID, and constructs the response.
 * If there is data to send, it writes the constructed array to the socket.
 *
 * @param {Object} socket - The socket to write data to.
 * @param {Array} queries - The queries containing stream keys and IDs.
 * @returns {boolean} - Returns true if data was sent, otherwise false.
 */
function sendData(socket, queries) {
  const result = queries.map((query) => {
    const stream = fetchStream(query.streamKey);
    const subResult = Array.from(stream.value)
      .filter((entry) => compareStreamId(query.streamId, entry.streamId) > 0)
      .map((entry) => {
        // Ensures that the `streamId` in the query reflects the most recent entry
        // processed, which is important for subsequent filtering and processing
        // of stream entries.
        query.streamId = entry.streamId;

        return constructArray([constructString(entry.streamId), constructBulkStringArray(entry.data)]);
      });
    return constructArray([constructString(query.streamKey), constructArray(subResult)]);
  });

  if (result.length) {
    socket.write(constructArray(result));
    return true;
  }

  return false;
}

function continueToWait(blockTimeout, startTime) {
  return blockTimeout === 0 || startTime + blockTimeout > Date.now();
}

module.exports = {
  async process(socket, args) {
    validateArguments(commands.XREAD, args, 3);

    const blockEnabled = args[0].toLowerCase() === 'block';
    const blockTimeout = blockEnabled ? Number(args[1]) : undefined;
    const keysAndIds = args.slice(blockEnabled ? 3 : 1);
    const queries = parseQuery(keysAndIds);

    if (blockEnabled) {
      // Continuously check for new data until the block timeout is reached,
      // or stream data has been sent.
      const startTime = Date.now();
      while (continueToWait(blockTimeout, startTime)) {
        // Reduce polling frequency by pausing execution for 2.5 seconds
        await sleep(2500);

        // If the block timeout is 0 (waiting indefinitely), exit the function once data
        // has been successfully sent.
        if (sendData(socket, queries) && blockTimeout === 0) return;
      }
      // Write a NIL value to the socket if the block timeout is reached and
      // no stream data has been sent to the client.
      socket.write(NIL_VALUE);
    } else {
      sendData(socket, queries);
    }
  },
};
