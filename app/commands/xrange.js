const { commands } = require('../constants');
const { validateArguments, compareStreamId } = require('../helpers/common');
const { constructArray, constructBulkStringArray, constructString } = require('../helpers/resp');
const { STORAGE } = require('../global');

function addDefaultSequenceNumber(streamId) {
  if (streamId === '-') {
    return '0-1';
  }

  if (streamId === '+') {
    return null;
  }

  return streamId.includes('-') ? streamId : `${streamId}-0`;
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.XRANGE, args, 3);

    const [streamKey] = args;
    const [, fromStreamId, toStreamId] = args.map(addDefaultSequenceNumber);

    const stream = STORAGE.has(streamKey) ? STORAGE.get(streamKey) : { value: new Set(), type: 'stream' };

    const result = Array.from(stream.value)
      .filter(
        (entry) =>
          compareStreamId(fromStreamId, entry.streamId) >= 0 &&
          (!toStreamId || compareStreamId(toStreamId, entry.streamId) <= 0),
      )
      .map((entry) => constructArray([constructString(entry.streamId), constructBulkStringArray(entry.data)]));

    socket.write(constructArray(result));
  },
};
