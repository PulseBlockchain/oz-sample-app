pragma solidity ^0.4.24;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol';
import './ECRecovery.sol';
import './TestEscrow.sol';

contract TestPlatform is Ownable {

    ERC20 public testToken;


    constructor(ERC20 _testToken) Ownable() public {
        testToken = _testToken;
    }

    event DebugEvent(string _message, uint256 _value);
    event DebugEventAddress(string _message, address _sender);


    enum BIRState {Created, Responded,  Settled}
    mapping(address => mapping (bytes12 => BIR)) buyerBIRs;
    mapping (bytes12 => BIR) birs;
    mapping (bytes12 => address) birEscrow;
    event NewBIR(bytes12 _id, address _buyer, string _catSubCat, address _escrow);


    struct BIR {
        bytes12 id;
        address buyer;
        BIRState state;
        string catSubCat;
        // action costs
        mapping (bytes4 => uint256) actionCosts;
        mapping (address => Bid) sellers;
    }

    struct Bid {
        address bidder; // could be seller or expert
        bytes4 actionType; // CPO, CPA, CPC etc should this be a enum?

        //List of Actions taken by the buyer (open, conversation, appointment, etc.) under each matched seller for the specific birID.
        mapping (bytes4 => bool) buyerActions;

        /*
         Bid payment transaction. only populated for the seller. We may not need to store it here
         if we send the BIR id along with the payment to the escrow
        */
        bytes32 paymentTx; // TODO: populate
        bytes32 settlementTx;
    }

    function createBIR(bytes12 _id, address _buyer, string _catSubCat) external returns (bool success){

        BIR memory bir = BIR({id: _id, buyer: _buyer, state: BIRState.Created, catSubCat: _catSubCat});
        birs[_id] = bir;
        buyerBIRs[_buyer][_id] = bir;
        birEscrow[_id] = address(new TestEscrow(_id, _buyer, testToken));
        emit NewBIR(_id,_buyer, _catSubCat, birEscrow[_id]);
        return true;
    }

    function setActionCosts(bytes12 _id, bytes4[] _actions, uint256[] _costs)
    external returns(bool success) {
        require(_actions.length < 10, "Too many actions");
        require(_costs.length < 10, "Too many action costs");

        for (uint i = 0; i < _actions.length; i++) {
            birs[_id].actionCosts[_actions[i]] = _costs[i];
        }

        return true;
    }

    function getBIR(bytes12 _id) view external returns (address, BIRState, string, address, uint) {
        BIR storage bir = birs[_id];
        address escrow = birEscrow[_id];
        return (bir.buyer, bir.state, bir.catSubCat, escrow,  testToken.balanceOf(bir.buyer));
    }


    function sendBid(bytes12 _id, address _bidder, bytes4 _actionType,  bytes32 _bidHash,bytes _signedBidMessage)  external returns (bool success) {
        require(_bidHash.recover(_signedBidMessage) == _bidder, "Bidder Signature check failed");

        uint256  bidCost = birs[_id].actionCosts[_actionType];
        require(testToken.balanceOf(_bidder) > bidCost, "bidder does not have enough pulse");

        address me = address(this);
        uint256 allowance = testToken.allowance(_bidder, me);
        require(allowance > bidCost, "bidder did not provide enough allowance for the bid");
        emit DebugEvent("Sender Sender Allowance is", allowance);

        // create the Bid
        Bid memory sBid = Bid({bidder:_bidder, actionType:_actionType, paymentTx:'0x0', settlementTx:'0x0'});
        birs[_id].sellers[_bidder] = sBid;
        birs[_id].state = BIRState.Responded;

        // first transfer  the bid Pulse from seller to this contract as allowance is for this contract.
        testToken.transferFrom(_bidder, me, bidCost);
        address escrow = birEscrow[_id];

        // now transfer bid pulse to the intent specific escrow
        testToken.transfer(escrow,bidCost);
        return true;
    }

    function getEscrowBalance(bytes12 _id) view external returns (uint256) {
        address escrow = birEscrow[_id];
        return testToken.balanceOf(escrow);
    }

    function settleBIR(bytes12 _id, address [] _payees, uint256[] _payments, uint256 _buyerPayment) public returns (bool success) {
        TestEscrow escrow = TestEscrow(birEscrow[_id]);
        escrow.distributeFunds(_payees, _payments, _buyerPayment);
        return true;
    }

    using ECRecovery for bytes32;
    function recover(bytes32 hash, bytes sig) public pure returns (address) {
        return hash.recover(sig);
    }

}
