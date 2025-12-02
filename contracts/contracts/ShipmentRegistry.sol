// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ShipmentRegistry
 * @dev Smart contract for recording shipment checkpoints on the blockchain
 * @author ChainTrack Team
 * 
 * This contract provides immutable record-keeping for P2P deliveries,
 * creating a tamper-proof audit trail of shipment movements.
 */
contract ShipmentRegistry is Ownable, ReentrancyGuard {
    
    // ============ Enums ============
    
    enum ShipmentStatus {
        Created,
        PickedUp,
        InTransit,
        OutForDelivery,
        Delivered,
        Confirmed,
        Cancelled
    }
    
    enum CheckpointAction {
        Created,
        PickedUp,
        Checkpoint,
        HandedOff,
        OutForDelivery,
        Delivered,
        Confirmed
    }
    
    // ============ Structs ============
    
    struct Shipment {
        bytes32 shipmentHash;       // Hash of shipment data (tracking_id + details)
        address sender;             // Address that created the shipment
        string trackingId;          // Off-chain tracking ID (e.g., SHP-ABC123)
        ShipmentStatus status;      // Current status
        uint256 createdAt;          // Creation timestamp
        uint256 checkpointCount;    // Number of checkpoints
        bool exists;                // Existence flag
    }
    
    struct Checkpoint {
        bytes32 checkpointHash;     // Hash of checkpoint data
        CheckpointAction action;    // Type of checkpoint
        address handler;            // Address recording the checkpoint
        string handlerName;         // Name of handler (for anonymous couriers)
        string location;            // Location string
        string ipfsHash;            // IPFS hash of photo proof (if any)
        uint256 timestamp;          // Checkpoint timestamp
        bytes32 previousHash;       // Hash of previous checkpoint (chain integrity)
    }
    
    struct DeliveryProof {
        bytes32 proofHash;          // Hash of delivery proof data
        string receiverName;        // Name of person who received
        string photoIpfsHash;       // IPFS hash of delivery photo
        string signatureIpfsHash;   // IPFS hash of signature image
        uint256 confirmedAt;        // Confirmation timestamp
        bool exists;                // Existence flag
    }
    
    // ============ State Variables ============
    
    // Mapping from tracking ID hash to Shipment
    mapping(bytes32 => Shipment) public shipments;
    
    // Mapping from tracking ID hash to array of checkpoints
    mapping(bytes32 => Checkpoint[]) public shipmentCheckpoints;
    
    // Mapping from tracking ID hash to delivery proof
    mapping(bytes32 => DeliveryProof) public deliveryProofs;
    
    // Mapping of authorized senders
    mapping(address => bool) public authorizedSenders;
    
    // Statistics
    uint256 public totalShipments;
    uint256 public totalCheckpoints;
    uint256 public totalDeliveries;
    
    // ============ Events ============
    
    event ShipmentCreated(
        bytes32 indexed trackingIdHash,
        string trackingId,
        bytes32 shipmentHash,
        address indexed sender,
        uint256 timestamp
    );
    
    event CheckpointRecorded(
        bytes32 indexed trackingIdHash,
        string trackingId,
        CheckpointAction action,
        address indexed handler,
        string location,
        string ipfsHash,
        uint256 timestamp
    );
    
    event DeliveryConfirmed(
        bytes32 indexed trackingIdHash,
        string trackingId,
        string receiverName,
        string photoIpfsHash,
        uint256 timestamp
    );
    
    event StatusUpdated(
        bytes32 indexed trackingIdHash,
        ShipmentStatus oldStatus,
        ShipmentStatus newStatus,
        uint256 timestamp
    );
    
    event SenderAuthorized(address indexed sender);
    event SenderRevoked(address indexed sender);
    
    // ============ Modifiers ============
    
    modifier onlyAuthorizedSender() {
        require(
            authorizedSenders[msg.sender] || msg.sender == owner(),
            "Not an authorized sender"
        );
        _;
    }
    
    modifier shipmentExists(string memory trackingId) {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        require(shipments[idHash].exists, "Shipment not found");
        _;
    }
    
    modifier shipmentNotExists(string memory trackingId) {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        require(!shipments[idHash].exists, "Shipment already exists");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        authorizedSenders[msg.sender] = true;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Authorize an address to create shipments
     * @param sender Address to authorize
     */
    function authorizeSender(address sender) external onlyOwner {
        authorizedSenders[sender] = true;
        emit SenderAuthorized(sender);
    }
    
    /**
     * @notice Revoke sender authorization
     * @param sender Address to revoke
     */
    function revokeSender(address sender) external onlyOwner {
        authorizedSenders[sender] = false;
        emit SenderRevoked(sender);
    }
    
    /**
     * @notice Create a new shipment record on-chain
     * @param trackingId Off-chain tracking ID (e.g., SHP-ABC123)
     * @param shipmentDataHash Hash of shipment details (description, addresses, etc.)
     */
    function createShipment(
        string calldata trackingId,
        bytes32 shipmentDataHash
    ) external onlyAuthorizedSender shipmentNotExists(trackingId) nonReentrant {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        
        shipments[idHash] = Shipment({
            shipmentHash: shipmentDataHash,
            sender: msg.sender,
            trackingId: trackingId,
            status: ShipmentStatus.Created,
            createdAt: block.timestamp,
            checkpointCount: 0,
            exists: true
        });
        
        totalShipments++;
        
        // Record creation as first checkpoint
        _recordCheckpoint(
            idHash,
            trackingId,
            CheckpointAction.Created,
            msg.sender,
            "",
            "Origin",
            ""
        );
        
        emit ShipmentCreated(
            idHash,
            trackingId,
            shipmentDataHash,
            msg.sender,
            block.timestamp
        );
    }
    
    /**
     * @notice Record a checkpoint for a shipment
     * @param trackingId Shipment tracking ID
     * @param action Type of checkpoint action
     * @param handlerName Name of the handler (for display)
     * @param location Location description
     * @param ipfsHash IPFS hash of checkpoint photo (optional)
     */
    function recordCheckpoint(
        string calldata trackingId,
        CheckpointAction action,
        string calldata handlerName,
        string calldata location,
        string calldata ipfsHash
    ) external shipmentExists(trackingId) nonReentrant {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        Shipment storage shipment = shipments[idHash];
        
        // Validate action based on current status
        require(_isValidTransition(shipment.status, action), "Invalid status transition");
        
        // Record checkpoint
        _recordCheckpoint(
            idHash,
            trackingId,
            action,
            msg.sender,
            handlerName,
            location,
            ipfsHash
        );
        
        // Update shipment status
        ShipmentStatus oldStatus = shipment.status;
        ShipmentStatus newStatus = _getNewStatus(action);
        
        if (newStatus != oldStatus) {
            shipment.status = newStatus;
            emit StatusUpdated(idHash, oldStatus, newStatus, block.timestamp);
        }
    }
    
    /**
     * @notice Confirm delivery with proof
     * @param trackingId Shipment tracking ID
     * @param receiverName Name of person who received
     * @param photoIpfsHash IPFS hash of delivery photo
     * @param signatureIpfsHash IPFS hash of signature image (optional)
     */
    function confirmDelivery(
        string calldata trackingId,
        string calldata receiverName,
        string calldata photoIpfsHash,
        string calldata signatureIpfsHash
    ) external shipmentExists(trackingId) nonReentrant {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        Shipment storage shipment = shipments[idHash];
        
        require(
            shipment.status == ShipmentStatus.Delivered || 
            shipment.status == ShipmentStatus.OutForDelivery,
            "Shipment not ready for confirmation"
        );
        require(!deliveryProofs[idHash].exists, "Already confirmed");
        require(bytes(photoIpfsHash).length > 0, "Photo proof required");
        
        // Create proof hash
        bytes32 proofHash = keccak256(abi.encodePacked(
            trackingId,
            receiverName,
            photoIpfsHash,
            signatureIpfsHash,
            block.timestamp
        ));
        
        deliveryProofs[idHash] = DeliveryProof({
            proofHash: proofHash,
            receiverName: receiverName,
            photoIpfsHash: photoIpfsHash,
            signatureIpfsHash: signatureIpfsHash,
            confirmedAt: block.timestamp,
            exists: true
        });
        
        // Update status
        ShipmentStatus oldStatus = shipment.status;
        shipment.status = ShipmentStatus.Confirmed;
        
        // Record confirmation checkpoint
        _recordCheckpoint(
            idHash,
            trackingId,
            CheckpointAction.Confirmed,
            msg.sender,
            receiverName,
            "Destination",
            photoIpfsHash
        );
        
        totalDeliveries++;
        
        emit DeliveryConfirmed(
            idHash,
            trackingId,
            receiverName,
            photoIpfsHash,
            block.timestamp
        );
        
        emit StatusUpdated(idHash, oldStatus, ShipmentStatus.Confirmed, block.timestamp);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get shipment details
     * @param trackingId Shipment tracking ID
     */
    function getShipment(string calldata trackingId) 
        external 
        view 
        returns (
            bytes32 shipmentHash,
            address sender,
            ShipmentStatus status,
            uint256 createdAt,
            uint256 checkpointCount,
            bool exists
        ) 
    {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        Shipment storage shipment = shipments[idHash];
        
        return (
            shipment.shipmentHash,
            shipment.sender,
            shipment.status,
            shipment.createdAt,
            shipment.checkpointCount,
            shipment.exists
        );
    }
    
    /**
     * @notice Get number of checkpoints for a shipment
     * @param trackingId Shipment tracking ID
     */
    function getCheckpointCount(string calldata trackingId) 
        external 
        view 
        returns (uint256) 
    {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        return shipmentCheckpoints[idHash].length;
    }
    
    /**
     * @notice Get a specific checkpoint
     * @param trackingId Shipment tracking ID
     * @param index Checkpoint index
     */
    function getCheckpoint(string calldata trackingId, uint256 index)
        external
        view
        returns (
            bytes32 checkpointHash,
            CheckpointAction action,
            address handler,
            string memory handlerName,
            string memory location,
            string memory ipfsHash,
            uint256 timestamp
        )
    {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        require(index < shipmentCheckpoints[idHash].length, "Index out of bounds");
        
        Checkpoint storage cp = shipmentCheckpoints[idHash][index];
        
        return (
            cp.checkpointHash,
            cp.action,
            cp.handler,
            cp.handlerName,
            cp.location,
            cp.ipfsHash,
            cp.timestamp
        );
    }
    
    /**
     * @notice Get delivery proof
     * @param trackingId Shipment tracking ID
     */
    function getDeliveryProof(string calldata trackingId)
        external
        view
        returns (
            bytes32 proofHash,
            string memory receiverName,
            string memory photoIpfsHash,
            string memory signatureIpfsHash,
            uint256 confirmedAt,
            bool exists
        )
    {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        DeliveryProof storage proof = deliveryProofs[idHash];
        
        return (
            proof.proofHash,
            proof.receiverName,
            proof.photoIpfsHash,
            proof.signatureIpfsHash,
            proof.confirmedAt,
            proof.exists
        );
    }
    
    /**
     * @notice Verify checkpoint chain integrity
     * @param trackingId Shipment tracking ID
     */
    function verifyCheckpointChain(string calldata trackingId)
        external
        view
        returns (bool isValid, uint256 lastValidIndex)
    {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        Checkpoint[] storage checkpoints = shipmentCheckpoints[idHash];
        
        if (checkpoints.length == 0) {
            return (true, 0);
        }
        
        // First checkpoint should have zero previous hash
        if (checkpoints[0].previousHash != bytes32(0)) {
            return (false, 0);
        }
        
        // Verify chain
        for (uint256 i = 1; i < checkpoints.length; i++) {
            bytes32 expectedPrevHash = checkpoints[i - 1].checkpointHash;
            if (checkpoints[i].previousHash != expectedPrevHash) {
                return (false, i - 1);
            }
        }
        
        return (true, checkpoints.length - 1);
    }
    
    // ============ Internal Functions ============
    
    function _recordCheckpoint(
        bytes32 idHash,
        string memory trackingId,
        CheckpointAction action,
        address handler,
        string memory handlerName,
        string memory location,
        string memory ipfsHash
    ) internal {
        Checkpoint[] storage checkpoints = shipmentCheckpoints[idHash];
        
        // Get previous hash for chain integrity
        bytes32 previousHash = bytes32(0);
        if (checkpoints.length > 0) {
            previousHash = checkpoints[checkpoints.length - 1].checkpointHash;
        }
        
        // Create checkpoint hash
        bytes32 checkpointHash = keccak256(abi.encodePacked(
            trackingId,
            action,
            handler,
            handlerName,
            location,
            ipfsHash,
            block.timestamp,
            previousHash
        ));
        
        checkpoints.push(Checkpoint({
            checkpointHash: checkpointHash,
            action: action,
            handler: handler,
            handlerName: handlerName,
            location: location,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            previousHash: previousHash
        }));
        
        shipments[idHash].checkpointCount++;
        totalCheckpoints++;
        
        emit CheckpointRecorded(
            idHash,
            trackingId,
            action,
            handler,
            location,
            ipfsHash,
            block.timestamp
        );
    }
    
    function _isValidTransition(ShipmentStatus currentStatus, CheckpointAction action) 
        internal 
        pure 
        returns (bool) 
    {
        // Created -> PickedUp
        if (currentStatus == ShipmentStatus.Created && action == CheckpointAction.PickedUp) {
            return true;
        }
        
        // PickedUp -> Checkpoint, HandedOff, OutForDelivery
        if (currentStatus == ShipmentStatus.PickedUp) {
            return action == CheckpointAction.Checkpoint || 
                   action == CheckpointAction.HandedOff ||
                   action == CheckpointAction.OutForDelivery ||
                   action == CheckpointAction.Delivered;
        }
        
        // InTransit -> Checkpoint, HandedOff, OutForDelivery, Delivered
        if (currentStatus == ShipmentStatus.InTransit) {
            return action == CheckpointAction.Checkpoint ||
                   action == CheckpointAction.HandedOff ||
                   action == CheckpointAction.OutForDelivery ||
                   action == CheckpointAction.Delivered;
        }
        
        // OutForDelivery -> Delivered
        if (currentStatus == ShipmentStatus.OutForDelivery) {
            return action == CheckpointAction.Delivered ||
                   action == CheckpointAction.Checkpoint;
        }
        
        // Delivered -> Confirmed (handled separately)
        if (currentStatus == ShipmentStatus.Delivered) {
            return action == CheckpointAction.Confirmed;
        }
        
        return false;
    }
    
    function _getNewStatus(CheckpointAction action) internal pure returns (ShipmentStatus) {
        if (action == CheckpointAction.PickedUp) return ShipmentStatus.PickedUp;
        if (action == CheckpointAction.Checkpoint) return ShipmentStatus.InTransit;
        if (action == CheckpointAction.HandedOff) return ShipmentStatus.InTransit;
        if (action == CheckpointAction.OutForDelivery) return ShipmentStatus.OutForDelivery;
        if (action == CheckpointAction.Delivered) return ShipmentStatus.Delivered;
        if (action == CheckpointAction.Confirmed) return ShipmentStatus.Confirmed;
        return ShipmentStatus.Created;
    }
}
