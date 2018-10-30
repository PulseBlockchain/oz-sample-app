import utils from 'ethereumjs-util';


// Hash and add same prefix to the hash that testrpc use.
export  function hashMessage (message) {
  const messageHex = Buffer.from(utils.sha3(message).toString('hex'), 'hex');
  const prefix = utils.toBuffer('\u0019Ethereum Signed Message:\n' + messageHex.length.toString());
  return utils.bufferToHex(utils.sha3(Buffer.concat([prefix, messageHex])));
};

// Hash and add same prefix to the hash that testrpc use.
export function hashMessageMetamask (message) {
  const messageHex = Buffer.from(message);
  const prefix = utils.toBuffer(`\x19Ethereum Signed Message:\n${messageHex.length.toString()}`);
  return utils.bufferToHex(utils.sha3(Buffer.concat([prefix, messageHex])));
};


