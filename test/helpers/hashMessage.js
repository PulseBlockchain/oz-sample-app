import utils from 'ethereumjs-util';

// Hash and add same prefix to the hash that testrpc use.
module.exports = function (message) {
  const messageHex = Buffer.from(message);
  const prefix = utils.toBuffer(`\x19Ethereum Signed Message:\n${messageHex.length.toString()}`);
  return utils.bufferToHex(utils.sha3(Buffer.concat([prefix, messageHex])));
};
