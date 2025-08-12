# 🔒 OnChainCred Security Analysis

## 🎯 Overview

This document outlines the security considerations, threat model, and mitigation strategies for the OnChainCred protocol. The system prioritizes privacy preservation while maintaining verifiability and preventing gaming.

## 🚨 Threat Model

### 1. Sybil Attacks
*Threat*: Users creating multiple wallets to artificially inflate scores
*Impact*: Score inflation, unfair lending advantages
*Mitigation*: 
- Attestation requirements from verified issuers
- Stake/bond requirements for score boosts
- Time-weighted scoring with diminishing returns
- Diversity of signal requirements

### 2. Data Manipulation
*Threat*: Indexers or users manipulating on-chain data
*Impact*: Incorrect score computation, unfair advantages
*Mitigation*:
- Deterministic scoring algorithms
- Merkle tree integrity verification
- On-chain anchoring of score roots
- Multi-source data validation

### 3. Replay Attacks
*Threat*: Reusing old proofs or signatures
*Impact*: Score verification bypass, unauthorized access
*Mitigation*:
- Timestamp-based freshness checks
- Nonce-based signature verification
- Expiry windows for anchors
- Block number validation

### 4. Privacy Leakage
*Threat*: ZK proof revealing unintended information
*Impact*: User privacy compromise, deanonymization
*Mitigation*:
- Careful circuit design
- Input sanitization
- Proof verification only
- No raw data exposure

## 🛡 Security Measures

### Smart Contract Security

#### OnchainScoreRegistry
solidity
// Timestamp freshness check
require(timestamp >= block.timestamp - MAX_ANCHOR_AGE, "Anchor too old");

// Signature verification
require(verifyIndexerSignature(user, merkleRoot, timestamp, indexerSig), "Invalid signature");

// Access control
require(msg.sender == indexer || isAuthorizedIndexer(msg.sender), "Unauthorized");


#### ScoreVerifier
solidity
// ZK proof verification
function verifyScoreProof(bytes calldata proof, bytes32 root, uint256 threshold) 
    external view returns (bool) {
    // Verify proof without revealing inputs
    return verifier.verify(proof, [root, threshold]);
}


#### LenderAdapter
solidity
// Score verification
require(scoreVerifier.verifyScoreProof(proof, root, threshold), "Invalid proof");

// Anchor freshness
require(registry.getLatestAnchor(borrower).timestamp >= block.timestamp - MAX_ANCHOR_AGE, "Score stale");


### ZK Circuit Security

#### Input Validation
- Range checks for all numeric inputs
- Bounded arithmetic operations
- Overflow/underflow protection
- Input sanitization

#### Proof Generation
- Deterministic witness generation
- Secure random number generation
- Circuit-specific constraints
- Public input validation

### Indexer Security

#### Data Integrity
- Multi-source event validation
- Canonical event schema
- Event ordering verification
- Duplicate detection

#### Access Control
- Authorized indexer keys
- Rate limiting
- Input validation
- Output sanitization

## 🔐 Anti-Gaming Mechanisms

### 1. Attestation Requirements
typescript
// Require minimum attestations from verified issuers
const minAttestations = 3;
const verifiedIssuers = await getVerifiedIssuers();
const userAttestations = await getUserAttestations(userAddress);

if (userAttestations.filter(a => verifiedIssuers.includes(a.issuer)).length < minAttestations) {
    throw new Error("Insufficient verified attestations");
}


### 2. Stake/Bond Requirements
solidity
// Require minimum stake for score boosts
uint256 public constant MIN_STAKE_FOR_BOOST = 1 ether;
uint256 public constant MIN_STAKE_DURATION = 30 days;

function calculateStakingBonus(address user) public view returns (uint256) {
    UserStake memory stake = userStakes[user];
    if (stake.amount < MIN_STAKE_FOR_BOOST || 
        block.timestamp - stake.startTime < MIN_STAKE_DURATION) {
        return 0;
    }
    // Calculate bonus based on stake amount and duration
}


### 3. Time-Weighted Scoring
typescript
// Recent activity weighted higher than old activity
function calculateTimeWeightedScore(events: Event[]): number {
    const now = Date.now();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    
    return events.reduce((score, event) => {
        const age = now - event.timestamp;
        const timeWeight = Math.max(0, 1 - (age / maxAge));
        return score + (event.score * timeWeight);
    }, 0);
}


### 4. Diversity Requirements
typescript
// Require diverse signal sources
const requiredCategories = ['transactions', 'staking', 'lending', 'attestations'];
const userCategories = new Set(userEvents.map(e => e.category));

if (userCategories.size < requiredCategories.length * 0.75) {
    throw new Error("Insufficient signal diversity");
}


## 🕒 Freshness & Replay Protection

### Timestamp Validation
solidity
// Maximum age for score anchors
uint256 public constant MAX_ANCHOR_AGE = 7 days;

// Check anchor freshness
function isAnchorFresh(bytes32 root) public view returns (bool) {
    (uint256 timestamp,) = getLatestAnchor(msg.sender);
    return block.timestamp - timestamp <= MAX_ANCHOR_AGE;
}


### Nonce-Based Signatures
solidity
// Prevent signature replay
mapping(address => uint256) public userNonces;

function submitScore(
    address user, 
    bytes32 merkleRoot, 
    uint256 timestamp, 
    bytes calldata indexerSig
) external {
    uint256 nonce = userNonces[user]++;
    bytes32 message = keccak256(abi.encodePacked(user, merkleRoot, timestamp, nonce));
    require(verifyIndexerSignature(message, indexerSig), "Invalid signature");
    // ... rest of function
}


## 🔍 Privacy Preservation

### ZK Proof Design
- *Public inputs*: Only what needs to be verified
- *Private inputs*: All sensitive user data
- *Circuit constraints*: Enforce business logic without data exposure
- *Proof verification*: On-chain verification only

### Data Minimization
- *On-chain storage*: Only Merkle roots and metadata
- *Off-chain computation*: All score calculations
- *User control*: Users choose what to reveal
- *Selective disclosure*: Prove specific claims only

## 🚨 Emergency Procedures

### Circuit Compromise
1. *Immediate*: Pause proof verification
2. *Investigation*: Analyze vulnerability
3. *Fix*: Update circuit and redeploy
4. *Recovery*: Migrate to new verifier

### Contract Vulnerability
1. *Pause*: Emergency pause functionality
2. *Assessment*: Security team review
3. *Fix*: Patch or redeploy
4. *Recovery*: Resume operations

### Indexer Compromise
1. *Revoke*: Remove compromised keys
2. *Investigate*: Audit affected data
3. *Recover*: Restore from backups
4. *Prevent*: Implement additional controls

## 📋 Security Checklist

### Pre-Deployment
- [ ] Smart contract audit completed
- [ ] ZK circuit security review
- [ ] Penetration testing performed
- [ ] Access control validated
- [ ] Emergency procedures tested

### Post-Deployment
- [ ] Continuous monitoring active
- [ ] Security incident response plan
- [ ] Regular security reviews
- [ ] Bug bounty program
- [ ] Community security reporting

## 🔮 Future Security Enhancements

### Planned Improvements
1. *Multi-sig governance*: Enhanced access control
2. *Formal verification*: Mathematical proof of correctness
3. *Advanced ZK primitives*: More efficient proofs
4. *Cross-chain security*: Enhanced relay security
5. *Privacy-preserving governance*: Anonymous voting

### Research Areas
1. *ZK proof optimization*: Faster generation and verification
2. *Privacy-preserving ML*: Score computation improvements
3. *Decentralized identity*: Enhanced attestation systems
4. *Quantum resistance*: Post-quantum cryptography

---

## 📞 Security Contact

For security issues or vulnerabilities:
- *Email*: security@onchaincred.com
- *GitHub*: Create security advisory
- *Discord*: #security channel
- *Bug Bounty*: Up to $50,000 for critical issues

*⚠ Please report security issues responsibly and allow time for fixes before public disclosure.*