pragma solidity ^0.4.23;

import "./Escrow.sol";

contract TestIntent {
    
    enum BIRState {Created, Responded,  Settled}
    mapping(address => mapping (bytes12 => BIR)) buyerBIRs;
    mapping (bytes12 => BIR) birs;
    mapping (bytes12 => address) birEscrow;
    event NewBIR(bytes12 _id, address _buyer, bytes32 _catSubCat, address _escrow);

    struct Bid {
        address bidder; // could be seller or expert
        bytes4 actionType; // CPO, CPA, CPC etc should this be a enum?
        string conversation; // IPFS stored 24 byte hash of conversation related to this bid
        //List of Actions taken by the buyer (open, conversation, appointment, etc.) under each matched seller for the specific birID.
        mapping (bytes4 => bool) buyerActions;

        /*
         Bid payment transaction. only populated for the seller. We may not need to store it here
         if we send the BIR id along with the payment to the escrow
        */
        bytes32 paymentTx; // TODO: populate
        bytes32 settlementTx;
    }

    struct BIR {
        bytes12 id;
        address buyer;
        BIRState state;
        bytes32 catSubCat;
        mapping (address => Bid) sellers;

    }
    
    
    function createBIR(bytes12 _id, address _buyer, bytes32 _catSubCat ) external returns (bool success){

        BIR memory bir = BIR({id: _id, buyer: _buyer, state: BIRState.Created, catSubCat: _catSubCat});

        birs[_id] = bir;
        buyerBIRs[_buyer][_id] = bir;

        birEscrow[_id] = address(new Escrow(_id, _buyer));
        emit NewBIR(_id,_buyer, _catSubCat, birEscrow[_id]);
        return true;
    }
  
}