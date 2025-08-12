// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title OnchainScoreRegistry
 * @dev Registry for anchoring credit score Merkle roots with indexer signature verification
 * @notice Allows authorized indexers to submit score anchors with cryptographic proof
 */
contract OnchainScoreRegistry is Ownable {
    using ECDSA for bytes32;

    // Events
    event ScoreAnchored(
        address indexed user,
        bytes32 indexed merkleRoot,
        address indexed indexer,
        uint256 timestamp
    );
    
    event IndexerAuthorized(address indexed indexer, bool authorized);
    event MaxAnchorAgeUpdated(uint256 oldAge, uint256 newAge);

    // State variables
    mapping(address => bool) public authorizedIndexers;
    mapping(address => bytes32) public latestAnchors;
    mapping(address => uint256) public anchorTimestamps;
    
    uint256 public maxAnchorAge = 1 days; // Anchors must be recent
    uint256 public constant MAX_ANCHOR_AGE = 7 days; // Maximum allowed age

    // Modifiers
    modifier onlyAuthorizedIndexer() {
        require(authorizedIndexers[msg.sender], "OnchainScoreRegistry: unauthorized indexer");
        _;
    }

    modifier validTimestamp(uint256 timestamp) {
        require(timestamp <= block.timestamp, "OnchainScoreRegistry: future timestamp");
        require(timestamp >= block.timestamp - maxAnchorAge, "OnchainScoreRegistry: anchor too old");
        _;
    }

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Submit a credit score anchor with indexer signature
     * @param user Address of the user whose score is being anchored
     * @param merkleRoot Merkle root of the score data
     * @param timestamp When the score was computed
     * @param indexerSig Signature from authorized indexer
     */
    function submitScore(
        address user,
        bytes32 merkleRoot,
        uint256 timestamp,
        bytes calldata indexerSig
    ) external validTimestamp(timestamp) {
        require(user != address(0), "OnchainScoreRegistry: invalid user");
        require(merkleRoot != bytes32(0), "OnchainScoreRegistry: invalid merkle root");

        // Verify signature if not called by authorized indexer directly
        if (!authorizedIndexers[msg.sender]) {
            _verifyIndexerSignature(user, merkleRoot, timestamp, indexerSig);
        }

        // Update state
        latestAnchors[user] = merkleRoot;
        anchorTimestamps[user] = timestamp;

        emit ScoreAnchored(user, merkleRoot, msg.sender, timestamp);
    }

    /**
     * @dev Submit score anchor directly by authorized indexer
     * @param user Address of the user whose score is being anchored
     * @param merkleRoot Merkle root of the score data
     * @param timestamp When the score was computed
     */
    function submitScoreDirect(
        address user,
        bytes32 merkleRoot,
        uint256 timestamp
    ) external onlyAuthorizedIndexer validTimestamp(timestamp) {
        require(user != address(0), "OnchainScoreRegistry: invalid user");
        require(merkleRoot != bytes32(0), "OnchainScoreRegistry: invalid merkle root");

        // Update state
        latestAnchors[user] = merkleRoot;
        anchorTimestamps[user] = timestamp;

        emit ScoreAnchored(user, merkleRoot, msg.sender, timestamp);
    }

    /**
     * @dev Get the latest anchor for a user
     * @param user Address of the user
     * @return merkleRoot The Merkle root of the latest score
     * @return timestamp When the score was anchored
     */
    function getLatestAnchor(address user) external view returns (bytes32 merkleRoot, uint256 timestamp) {
        return (latestAnchors[user], anchorTimestamps[user]);
    }

    /**
     * @dev Check if a user has a recent anchor
     * @param user Address of the user
     * @return hasRecent True if user has anchor within maxAnchorAge
     */
    function hasRecentAnchor(address user) external view returns (bool) {
        uint256 timestamp = anchorTimestamps[user];
        return timestamp > 0 && timestamp >= block.timestamp - maxAnchorAge;
    }

    /**
     * @dev Verify indexer signature over score data
     * @param user Address of the user
     * @param merkleRoot Merkle root of the score data
     * @param timestamp When the score was computed
     * @param signature Signature from authorized indexer
     */
    function _verifyIndexerSignature(
        address user,
        bytes32 merkleRoot,
        uint256 timestamp,
        bytes calldata signature
    ) internal view {
        bytes32 messageHash = keccak256(abi.encodePacked(user, merkleRoot, timestamp));
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        
        address signer = ethSignedMessageHash.recover(signature);
        require(authorizedIndexers[signer], "OnchainScoreRegistry: invalid signature");
    }

    // Admin functions
    function authorizeIndexer(address indexer, bool authorized) external onlyOwner {
        require(indexer != address(0), "OnchainScoreRegistry: invalid indexer");
        authorizedIndexers[indexer] = authorized;
        emit IndexerAuthorized(indexer, authorized);
    }

    function setMaxAnchorAge(uint256 newMaxAge) external onlyOwner {
        require(newMaxAge <= MAX_ANCHOR_AGE, "OnchainScoreRegistry: age too high");
        uint256 oldAge = maxAnchorAge;
        maxAnchorAge = newMaxAge;
        emit MaxAnchorAgeUpdated(oldAge, newMaxAge);
    }

    function batchAuthorizeIndexers(address[] calldata indexers, bool[] calldata authorized) external onlyOwner {
        require(indexers.length == authorized.length, "OnchainScoreRegistry: length mismatch");
        for (uint256 i = 0; i < indexers.length; i++) {
            require(indexers[i] != address(0), "OnchainScoreRegistry: invalid indexer");
            authorizedIndexers[indexers[i]] = authorized[i];
            emit IndexerAuthorized(indexers[i], authorized[i]);
        }
    }
}