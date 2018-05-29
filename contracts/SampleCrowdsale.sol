pragma solidity ^0.4.23;

import './SampleToken.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/CappedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/validation/TimedCrowdsale.sol';
import 'openzeppelin-solidity/contracts/crowdsale/distribution/RefundableCrowdsale.sol';


contract SampleCrowdsale is CappedCrowdsale, RefundableCrowdsale {

    function SampleCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, uint256 _goal, uint256 _cap, MintableToken _token) CappedCrowdsale(_cap) FinalizableCrowdsale()
        RefundableCrowdsale(_goal) TimedCrowdsale(_startTime, _endTime) Crowdsale(_rate, _wallet,_token) public {
        require(_goal <= _cap);
    }



}
