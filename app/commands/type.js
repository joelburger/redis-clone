const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { STORAGE } = require('../global');
const { constructSimpleString, NULL_VALUE } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.GET, args, 1);
    const [specifiedKey] = args;

    console.log('STORAGE', Array.from(STORAGE.values()));

    if (STORAGE.has(specifiedKey)) {
      const matched = STORAGE.get(specifiedKey);
      socket.write(constructSimpleString(matched.type));
    } else {
      socket.write(constructSimpleString('none'));
    }
  },
};
