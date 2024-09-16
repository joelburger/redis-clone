function readUnixTime(buffer, cursor, numberOfBytes) {
  let unixTime = 0;
  for (let i = 0; i < numberOfBytes; i++) {
    unixTime += buffer[cursor + i] * Math.pow(256, i);
  }

  return unixTime;
}

function readString(buffer, cursor = 0) {
  if (cursor >= buffer.length) {
    return [null, 0];
  }

  // first character indicates the length of the key
  const stringLength = buffer[cursor];

  // increment cursor to the start of the string value
  cursor++;

  // retrieve the string value
  const stringValue = buffer.slice(cursor, cursor + stringLength)?.toString('utf8');

  // increment cursor with length of string
  cursor += stringLength;

  return { stringValue, cursor };
}

function sliceData(buffer, startCharacter, endCharacter) {
  const startPosition = buffer.findIndex((byte) => byte === startCharacter);
  const endPosition = buffer.findIndex((byte) => byte === endCharacter);

  if (startPosition > -1 && endPosition > startPosition) {
    return buffer.slice(startPosition + 1, endPosition);
  }
  return buffer;
}

module.exports = {
  readUnixTime,
  readString,
  sliceData,
};
