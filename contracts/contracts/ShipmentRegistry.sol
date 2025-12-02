// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ShipmentRegistry
 * @author ChainTrack
 * @notice Blockchain-based shipment tracking for P2P deliveries
 * @dev Simplified version optimized for gas efficiency
 */
contract ShipmentRegistry is Ownable, ReentrancyGuard {
    
    // ============ Enums ============
    
    enum ShipmentStatus { 
        Created,      // 0: Shipment registered
        PickedUp,     // 1: Picked up by courier
        InTransit,    // 2: In transit (at checkpoint)
        OutForDelivery, // 3: Out for final delivery
        Delivered,    // 4: Delivered to recipient
        Confirmed     // 5: Delivery confirmed with proof
    }

    // ============ Structs ============
    
    struct Shipment {
        bytes32 shipmentHash;    // Hash of shipment details
        address sender;          // Address that registered
        string origin;           // Origin location
        string destination;      // Destination location
        uint256 createdAt;       // Creation timestamp
        ShipmentStatus status;   // Current status
        uint256 checkpointCount; // Number of checkpoints
        bool exists;             // Existence flag
    }
    
    struct Checkpoint {
        address handler;         // Wallet that recorded
        string handlerName;      // Name of handler
        string action;           // Action type
        string location;         // Location
        string ipfsHash;         // IPFS hash of proof
        uint256 timestamp;       // Timestamp
    }
    
    struct DeliveryProof {
        string receiverName;     // Name of receiver
        string photoIpfsHash;    // IPFS hash of photo
        string signatureIpfsHash; // IPFS hash of signature
        uint256 confirmedAt;     // Confirmation timestamp
        bool exists;             // Existence flag
    }

    // ============ State Variables ============
    
    mapping(bytes32 => Shipment) public shipments;
    mapping(bytes32 => Checkpoint[]) public checkpoints;
    mapping(bytes32 => DeliveryProof) public deliveryProofs;
    
    uint256 public totalShipments;
    uint256 public totalDeliveries;

    // ============ Events ============
    
    event ShipmentRegistered(
        bytes32 indexed idHash,
        address indexed sender,
        uint256 timestamp
    );
    
    event CheckpointRecorded(
        bytes32 indexed idHash,
        address indexed handler,
        uint256 timestamp
    );
    
    event DeliveryConfirmed(
        bytes32 indexed idHash,
        uint256 timestamp
    );
    
    event StatusUpdated(
        bytes32 indexed idHash,
        ShipmentStatus newStatus,
        uint256 timestamp
    );

    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {}

    // ============ Modifiers ============
    
    modifier shipmentExists(string calldata trackingId) {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        require(shipments[idHash].exists, "Shipment not found");
        _;
    }

    // ============ External Functions ============
    
    /**
     * @notice Register a new shipment on the blockchain
     * @param trackingId Unique tracking ID (e.g., SHP-XXXXX)
     * @param shipmentHash Hash of shipment details
     * @param origin Origin location
     * @param destination Destination location
     */
    function registerShipment(
        string calldata trackingId,
        bytes32 shipmentHash,
        string calldata origin,
        string calldata destination
    ) external nonReentrant {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        require(!shipments[idHash].exists, "Shipment already registered");
        
        shipments[idHash] = Shipment({
            shipmentHash: shipmentHash,
            sender: msg.sender,
            origin: origin,
            destination: destination,
            createdAt: block.timestamp,
            status: ShipmentStatus.Created,
            checkpointCount: 0,
            exists: true
        });
        
        totalShipments++;
        
        emit ShipmentRegistered(idHash, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Record a checkpoint during shipment journey
     * @param trackingId Shipment tracking ID
     * @param action Action type (picked_up, checkpoint, etc.)
     * @param handlerName Name of handler
     * @param location Current location
     * @param ipfsHash IPFS hash of proof photo
     */
    function recordCheckpoint(
        string calldata trackingId,
        string calldata action,
        string calldata handlerName,
        string calldata location,
        string calldata ipfsHash
    ) external shipmentExists(trackingId) nonReentrant {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        Shipment storage shipment = shipments[idHash];
        
        checkpoints[idHash].push(Checkpoint({
            handler: msg.sender,
            handlerName: handlerName,
            action: action,
            location: location,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp
        }));
        
        shipment.checkpointCount++;
        
        // Update status based on action
        ShipmentStatus oldStatus = shipment.status;
        ShipmentStatus newStatus = _getStatusFromAction(action);
        
        if (newStatus != oldStatus && uint8(newStatus) > uint8(oldStatus)) {
            shipment.status = newStatus;
            emit StatusUpdated(idHash, newStatus, block.timestamp);
        }
        
        emit CheckpointRecorded(idHash, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Confirm delivery with proof
     * @param trackingId Shipment tracking ID
     * @param receiverName Name of receiver
     * @param photoIpfsHash IPFS hash of delivery photo
     * @param signatureIpfsHash IPFS hash of signature
     */
    function confirmDelivery(
        string calldata trackingId,
        string calldata receiverName,
        string calldata photoIpfsHash,
        string calldata signatureIpfsHash
    ) external shipmentExists(trackingId) nonReentrant {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        Shipment storage shipment = shipments[idHash];
        
        require(!deliveryProofs[idHash].exists, "Already confirmed");
        require(
            shipment.status == ShipmentStatus.Delivered || 
            shipment.status == ShipmentStatus.OutForDelivery ||
            shipment.status == ShipmentStatus.InTransit,
            "Invalid status for confirmation"
        );
        
        deliveryProofs[idHash] = DeliveryProof({
            receiverName: receiverName,
            photoIpfsHash: photoIpfsHash,
            signatureIpfsHash: signatureIpfsHash,
            confirmedAt: block.timestamp,
            exists: true
        });
        
        shipment.status = ShipmentStatus.Confirmed;
        
        totalDeliveries++;
        
        emit DeliveryConfirmed(idHash, block.timestamp);
        emit StatusUpdated(idHash, ShipmentStatus.Confirmed, block.timestamp);
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
            string memory origin,
            string memory destination,
            uint256 createdAt,
            ShipmentStatus status,
            uint256 checkpointCount
        ) 
    {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        Shipment storage s = shipments[idHash];
        require(s.exists, "Shipment not found");
        
        return (
            s.shipmentHash,
            s.sender,
            s.origin,
            s.destination,
            s.createdAt,
            s.status,
            s.checkpointCount
        );
    }
    
    /**
     * @notice Get checkpoint at index
     * @param trackingId Shipment tracking ID
     * @param index Checkpoint index
     */
    function getCheckpoint(string calldata trackingId, uint256 index)
        external
        view
        returns (
            address handler,
            string memory handlerName,
            string memory action,
            string memory location,
            string memory ipfsHash,
            uint256 timestamp
        )
    {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        require(index < checkpoints[idHash].length, "Index out of bounds");
        
        Checkpoint storage c = checkpoints[idHash][index];
        return (
            c.handler,
            c.handlerName,
            c.action,
            c.location,
            c.ipfsHash,
            c.timestamp
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
            string memory receiverName,
            string memory photoIpfsHash,
            string memory signatureIpfsHash,
            uint256 confirmedAt
        )
    {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        DeliveryProof storage p = deliveryProofs[idHash];
        require(p.exists, "No delivery proof");
        
        return (
            p.receiverName,
            p.photoIpfsHash,
            p.signatureIpfsHash,
            p.confirmedAt
        );
    }
    
    /**
     * @notice Get checkpoint count for shipment
     * @param trackingId Shipment tracking ID
     */
    function getCheckpointCount(string calldata trackingId)
        external
        view
        returns (uint256)
    {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        return checkpoints[idHash].length;
    }
    
    /**
     * @notice Check if shipment exists
     * @param trackingId Shipment tracking ID
     */
    function shipmentExistsCheck(string calldata trackingId)
        external
        view
        returns (bool)
    {
        bytes32 idHash = keccak256(abi.encodePacked(trackingId));
        return shipments[idHash].exists;
    }

    // ============ Internal Functions ============
    
    /**
     * @notice Convert action string to status
     */
    function _getStatusFromAction(string calldata action)
        internal
        pure
        returns (ShipmentStatus)
    {
        bytes32 actionHash = keccak256(abi.encodePacked(action));
        
        if (actionHash == keccak256("picked_up")) {
            return ShipmentStatus.PickedUp;
        } else if (actionHash == keccak256("checkpoint") || actionHash == keccak256("handed_off")) {
            return ShipmentStatus.InTransit;
        } else if (actionHash == keccak256("out_for_delivery")) {
            return ShipmentStatus.OutForDelivery;
        } else if (actionHash == keccak256("delivered")) {
            return ShipmentStatus.Delivered;
        }
        
        return ShipmentStatus.Created;
    }
}
