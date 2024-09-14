// See https://redis.io/docs/latest/develop/reference/protocol-spec/

const NULL_VALUE = '$-1\r\n';

const EMPTY_ARRAY = '*0\r\n';

const EMPTY_RDB_FILE =
  'UkVESVMwMDEx+glyZWRpcy12ZXIFNy4yLjD6CnJlZGlzLWJpdHPAQPoFY3RpbWXCbQi8ZfoIdXNlZC1tZW3CsMQQAPoIYW9mLWJhc2XAAP/wbjv+wP9aog==';

function constructFile(base64String) {
  const rdbBuffer = Buffer.from(base64String, 'base64');
  const rdbHead = Buffer.from(`$${rdbBuffer.length}\r\n`);

  return Buffer.concat([rdbHead, rdbBuffer]);
}

function constructString(value) {
  return `$${String(value).length}\r\n${value}\r\n`;
}

function constructArray(values) {
  return values.reduce((acc, value) => {
    return acc + value;
  }, `*${values.length}\r\n`);
}

function constructBulkStringArray(values) {
  return values.reduce((acc, value) => {
    return acc + constructString(value);
  }, `*${values.length}\r\n`);
}

function constructError(message) {
  return `-${message}\r\n`;
}

function constructSimpleNumber(numberValue) {
  return `:${numberValue}\r\n`;
}

function constructSimpleString(stringValue) {
  return `+${stringValue}\r\n`;
}

function parseBulkStringArray(arrayString) {
  const regex = /\*(\d+)\r\n(\$\d+\r\n.+\r\n)+/g;
  const matches = arrayString.match(regex) || [];

  const results = [];

  matches.forEach((match) => {
    results.push({
      size: match.length,
      command: match
        .split('\r\n')
        .filter(
          (component) => component && (!component.startsWith('*') || component === '*') && !component.startsWith('$'),
        ),
    });
  });

  return results;
}

function removeTerminators(stringValue, subChar = '') {
  if (!stringValue) {
    return '';
  }
  return stringValue.replace(/[\r\n]/g, subChar);
}

module.exports = {
  constructArray,
  constructBulkStringArray,
  constructError,
  constructFile,
  constructString,
  constructSimpleNumber,
  constructSimpleString,
  parseBulkStringArray,
  removeTerminators,
  EMPTY_ARRAY,
  EMPTY_RDB_FILE,
  NULL_VALUE,
};
