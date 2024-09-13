const { commands } = require('../constants');
const { validateArguments, compareStreamId } = require('../helpers/common');
const { constructArray, constructString, constructArrayDeclaration } = require('../helpers/resp');
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
    let result = '';
    let entryCount = 0;
    for (const entry of stream.value) {
      if (compareStreamId(fromStreamId, entry.streamId) >= 0) {
        if (!toStreamId || compareStreamId(toStreamId, entry.streamId) <= 0) {
          entryCount++;
          result += `${constructArrayDeclaration(2)}${constructString(entry.streamId)}${constructArray(entry.data)}`;
        }
      }
    }
    result = `${constructArrayDeclaration(entryCount)}${result}`;
    socket.write(result);
  },
};
