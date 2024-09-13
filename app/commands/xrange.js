const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { constructArray, constructString, constructArrayDeclaration } = require('../helpers/resp');
const { STORAGE } = require('../global');

function addDefaultSequenceNumber(streamId) {
  return streamId.includes('-') ? streamId : `${streamId}-0`;
}

function isGreaterThanOrEqualTo(leftStreamId, rightStreamId) {
  const [lefStreamFirstId, leftStreamSecondId] = leftStreamId.split('-');
  const [rightStreamFirstId, rightStreamSecondId] = rightStreamId.split('-');

  if (rightStreamFirstId > lefStreamFirstId) {
    return true;
  } else if (lefStreamFirstId === rightStreamFirstId) {
    return rightStreamSecondId >= leftStreamSecondId;
  }
  return false;
}

function isLessThanOrEqualTo(leftStreamId, rightStreamId) {
  const [lefStreamFirstId, leftStreamSecondId] = leftStreamId.split('-');
  const [rightStreamFirstId, rightStreamSecondId] = rightStreamId.split('-');

  if (rightStreamFirstId < lefStreamFirstId) {
    return true;
  } else if (lefStreamFirstId === rightStreamFirstId) {
    return rightStreamSecondId <= leftStreamSecondId;
  }
  return false;
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
      if (isGreaterThanOrEqualTo(fromStreamId, entry.streamId)) {
        if (!toStreamId || isLessThanOrEqualTo(toStreamId, entry.streamId)) {
          keyCount++;
          result += `${constructArrayDeclaration(2)}${constructString(entry.streamId)}${constructArray(entry.data)}`;
        }
      }
    }
    result = `${constructArrayDeclaration(keyCount)}${result}`;
    socket.write(result);
  },
};
