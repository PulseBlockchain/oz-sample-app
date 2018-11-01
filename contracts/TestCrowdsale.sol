pragma solidity ^0.4.24;
// use this to send structs in and out of solidity functions
pragma experimental ABIEncoderV2;

import './TestToken.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/IndividuallyCappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/emission/MintedCrowdsale.sol';
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";




// VL: 10/28: tests will fail if we make this IndividuallyCappedCrowdsale
//contract TestCrowdsale is CappedCrowdsale, IndividuallyCappedCrowdsale, RefundableCrowdsale, MintedCrowdsale,  Ownable {
contract TestCrowdsale is CappedCrowdsale, RefundableCrowdsale, MintedCrowdsale,  Ownable {


    // ICO Stage
    // ============
    enum CrowdsaleStage { PreICO, ICO }
    CrowdsaleStage public stage = CrowdsaleStage.PreICO; // By default it's Pre Sale

    // Token Distribution
    // =============================
    uint256 public constant convMultiplier = 10 ** 24; // 18 decimals plus 10 ** 6 as we want to reference most values in millions
    uint256 public maxTokens = 3000 * convMultiplier; // There will be total 3B Test Tokens
    uint256 public tokensForGrowth = 750  * convMultiplier; // 25%
    uint256 public tokensForTeam = 660 * convMultiplier; // 22%
    uint256 public tokensForBounty = 3 * convMultiplier; // 1%
    uint256 public totalTokensForSale = 1140 *  convMultiplier; // 1.1B (38%) TEST will be sold in Crowdsale
    uint256 public totalTokensForSaleDuringPreICO = 380 * convMultiplier; // 30% of the 1.1B Crowdsale PULSE will be sold during PreICO
    uint256 public constant preRate = 80000; // pulse per ether during PreICO, reflecting a 50% discount
    uint256 public constant finalRate = 40000; // pulse per ether during ICO
    uint256 public currentRate = 40000; // pulse per ether during ICO
    // ==============================

    // Amount raised in PreICO
    // ==================
    uint256 public totalWeiRaisedDuringPreICO;
    // ===================


    // Events
    event EthTransferred(string text);
    event EthRefunded(string text, uint256 value);

    constructor(
        uint256 _openingTime,
        uint256 _closingTime,
        uint256 _rate,
        address _wallet,
        uint256 _cap,
        ERC20Mintable _token,
        uint256 _goal
    )
    public
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
    TimedCrowdsale(_openingTime, _closingTime)
    RefundableCrowdsale(_goal)
    {
        //As goal needs to be met for a successful crowdsale
        //the value needs to less or equal than a cap which is limit for accepted funds
        currentRate = _rate;
        require(_goal <= _cap);
    }

    // Crowdsale Stage Management
    // =========================================================

    // Change Crowdsale Stage. Available Options: PreICO, ICO
    function setCrowdsaleStage(uint value) public onlyOwner {

        CrowdsaleStage _stage;

        if (uint(CrowdsaleStage.PreICO) == value) {
            _stage = CrowdsaleStage.PreICO;
        } else if (uint(CrowdsaleStage.ICO) == value) {
            _stage = CrowdsaleStage.ICO;
        }

        stage = _stage;

        //1 ETH can buy 5 tokens in PreICO but only 2 during ICO
        if (stage == CrowdsaleStage.PreICO) {
            currentRate = preRate;
        } else if (stage == CrowdsaleStage.ICO) {
            currentRate = finalRate;
        }
    }

    function _getTokenAmount(uint256 weiAmount)
    internal view returns (uint256)
    {
        return currentRate.mul(weiAmount);
    }


    function () external payable {
        uint256 tokensThatWillBeMintedAfterPurchase = msg.value.mul(currentRate);
        if ((stage == CrowdsaleStage.PreICO) && (token().totalSupply() + tokensThatWillBeMintedAfterPurchase > totalTokensForSaleDuringPreICO)) {
            msg.sender.transfer(msg.value); // Refund them
            emit EthRefunded("PreICO Limit Hit", tokensThatWillBeMintedAfterPurchase);
            return;
        }

        buyTokens(msg.sender);

        if (stage == CrowdsaleStage.PreICO) {
            totalWeiRaisedDuringPreICO = totalWeiRaisedDuringPreICO.add(msg.value);
        }
    }

    function _forwardFunds() internal {
        if (stage == CrowdsaleStage.PreICO) {
            wallet().transfer(msg.value);
            emit EthTransferred("forwarding funds to wallet");
        } else if (stage == CrowdsaleStage.ICO) {
            emit EthTransferred("forwarding funds to refundable vault");
            super._forwardFunds();
        }
    }

    // ===========================

    // Finish: Mint Extra Tokens as needed before finalizing the Crowdsale.
    // ====================================================================


    function finish(address _teamFund, address _growthFund, address _bountyFund, address _newTokenOwner) public onlyOwner {

        require(!finalized());
        uint256 alreadyMinted = token().totalSupply();
        require(alreadyMinted < maxTokens);

        uint256 unsoldTokens = totalTokensForSale - alreadyMinted;
        if (unsoldTokens > 0) {
            tokensForGrowth = tokensForGrowth + unsoldTokens;
        }

        TestToken ttoken = TestToken(ERC20(token()));
        ttoken.mint(_teamFund,tokensForTeam);
        ttoken.mint(_growthFund,tokensForGrowth);
        ttoken.mint(_bountyFund,tokensForBounty);
        ttoken.transferOwnership(_newTokenOwner);
        finalize();
    }
    // ===============================

    // REMOVE THIS FUNCTION ONCE YOU ARE READY FOR PRODUCTION
    // USEFUL FOR TESTING `finish()` FUNCTION


    function hasEnded() public view returns (bool) {
        return true;
    }


}
