const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { STORAGE } = require('../global');
const { constructString, constructError } = require('../helpers/resp');

function processStreamId(stream, newStreamId) {
  const previousStreamEntry = Array.from(stream.value)?.pop();
  const [previousStreamFirstId, previousStreamSecondId] = previousStreamEntry
    ? previousStreamEntry.streamId.split('-').map(Number)
    : [0, 0];
  const [newStreamFirstId, newStreamSecondId] = newStreamId.split('-');

  if (newStreamId === '*') {
    if (previousStreamEntry) {
      return `${previousStreamFirstId}-${previousStreamSecondId + 1}`;
    }
    return `${Date.now()}-0`;
  }

  if (newStreamSecondId === '*') {
    if (Number(newStreamFirstId) === previousStreamFirstId) {
      return `${previousStreamFirstId}-${previousStreamSecondId + 1}`;
    }
    if (newStreamFirstId === '0') {
      return `${newStreamFirstId}-1`;
    }
    return `${newStreamFirstId}-0`;
  }

  return newStreamId;
}

function validateNewStreamId(stream, newStreamId) {
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

    const [streamKey, streamId, ...values] = args;
    const stream = STORAGE.has(streamKey) ? STORAGE.get(streamKey) : { value: new Set(), type: 'stream' };
    const newStreamId = processStreamId(stream, streamId);
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
