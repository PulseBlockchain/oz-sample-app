let SampleCrowdsale = artifacts.require('./SampleCrowdsale.sol')
let SampleToken = artifacts.require('./SampleToken.sol')
let moment = require('moment')

const multiplier = 10 ** 18

module.exports = function (deployer) {
  const startTime = Math.round(moment().subtract(1, 'd').valueOf() / 1000) // Yesterday
  const endTime = Math.round(moment().add(20, 'd').valueOf() / 1000) // Today + 20 days

  return deployer
    .then(() => {
      return deployer.deploy(SampleToken)
    })
    .then(() => {
      return deployer.deploy(SampleCrowdsale,
        startTime,
        endTime,
        5,
        web3.eth.accounts[9],
        2 * multiplier, // 2 ETH
        500 * multiplier, // 500 ETH
        SampleToken.address
      )
    }).then(() => {
      let tokenInstance = SampleToken.at(SampleToken.address)
      tokenInstance.transferOwnership(SampleCrowdsale.address)
    }).catch(function (err) {
      console.log('Deplyoment failed')
      console.log(err)
    })
}
