# Hashnode+

We learned from [Hashnode tutorial](https://github.com/sandeeppanda92/HashnodeTestCrowdsale)
and enhanced it a bit as we recently built the  [Pulse](https://pulseagent.co) [MVP](https://dapp.pulseagent.co).
## Enhancements
* Upgrade to OZ 1.10.0
* Instead of removing an assertion in CrowdSale about beginTime (error prone on OZ upgrades) uses 
[`increaseTime`](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/test/helpers/increaseTime.js) from OZ test helpers. 
* async/await for tests
* BigNumber for assertions to deal with real life ICO `wei`s 
* Platform Contract that uses the ERC20 Token
* Using [ECRecovery](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ECRecovery.sol) 
approach for [signature oriented contract interaction](https://blog.hellobloom.io/how-to-make-a-user-friendly-ethereum-dapp-5a7e5ea6df22?gi=b673200bb728) to save gas for users 
## Stack
- macOS High Sierra 10.13.4 (17E202) 
- node.js 8.9.4, npm 5.6.0
- truffle 4.1.11
- Open Zeppelin 1.10.0
- Ganache CLI v6.1.0 (ganache-core: 2.1.0)

## Running

* `npm install`
* `bin/sganache.sh` so we run tests needing high ether. [Thanks OZ Devs](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/scripts/test.sh)
* `truffle test` should give this output if all is well.

```bash
oznew git:(master) ✗ truffle test
Compiling ./contracts/ECRecovery.sol...
Compiling ./contracts/Migrations.sol...
Compiling ./contracts/TestCrowdsale.sol...
Compiling ./contracts/TestPlatform.sol...
Compiling ./contracts/TestToken.sol...
Compiling openzeppelin-solidity/contracts/crowdsale/Crowdsale.sol...
Compiling openzeppelin-solidity/contracts/crowdsale/distribution/FinalizableCrowdsale.sol...
Compiling openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol...
Compiling openzeppelin-solidity/contracts/crowdsale/distribution/utils/RefundVault.sol...
Compiling openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol...
Compiling openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol...
Compiling openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol...
Compiling openzeppelin-solidity/contracts/math/SafeMath.sol...
Compiling openzeppelin-solidity/contracts/ownership/Ownable.sol...
Compiling openzeppelin-solidity/contracts/token/ERC20/BasicToken.sol...
Compiling openzeppelin-solidity/contracts/token/ERC20/ERC20.sol...
Compiling openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol...
Compiling openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol...
Compiling openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol...

Compilation warnings encountered:
--- removed some warnings from OZ due to it not using constructor ---

Deployment: TestCrowdsale at 0x0df4468bcf37a5c8c4612b204a45b72cd1664547 and TestToken at 0x0c3ceb2880c3f8f4d2740d5bf9932a7f90d600ac
Deployment: TestPlatform at 0x7daadd4eeada6aa4476af0ccf0f696b227a969b4 owned by 0xce42bdb34189a93c55de250e011c68faee374dd3


  Contract: TestPlatform
    ICO Tests
      ✓ should create crowdsale, token and platform with correct parameters
      ✓ should not accept payments before start (42ms)
      ✓ should set stage to PreICO
      ✓ one ETH should buy 30400 Test Tokens in PreICO (192ms)
      ✓ should transfer the ETH to wallet immediately in Pre ICO (236ms)
      ✓ should set variable `totalWeiRaisedDuringPreICO` correctly
      ✓ should set stage to ICO
      ✓ one ETH should buy 15200 Test Tokens in ICO (63ms)
      ✓ should transfer the raised ETH to RefundVault during ICO (107ms)
      ✓ Should reach our ICO goal (59ms)
      ✓ Vault balance should be added to our wallet once ICO is over (519ms)
      ✓ Should perform normal token transfer (53ms)
      ✓ Should perform delegated token transfer using transferFrom (115ms)
    Signature Tests
      ✓ Should recover signer by calling a solidity contract (133ms)
      ✓ Should recover signer personal data with  eth-sig-util
      ✓ Should recover signer typed data with  eth-sig-util
    Platform Tests
Seller bid recorded with txHash = 0x9276624da4ae68df0f4eb7f68e6058174b7acb79d8fdec4b36700b02c3c1fc0c
Seller test paid for bid txHash = 0x6f402165bdf9d11d496a4ae8a6a14d8db8b161ed5efd978dfa8b83655026ffef
      ✓ Should register a  bid on the blockchain, and confirm test tokens were deducted for the cost of the action (216ms)


  17 passing (2s)
```  



