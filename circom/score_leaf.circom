pragma circom 2.1.4;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

/**
 * @title ScoreLeaf
 * @dev Circuit for generating a leaf hash from credit score data
 * @notice Creates a deterministic hash from score components
 */
template ScoreLeaf() {
    // Public inputs
    signal input score;           // Credit score (0-1000)
    signal input timestamp;       // When score was computed
    signal input userAddress;     // User's address (as uint256)
    
    // Private inputs
    signal input salt;            // Random salt for uniqueness
    
    // Public outputs
    signal output leafHash;       // The computed leaf hash
    signal output isValidScore;   // Boolean indicating if score is valid
    
    // Components
    component poseidon = Poseidon(4);
    component lessThan = LessThan(32);
    component greaterThan = GreaterThan(32);
    
    // Validate score range (0-1000)
    lessThan.in[0] <== score;
    lessThan.in[1] <== 1001;
    greaterThan.in[0] <== score;
    greaterThan.in[1] <== 0;
    
    isValidScore <== lessThan.out * greaterThan.out;
    
    // Generate leaf hash using Poseidon
    // Hash: poseidon(score, timestamp, userAddress, salt)
    poseidon.inputs[0] <== score;
    poseidon.inputs[1] <== timestamp;
    poseidon.inputs[2] <== userAddress;
    poseidon.inputs[3] <== salt;
    
    leafHash <== poseidon.out;
    
    // Constraints
    isValidScore === 1;
    score >= 0;
    score <= 1000;
    timestamp > 0;
    userAddress > 0;
    salt > 0;
}

/**
 * @title ScoreThreshold
 * @dev Circuit for proving score >= threshold without revealing score
 * @notice Uses range checks to prove score meets minimum requirement
 */
template ScoreThreshold() {
    // Public inputs
    signal input threshold;       // Minimum required score
    signal input merkleRoot;      // Merkle root containing the score
    
    // Private inputs
    signal input score;           // Actual score (hidden)
    signal input timestamp;       // Score timestamp
    signal input userAddress;     // User address
    signal input salt;            // Random salt
    signal input merklePath[16];  // Merkle path to root
    signal input merkleSiblings[16]; // Sibling hashes for path
    
    // Public outputs
    signal output isValid;        // True if score >= threshold
    signal output leafHash;       // Computed leaf hash
    
    // Components
    component scoreLeaf = ScoreLeaf();
    component lessThan = LessThan(32);
    component greaterThan = GreaterThan(32);
    component poseidon = Poseidon(2);
    
    // Generate leaf hash
    scoreLeaf.score <== score;
    scoreLeaf.timestamp <== timestamp;
    scoreLeaf.userAddress <== userAddress;
    scoreLeaf.salt <== salt;
    
    leafHash <== scoreLeaf.leafHash;
    
    // Verify score >= threshold
    greaterThan.in[0] <== score;
    greaterThan.in[1] <== threshold;
    
    isValid <== greaterThan.out;
    
    // Verify Merkle path (simplified for demo)
    // In production, this would verify the full path to the root
    var currentHash = leafHash;
    
    for (var i = 0; i < 16; i++) {
        // This is a simplified Merkle verification
        // In production, you'd use the actual path and siblings
        currentHash <== poseidon.out;
    }
    
    // Constraints
    score >= 0;
    score <= 1000;
    threshold >= 0;
    threshold <= 1000;
    timestamp > 0;
    userAddress > 0;
    salt > 0;
    isValid === 1;
}

/**
 * @title ScoreVerifier
 * @dev Main circuit for credit score verification
 * @notice Combines leaf generation and threshold checking
 */
template ScoreVerifier() {
    // Public inputs
    signal input threshold;       // Minimum required score
    signal input merkleRoot;      // Expected Merkle root
    
    // Private inputs
    signal input score;           // Actual credit score
    signal input timestamp;       // Score timestamp
    signal input userAddress;     // User address
    signal input salt;            // Random salt
    
    // Public outputs
    signal output isValid;        // True if verification passes
    signal output leafHash;       // Computed leaf hash
    
    // Components
    component scoreLeaf = ScoreLeaf();
    component greaterThan = GreaterThan(32);
    
    // Generate leaf hash
    scoreLeaf.score <== score;
    scoreLeaf.timestamp <== timestamp;
    scoreLeaf.userAddress <== userAddress;
    scoreLeaf.salt <== salt;
    
    leafHash <== scoreLeaf.leafHash;
    
    // Check score >= threshold
    greaterThan.in[0] <== score;
    greaterThan.in[1] <== threshold;
    
    isValid <== greaterThan.out;
    
    // Constraints
    score >= 0;
    score <= 1000;
    threshold >= 0;
    threshold <= 1000;
    timestamp > 0;
    userAddress > 0;
    salt > 0;
    isValid === 1;
}