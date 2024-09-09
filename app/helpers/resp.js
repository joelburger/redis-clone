const NULL_VALUE = '$-1\r\n';

const EMPTY_RDB_FILE =
  'UkVESVMwMDEx+glyZWRpcy12ZXIFNy4yLjD6CnJlZGlzLWJpdHPAQPoFY3RpbWXCbQi8ZfoIdXNlZC1tZW3CsMQQAPoIYW9mLWJhc2XAAP/wbjv+wP9aog==';

function constructFile(base64String) {
  const rdbBuffer = Buffer.from(base64String, 'base64');
  const rdbHead = Buffer.from(`$${rdbBuffer.length}\r\n`);

  return Buffer.concat([rdbHead, rdbBuffer]);
}

function constructArray(stringValues) {
  let output = `*${stringValues.length}\r\n`;
  for (const value of stringValues) {
    output += `$${value.length}\r\n${value}\r\n`;
  }
  return output;
}

function constructSimpleString(stringValue) {
  return `+${stringValue}\r\n`;
}

function parseArrayBulkString(arrayString) {
  const regex = /\*(\d+)\r\n(\$\d+\r\n.+\r\n)+/g;
  const matches = arrayString.match(regex) || [];

  const results = [];

  matches.forEach((match) => {
    results.push({
      size: match.length,
      item: match
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
  constructSimpleString,
  constructFile,
  parseArrayBulkString,
  removeTerminators,
  NULL_VALUE,
  EMPTY_RDB_FILE,
};
