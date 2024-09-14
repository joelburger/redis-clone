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

module.exports = {
  process(socket, args) {
    validateArguments(commands.XREAD, args, 3);

    const [, ...keysAndIds] = args;
    const queries = parseQuery(keysAndIds);

    let result = '';
    for (const query of queries) {
      let subResult = '';
      const stream = STORAGE.has(query.streamKey)
        ? STORAGE.get(query.streamKey)
        : {
            value: new Set(),
            type: 'stream',
          };
      let entryCount = 0;
      for (const entry of stream.value) {
        if (compareStreamId(query.streamId, entry.streamId) > 0) {
          entryCount++;
          subResult += `${constructArrayDeclaration(2)}${constructString(entry.streamId)}${constructArray(entry.data)}`;
        }
      }
      result += `${constructArrayDeclaration(2)}${constructString(query.streamKey)}${constructArrayDeclaration(entryCount)}${subResult}`;
    }

    socket.write(`${constructArrayDeclaration(queries.length)}${result}`);
  },
};
