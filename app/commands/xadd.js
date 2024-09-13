const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { STORAGE } = require('../global');
const { createItem } = require('./set');
const { constructString, constructError } = require('../helpers/resp');

/**
 * Example stream:
 * [
 *   [
 *     "1526985054069-0",
 *     [
 *       "temperature",
 *       "36",
 *       "humidity",
 *       "95"
 *     ]
 *   ],
 *   [
 *     "1526985054079-0",
 *     [
 *       "temperature",
 *       "37",
 *       "humidity",
 *       "94"
 *     ]
 *   ],
 * ]
 */

/**
 * Another example:
 * [
 *   [
 *     "some_key",
 *     [
 *       [
 *         "1526985054079-0",
 *         [
 *           "temperature",
 *           "37",
 *           "humidity",
 *           "94"
 *         ]
 *       ]
 *     ]
 *   ]
 * ]
 */

function validateNewStreamId(stream, newStreamId, socket) {
  const previousStreamEntry = Array.from(stream.value)?.pop();

  if (!previousStreamEntry) {
    return null;
  }

  const [previousStreamFirstId, previousStreamSecondId] = previousStreamEntry.streamId.split('-').map(Number);
  const [newStreamFirstId, newStreamSecondId] = newStreamId.split('-').map(Number);

  if (newStreamFirstId === 0 && newStreamSecondId === 0) {
    return 'ERR The ID specified in XADD must be greater than 0-0';
  }

  if (
    newStreamFirstId < previousStreamFirstId ||
    (newStreamFirstId === previousStreamFirstId && newStreamSecondId <= previousStreamSecondId)
  ) {
    return 'ERR The ID specified in XADD is equal or smaller than the target stream top item';
  }

  return null;
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.XADD, args, 3, 20);

    const [streamKey, newStreamId, ...values] = args;

    let stream;
    if (STORAGE.has(streamKey)) {
      stream = STORAGE.get(streamKey);
    } else {
      stream = { value: new Set(), type: 'stream' };
    }

    const error = validateNewStreamId(stream, newStreamId);

    if (error) {
      socket.write(constructError(error));
      return;
    }

    const streamItem = { streamId: newStreamId, data: values };

    stream.value.add(streamItem);

    STORAGE.set(streamKey, stream);

    socket.write(constructString(newStreamId));
  },
};
