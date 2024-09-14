const { commands } = require('../constants');
const { validateArguments, compareStreamId } = require('../helpers/common');
const { STORAGE } = require('../global');
const { constructArrayDeclaration, constructString, constructArray } = require('../helpers/resp');

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

module.exports = {
  process(socket, args) {
    validateArguments(commands.XREAD, args, 3);

    const blockTimeout = args[0].toLowerCase() === 'block' ? Number(args[1]) : undefined;
    const keysAndIds = args.slice(blockTimeout ? 3 : 1);
    const queries = parseQuery(keysAndIds);

    const result = queries.map((query) => {
      const stream = fetchStream(query.streamKey);
      const subResult = Array.from(stream.value)
        .filter((entry) => compareStreamId(query.streamId, entry.streamId) > 0)
        .map((entry) => constructArray([constructString(entry.streamId), constructArray(entry.data)], false));
      return constructArray([constructString(query.streamKey), constructArray(subResult, false)], false);
    });

    socket.write(constructArray(result, false));
  },
};
