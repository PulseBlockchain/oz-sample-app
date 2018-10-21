let ECRecovery = artifacts.require('../node_modules/openzeppelin-solidity/test/cryptography/ECDSA.sol')
let TestCrowdsale = artifacts.require('./TestCrowdsale.sol')
let TestToken = artifacts.require('./TestToken.sol')
let TestPlatform = artifacts.require('./TestPlatform.sol')

module.exports = function (deployer) {
  deployer.deploy(ECRecovery)
  deployer.link(ECRecovery, TestPlatform)
  deployer.deploy(TestPlatform)
}

// thanks https://github.com/OpenZeppelin/openzeppelin-solidity/tree/master/test/helpers
const duration = {
  seconds: function (val) { return val },
  minutes: function (val) { return val * this.seconds(60) },
  hours: function (val) { return val * this.minutes(60) },
  days: function (val) { return val * this.hours(24) },
  weeks: function (val) { return val * this.days(7) },
  years: function (val) { return val * this.days(365) }
}

const weiMultiplier = 10 ** 18

module.exports = function (deployer) {
  const latestTime = web3.eth.getBlock('latest').timestamp
  const openingTime = latestTime + duration.weeks(1)
  const closingTime = openingTime + duration.weeks(1)
  const platformOwnerAddress = web3.eth.accounts[3] // growth fund.

  return deployer
    .then(() => {
      return deployer.deploy(ECRecovery)
    }).then(() => {
      return deployer.deploy(TestToken)
    })
    .then(() => {
      return deployer.deploy(TestCrowdsale,
        openingTime,
        closingTime,
        15200,
        web3.eth.accounts[1],
        40000 * weiMultiplier, // CAP ETH
        TestToken.address,
        28500 * weiMultiplier // GOAL = 38% of 75000
      )
    }).then(() => {
      let tokenInstance = TestToken.at(TestToken.address)
      tokenInstance.addMinter(TestCrowdsale.address)
      tokenInstance.transferOwnership(TestCrowdsale.address)
      console.log(`Deployment: TestCrowdsale at ${TestCrowdsale.address} and TestToken at ${TestToken.address}`)
    }).then(() => {
      deployer.link(ECRecovery, TestPlatform)
      return deployer.deploy(TestPlatform, TestToken.address)
    }).then(() => {
      let platformInstance = TestPlatform.at(TestPlatform.address)
      platformInstance.transferOwnership(platformOwnerAddress)
      console.log(`Deployment: TestPlatform at ${TestPlatform.address} owned by ${platformOwnerAddress}`)
    }).catch(function (err) {
      console.log('Deplyoment failed')
      console.log(err)
    })
}
