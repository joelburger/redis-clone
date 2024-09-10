const { CONFIG } = require('../global');

function validateArguments(commandName, args, minCount, maxCount = minCount) {
  if (minCount === 0) {
    return args.length === 0;
  }

  if (args.length < minCount || args.length > maxCount) {
    throw new Error(`Invalid number of arguments for ${commandName}`);
  }
}

function generateRandomString(length = 40) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

function isMaster() {
  return CONFIG.serverInfo.role === 'master';
}

function isReplica() {
  return CONFIG.serverInfo.role === 'slave';
}

module.exports = {
  validateArguments,
  generateRandomString,
  isMaster,
  isReplica,
};
