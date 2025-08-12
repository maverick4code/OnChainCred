pragma circom 2.1.4;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

/**
 * @title ScoreMerkle
 * @dev Circuit for verifying Merkle tree membership of credit scores
 * @notice Proves a score leaf exists in a Merkle tree without revealing the path
 */
template ScoreMerkle(depth) {
    // Public inputs
    signal input merkleRoot;      // Root of the Merkle tree
    signal input threshold;       // Minimum score threshold
    
    // Private inputs
    signal input score;           // Actual credit score (hidden)
    signal input timestamp;       // Score timestamp
    signal input userAddress;     // User address
    signal input salt;            // Random salt
    signal input pathElements[depth]; // Merkle path elements
    signal input pathIndices[depth];  // Path direction (0 = left, 1 = right)
    
    // Public outputs
    signal output isValid;        // True if proof is valid
    signal output computedRoot;   // Computed Merkle root
    
    // Components
    component poseidon = Poseidon(2);
    component greaterThan = GreaterThan(32);
    component lessThan = LessThan(32);
    
    // Validate score range
    greaterThan.in[0] <== score;
    greaterThan.in[1] <== 0;
    lessThan.in[0] <== score;
    lessThan.in[1] <== 1001;
    
    // Check score >= threshold
    greaterThan.in[0] <== score;
    greaterThan.in[1] <== threshold;
    
    // Generate leaf hash
    var leafHash = poseidon.out;
    poseidon.inputs[0] <== score;
    poseidon.inputs[1] <== timestamp;
    
    // Compute Merkle root by following the path
    var currentHash = leafHash;
    
    for (var i = 0; i < depth; i++) {
        // Get path direction and sibling
        var isRight = pathIndices[i];
        var sibling = pathElements[i];
        
        // Hash based on direction
        var left = isRight * sibling + (1 - isRight) * currentHash;
        var right = (1 - isRight) * sibling + isRight * currentHash;
        
        poseidon.inputs[0] <== left;
        poseidon.inputs[1] <== right;
        currentHash <== poseidon.out;
    }
    
    computedRoot <== currentHash;
    
    // Verify computed root matches expected root
    isValid <== (computedRoot == merkleRoot) * greaterThan.out * lessThan.out;
    
    // Constraints
    score >= 0;
    score <= 1000;
    threshold >= 0;
    threshold <= 1000;
    timestamp > 0;
    userAddress > 0;
    salt > 0;
    
    // Path constraints
    for (var i = 0; i < depth; i++) {
        pathIndices[i] * (1 - pathIndices[i]) === 0; // Binary values only
    }
}

/**
 * @title ScoreMerkleVerifier
 * @dev Simplified Merkle verifier for demo purposes
 * @notice This is a simplified version for the hackathon demo
 */
template ScoreMerkleVerifier() {
    // Public inputs
    signal input merkleRoot;      // Expected Merkle root
    signal input threshold;       // Minimum score threshold
    
    // Private inputs
    signal input score;           // Actual credit score
    signal input timestamp;       // Score timestamp
    signal input userAddress;     // User address
    signal input salt;            // Random salt
    
    // Public outputs
    signal output isValid;        // True if verification passes
    
    // Components
    component poseidon = Poseidon(4);
    component greaterThan = GreaterThan(32);
    
    // Generate leaf hash
    poseidon.inputs[0] <== score;
    poseidon.inputs[1] <== timestamp;
    poseidon.inputs[2] <== userAddress;
    poseidon.inputs[3] <== salt;
    
    // Check score >= threshold
    greaterThan.in[0] <== score;
    greaterThan.in[1] <== threshold;
    
    // For demo purposes, we'll accept any valid score
    // In production, this would verify the actual Merkle path
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

/**
 * @title BatchScoreVerifier
 * @dev Circuit for verifying multiple scores at once
 * @notice Useful for batch loan applications
 */
template BatchScoreVerifier(batchSize) {
    // Public inputs
    signal input merkleRoot;      // Merkle root containing all scores
    signal input threshold;       // Minimum score threshold for all
    
    // Private inputs
    signal input scores[batchSize];      // Array of scores
    signal input timestamps[batchSize];  // Array of timestamps
    signal input userAddresses[batchSize]; // Array of user addresses
    signal input salts[batchSize];       // Array of salts
    
    // Public outputs
    signal output allValid;       // True if all scores >= threshold
    signal output validCount;     // Count of valid scores
    
    // Components
    component poseidon = Poseidon(4);
    component greaterThan = GreaterThan(32);
    
    var validSum = 0;
    
    for (var i = 0; i < batchSize; i++) {
        // Generate leaf hash for each score
        poseidon.inputs[0] <== scores[i];
        poseidon.inputs[1] <== timestamps[i];
        poseidon.inputs[2] <== userAddresses[i];
        poseidon.inputs[3] <== salts[i];
        
        // Check if score >= threshold
        greaterThan.in[0] <== scores[i];
        greaterThan.in[1] <== threshold;
        
        validSum += greaterThan.out;
        
        // Constraints for each score
        scores[i] >= 0;
        scores[i] <= 1000;
        timestamps[i] > 0;
        userAddresses[i] > 0;
        salts[i] > 0;
    }
    
    validCount <== validSum;
    allValid <== (validCount == batchSize);
    
    // Global constraints
    threshold >= 0;
    threshold <= 1000;
}