const { commands } = require('../constants');
const { validateArguments, compareStreamId } = require('../helpers/common');
const { STORAGE } = require('../global');
const { constructArrayDeclaration, constructString, constructArray } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.XREAD, args, 3);

    const [, streamKey, specifiedStreamId] = args;
    const stream = STORAGE.has(streamKey) ? STORAGE.get(streamKey) : { value: new Set(), type: 'stream' };

    let result = '';
    let entryCount = 0;

    for (const entry of stream.value) {
      if (compareStreamId(specifiedStreamId, entry.streamId) > 0) {
        entryCount++;
        result += `${constructArrayDeclaration(2)}${constructString(entry.streamId)}${constructArray(entry.data)}`;
      }
    }
    result = `${constructArrayDeclaration(entryCount)}${result}`;
    result = `${constructArrayDeclaration(1)}${constructArrayDeclaration(2)}${constructString(streamKey)}${result}`;

    socket.write(result);
  },
};
