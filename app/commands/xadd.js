const { commands } = require('../constants');
const { validateArguments, isMaster } = require('../helpers/common');
const { STORAGE } = require('../global');
const { createItem } = require('./set');
const { constructString } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.XADD, args, 3, 20);

    const [streamKey, streamId, ...values] = args;
    const item = createItem(streamKey, [streamId, values], 'stream');

    STORAGE.set(streamKey, item);

    socket.write(constructString(streamId));

    // TODO propagate to replicas
  },
};
