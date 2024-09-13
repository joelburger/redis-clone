const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { constructArray, constructString, constructArrayDeclaration } = require('../helpers/resp');
const { STORAGE } = require('../global');

function addDefaultSequenceNumber(streamId) {
  if (streamId === '-') {
    return '0-1';
  }

  return streamId.includes('-') ? streamId : `${streamId}-0`;
}

function compareStreamId(leftStreamId, rightStreamId) {
  const [leftFirstId, leftSecondId] = leftStreamId.split('-').map(Number);
  const [rightFirstId, rightSecondId] = rightStreamId.split('-').map(Number);

  if (leftFirstId !== rightFirstId) {
    return rightFirstId > leftFirstId ? 1 : -1;
  }
  return leftSecondId === rightSecondId ? 0 : rightSecondId > leftSecondId ? 1 : -1;
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.XRANGE, args, 3);

    const [streamKey] = args;
    const [, fromStreamId, toStreamId] = args.map(addDefaultSequenceNumber);

    const stream = STORAGE.has(streamKey) ? STORAGE.get(streamKey) : { value: new Set(), type: 'stream' };
    let result = '';
    let keyCount = 0;
    for (const entry of stream.value) {
      if (compareStreamId(fromStreamId, entry.streamId) >= 0) {
        if (!toStreamId || compareStreamId(toStreamId, entry.streamId) <= 0) {
          keyCount++;
          result += `${constructArrayDeclaration(2)}${constructString(entry.streamId)}${constructArray(entry.data)}`;
        }
      }
    }
    result = `${constructArrayDeclaration(keyCount)}${result}`;
    socket.write(result);
  },
};
