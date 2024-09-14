const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { CONFIG } = require('../global');
const { constructBulkStringArray } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.CONFIG, args, 2);
    const [subCommand, key] = args;
    if (subCommand.toLowerCase() === 'get') {
      const configValue = CONFIG[key.toLowerCase()];
      socket.write(constructBulkStringArray([key, configValue]));
    } else {
      throw new Error(`Invalid argument for CONFIG: ${subCommand}`);
    }
  },
};
