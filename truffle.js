let truffleOptions  = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      gas: 6500000,
      network_id: '5777'
    }
  },
  rpc: {
    // Use the default host and port when not using ropsten
    host: 'localhost',
    port: 7545
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}

module.exports = truffleOptions
