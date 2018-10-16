import ether from './helpers/ether'
import { advanceBlock } from './helpers/advanceToBlock'
import { increaseTimeTo, duration } from './helpers/increaseTime'
import EVMRevert from './helpers/EVMRevert'
import {hashMessage, hashMessageMetamask} from './helpers/hashMessage'
// thanks: https://github.com/OpenZeppelin/openzeppelin-solidity/tree/master/test/helpers

import { private_keys as PRIVATE_KEYS } from '../ganache-accounts.json'

import sigUtil from 'eth-sig-util'
import ethUtil from 'ethereumjs-util'
import * as bir from './data/BIR-algo-test'

const BigNumber = web3.BigNumber

require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should()

const TestCrowdsale = artifacts.require('TestCrowdsale')
const TestToken = artifacts.require('TestToken')
const TestPlatform = artifacts.require('TestPlatform')

contract('ICO Signature and Platform Tests', function ([owner, wallet, teamFund, growthFund, bountyFund, buyer, seller1, seller2, gasFund, foundationFund, bonusFund]) {
  let preRate = 30400, PRE_RATE, rate = 15200, RATE, GOAL, CAP
  let multiplier
  let crowdsale
  let token
  let openingTime
  let closingTime
  let afterClosingTime
  let platformContractOwner

  let platform
  // const web3SendPromisified = promisify(web3.currentProvider.sendAsync)
  const helloAlice = 'Hi Alice'

  before(async () => {
    // Advance to the next block to correctly read time in the solidity "now" function interpreted by ganache
    await advanceBlock()

    crowdsale = await TestCrowdsale.deployed()
    const tokenAddress = await crowdsale.token.call()
    token = TestToken.at(tokenAddress)
    // await token.addMinter(crowdsale.address)
    multiplier = 10 ** (await token.decimals())
    rate = await crowdsale.finalRate()
    RATE = new BigNumber(rate)
    preRate = await crowdsale.preRate()
    PRE_RATE = new BigNumber(preRate)
    GOAL = await crowdsale.goal()
    CAP = await crowdsale.cap()
    openingTime = await crowdsale.openingTime()
    closingTime = await crowdsale.closingTime()
    afterClosingTime = closingTime + duration.seconds(1)
    platform = await TestPlatform.deployed()
    platformContractOwner = growthFund
  })

  describe('ICO Tests', function () {
    it('should create crowdsale, token and platform with correct parameters', async () => {
      crowdsale.should.exist
      token.should.exist
      platform.should.exist
      const walletAddress = await crowdsale.wallet()
      const testTokenAddress = await platform.testToken()
      walletAddress.should.be.equal(wallet)
      testTokenAddress.should.be.equal(token.address)
    })

    it('should not accept payments before start', async () => {
      await crowdsale.send(ether(1)).should.be.rejectedWith(EVMRevert)
      await crowdsale.buyTokens(teamFund, {from: teamFund, value: ether(1)}).should.be.rejectedWith(EVMRevert)
    })

    it('should set stage to PreICO', async () => {
      await crowdsale.setCrowdsaleStage(0)
      const stage = await crowdsale.stage()
      stage.should.be.bignumber.equal(0)

      // assert.equal(stage.toNumber(), 0, 'The stage couldn\'t be set to PreICO')
    })

    it(`one ETH should buy ${preRate} Test Tokens in PreICO`, async () => {
      await increaseTimeTo(openingTime)
      const investmentAmount = ether(1)
      const expectedTokenAmount = PRE_RATE.mul(investmentAmount)
      // await increaseTimeTo(openingTime)
      // await crowdsale.buyTokens(investor1, { value: investmentAmount, from: investor1 }).should.be.fulfilled;
      await crowdsale.sendTransaction({from: teamFund, value: investmentAmount}).should.be.fulfilled;

      (await token.balanceOf(teamFund)).should.be.bignumber.equal(expectedTokenAmount);
      (await token.totalSupply()).should.be.bignumber.equal(expectedTokenAmount)
    })

    it('should transfer the ETH to wallet immediately in Pre ICO', async () => {
      // await increaseTimeTo(openingTime)
      let investmentAmount = ether(2)
      let balanceOfBeneficiary = await web3.eth.getBalance(wallet)
      // balanceOfBeneficiary = Number(balanceOfBeneficiary.toString(10))

      // second pre ICO purchase using 2 eth. Total eth raised is 3 so far
      await crowdsale.sendTransaction({from: teamFund, value: investmentAmount})

      let newBalanceOfBeneficiary = await web3.eth.getBalance(wallet)
      // newBalanceOfBeneficiary = Number(newBalanceOfBeneficiary.toString(10))
      assert.equal(newBalanceOfBeneficiary.toNumber(), balanceOfBeneficiary.plus(investmentAmount).toNumber(), 'ETH couldn\'t be transferred to the beneficiary')
    })

    it('should set variable `totalWeiRaisedDuringPreICO` correctly', async () => {
      var amount = await crowdsale.totalWeiRaisedDuringPreICO()
      assert.equal(amount.toNumber(), ether(3), 'Total ETH raised in PreICO was not calculated correctly')
    })

    it('should set stage to ICO', async () => {
      // await increaseTimeTo(openingTime)
      await crowdsale.setCrowdsaleStage(1)
      const stage = await crowdsale.stage()
      assert.equal(stage.toNumber(), 1, 'The stage couldn\'t be set to ICO')
    })

    it(`one ETH should buy ${rate} Test Tokens in ICO`, async () => {
      const investmentAmount = ether(1)
      const expectedTokenAmount = RATE.mul(investmentAmount)
      await crowdsale.sendTransaction({from: growthFund, value: investmentAmount}).should.be.fulfilled;
      (await token.balanceOf(growthFund)).should.be.bignumber.equal(expectedTokenAmount)
      // assert.equal(tokenAmount.toNumber(), 3 * multiplier, 'The sender didn\'t receive the tokens as per ICO rate')
    })

    it('Should reach our ICO goal', async () => {
      // await crowdsale.send(GOAL) // this sends as owner but throws a sender doesn't have enough funds to send tx
      const investmentAmount = GOAL
      const expectedTokenAmount = RATE.mul(investmentAmount)
      await crowdsale.sendTransaction({from: seller1, value: investmentAmount}).should.be.fulfilled;
      (await token.balanceOf(seller1)).should.be.bignumber.equal(expectedTokenAmount)
      const goalReached = await crowdsale.goalReached()
      goalReached.should.be.true
    })

    it('Escrow balance should be added to our wallet once ICO is over', async () => {
      let walletBalance = await web3.eth.getBalance(wallet)
      await increaseTimeTo(afterClosingTime)
      await crowdsale.finish(teamFund, growthFund, bountyFund, platform.address)
      let newWalletBalance = await web3.eth.getBalance(wallet)
      // TODO: improve this test
      newWalletBalance.should.be.bignumber.greaterThan(walletBalance)
      // assert.equal(newWalletBalance.toNumber(), walletBalance.plus(escrowBalance).toNumber(), 'Vault balance couldn\'t be sent to the wallet')
    })

    it('Should perform normal token transfer', async () => {
      const fromAccount = growthFund
      const toAccount = seller2
      const amount = 100
      const transferAmount = amount * multiplier
      let growthBalance = await token.balanceOf(fromAccount)
      assert.isAtLeast(growthBalance.toNumber(), transferAmount, `From account balance should be atleast ${amount}`)
      // console.log(`Attempting a transfer with growth balance of ${growthBalance.toNumber()}`)
      await token.transfer(toAccount, transferAmount, {from: fromAccount})
      assert.equal(await token.balanceOf(toAccount), transferAmount, `To account should have ${amount}`)
    })

    it('Should perform delegated token transfer using transferFrom', async () => {
      const fromAccount = growthFund
      const toAccount = buyer
      const limit = 4
      const amount = 3
      const transferLimit = limit * multiplier
      const transferAmount = amount * multiplier
      let growthBalance = await token.balanceOf(fromAccount)
      assert.isAtLeast(growthBalance.toNumber(), transferLimit, `From account balance should be atleast ${limit}`)
      await token.approve(toAccount, transferLimit, {from: fromAccount})
      assert.equal(await token.allowance(fromAccount, toAccount), transferLimit, `Allowance from->to should be ${limit}`)
      // console.log(`Attempting a transfer from with growth balance of ${growthBalance}`)
      await token.transferFrom(fromAccount, toAccount, transferAmount, {from: toAccount})
      assert.equal(await token.balanceOf(toAccount), transferAmount, `To account should have ${amount}`)
    })
  })
  describe('Signature Tests', function () {
    it('Signature Hacking', async () => {
      const message = 'Hi Alice'
      const signAddress = '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39'
      const privateKey = '2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200'

      /*
       signature below was obtained via code and live demo linked at
       https://github.com/PulseBlockchain/js-eth-personal-sign-examples
       (https://github.com/PulseBlockchain/js-eth-personal-sign-examples/blob/695d4b7c659bf59ae55bbc9291186a3a128fab6f/index.js#L19)
       using web.personal.sign. Can get the same via https://www.mycrypto.com/sign-and-verify-message/sign
        */
      const sig = '0x4f119a7d11506784657816ae2ec055170943416dc7982d7ab298addb3ae1cf6046fbda59da911e897a23ec0b217f69a87b4a190d2d47ed7dfd10fcce6f401ea81b'

      const { v, r, s } = ethUtil.fromRpcSig(sig)
      // https://gist.github.com/alexanderattar/29bef134239d5760b8d1fcc310b632be
      const hash = hashMessageMetamask(message)
      const recovered = await platform.recover(hash, sig)
      assert.equal(signAddress, recovered, 'Recovered address should be same as signAddress')
    })

    it('Should recover signer by calling a solidity contract', async () => {
      const message = helloAlice
      const signAddress = owner
      const sig = web3.eth.sign(signAddress, web3.sha3(message))

      // https://gist.github.com/alexanderattar/29bef134239d5760b8d1fcc310b632be
      const hash = hashMessage(message)
      const recovered = await platform.recover(hash, sig)
      assert.equal(signAddress, recovered, 'Recovered address should be same as signAddress')
    })

    it('Should recover signer personal data with  eth-sig-util', async () => {
      const text = helloAlice
      const message = ethUtil.bufferToHex(Buffer.from(text, 'utf8'))
      const signAddress = owner
      const keyOnly = PRIVATE_KEYS[signAddress]
      const pkeyBuffer = Buffer.from(keyOnly, 'hex')
      // TODO: find out when we do this web3.currentProvider.sendAsync
      const sig = sigUtil.personalSign(pkeyBuffer, {data: message})
      const recovered = sigUtil.recoverPersonalSignature({data: message, sig: sig})
      assert.equal(signAddress, recovered, 'Recovered address should be same as signAddress')
    })

    it('Should recover signer typed data with  eth-sig-util', async () => {
      const typedData = {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' }
          ],
          Person: [
            { name: 'name', type: 'string' },
            { name: 'wallet', type: 'address' }
          ],
          Mail: [
            { name: 'from', type: 'Person' },
            { name: 'to', type: 'Person' },
            { name: 'contents', type: 'string' }
          ]
        },
        primaryType: 'Person',
        domain: {
          name: 'Person chat',
          version: '1',
          chainId: 1
        },
        message: {
          name: 'Testing',
          wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
        }
      }

      /*
        const hash = sigUtil.typedSignatureHash(msgParams)
        console.log(`hash=${hash}`)
  `   */
      const signAddress = owner
      const keyOnly = PRIVATE_KEYS[signAddress]
      const pkeyBuffer = Buffer.from(keyOnly, 'hex')
      const sig = sigUtil.signTypedData(pkeyBuffer, {data: typedData})
      const recovered = sigUtil.recoverTypedSignature({data: typedData, sig: sig})
      assert.equal(signAddress, recovered, 'Recovered address should be same as signAddress')
    })
  })

  describe('Platform Tests', function () {
    it('should create an intent', async () => {
      const catSubcat = `${bir.category.name}:${bir.category.subCategory.name}`
      let actions = bir.actions.map(action => action.actionType)
      let costs = bir.actions.map(action => ether(action.cost))
      let status = await platform.createBIR(bir.id, buyer, catSubcat)
      // console.log(`Created BIR with txHash = ${status.tx}`)
      await platform.setActionCosts(bir.id, actions, costs)
      const bcBIR = await platform.getBIR(bir.id)
      bcBIR[0].should.be.equal(buyer)
      bcBIR[2].should.be.equal(catSubcat)
    })

    it('Should register two seller bids for the intent using action type strings, verify signatures and  confirm that bid pulse deducted matches escrow balance', async () => {
      const bids = [{seller: seller1, actionType: 'CPO'},
        {seller: seller2, actionType: 'CPC'}]
      let bidTotal = new BigNumber(0)
      await Promise.all(bids.map(async bid => {
        const message = `${bir.id}:${bid.actionType}`
        const sig = web3.eth.sign(bid.seller, web3.sha3(message))
        const hash = hashMessage(message)
        // console.log(`Seller ${bid.seller} Signature ${sig} and hash ${hash}`)
        await token.approve(platform.address, 100 * multiplier, {from: bid.seller})
        let before = await token.balanceOf(bid.seller)
        let status = await platform.sendBid(bir.id, bid.seller, bid.actionType, hash, sig, {from: platformContractOwner})
        // console.log(`Seller ${bid.seller} bid recorded with txHash = ${status.tx}`)
        let after = await token.balanceOf(bid.seller)
        bidTotal = bidTotal.plus(before.minus(after))
      }))
      const escrowBalance = await platform.getEscrowBalance(bir.id)
      escrowBalance.should.be.bignumber.equal(bidTotal)
    })
  })
})
