const { CONFIG } = require('../global');

function validateArguments(commandName, args, minCount, maxCount) {
  if (minCount === 0) {
    return args.length === 0;
  }

  if (args.length < minCount || (maxCount && args.length > maxCount)) {
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

function isNumber(value) {
  return !isNaN(Number(value));
}

function createItem(key, value, type, expiryArgument, expiresIn) {
  const item = {
    name: key,
    value: isNumber(value) ? Number(value) : value,
    type,
  };

  if (expiryArgument?.toLowerCase() === 'px') {
    item.expireAt = new Date(Date.now() + Number(expiresIn));
  }

  return item;
}

/**
 * Compares two stream IDs.
 *
 * @param {string} leftStreamId - The stream ID to compare.
 * @param {string} rightStreamId - The other stream ID to compare.
 * @returns {number} - Returns 1 if rightStreamId is greater, -1 if leftStreamId is greater, and 0 if they are equal.
 */
function compareStreamId(leftStreamId, rightStreamId) {
  const [leftFirstId, leftSecondId] = leftStreamId.split('-').map(Number);
  const [rightFirstId, rightSecondId] = rightStreamId.split('-').map(Number);

  if (leftFirstId !== rightFirstId) {
    return rightFirstId > leftFirstId ? 1 : -1;
  }
  return leftSecondId === rightSecondId ? 0 : rightSecondId > leftSecondId ? 1 : -1;
}

/**
 * Pauses the execution for a specified number of milliseconds.
 *
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} - A promise that resolves after the specified time.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  compareStreamId,
  createItem,
  generateRandomString,
  isMaster,
  isNumber,
  isReplica,
  sleep,
  validateArguments,
};
