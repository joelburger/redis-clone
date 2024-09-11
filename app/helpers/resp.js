const NULL_VALUE = '$-1\r\n';

const EMPTY_ARRAY = '*0\r\n';

const EMPTY_RDB_FILE =
  'UkVESVMwMDEx+glyZWRpcy12ZXIFNy4yLjD6CnJlZGlzLWJpdHPAQPoFY3RpbWXCbQi8ZfoIdXNlZC1tZW3CsMQQAPoIYW9mLWJhc2XAAP/wbjv+wP9aog==';

function constructFile(base64String) {
  const rdbBuffer = Buffer.from(base64String, 'base64');
  const rdbHead = Buffer.from(`$${rdbBuffer.length}\r\n`);

  return Buffer.concat([rdbHead, rdbBuffer]);
}

function constructArray(values, stringifyValues = true) {
  let output = `*${values.length}\r\n`;
  for (const value of values) {
    if (stringifyValues) {
      output += `$${String(value).length}\r\n${value}\r\n`;
    } else {
      output += value;
    }
  }
  return output;
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

function parseArrayBulkString(arrayString) {
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
  constructError,
  constructSimpleString,
  constructSimpleNumber: constructSimpleNumber,
  constructFile,
  parseArrayBulkString,
  removeTerminators,
  EMPTY_ARRAY,
  NULL_VALUE,
  EMPTY_RDB_FILE,
};
