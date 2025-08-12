// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./OnchainScoreRegistry.sol";
import "./ScoreVerifier.sol";

/**
 * @title LenderAdapter
 * @dev Adapter contract for lenders to verify credit scores and approve loans
 * @notice Integrates score registry, ZK verifier, and loan management
 */
contract LenderAdapter {
    // Contract interfaces
    OnchainScoreRegistry public immutable scoreRegistry;
    ScoreVerifier public immutable scoreVerifier;
    
    // Loan management
    struct Loan {
        address borrower;
        uint256 amount;
        uint256 threshold;
        uint256 timestamp;
        bool approved;
        bool repaid;
    }
    
    mapping(address => Loan[]) public userLoans;
    mapping(bytes32 => bool) public processedProofs;
    
    // Events
    event LoanRequested(
        address indexed borrower,
        uint256 amount,
        uint256 threshold,
        bytes32 indexed proofHash
    );
    
    event LoanApproved(
        address indexed borrower,
        uint256 amount,
        uint256 threshold,
        uint256 timestamp
    );
    
    event LoanRepaid(
        address indexed borrower,
        uint256 amount,
        uint256 timestamp
    );
    
    event LenderUpdated(address indexed oldLender, address indexed newLender);
    
    // State variables
    address public lender;
    uint256 public minLoanAmount = 0.01 ether;
    uint256 public maxLoanAmount = 10 ether;
    uint256 public minScoreThreshold = 700; // Minimum score for loan approval
    
    // Modifiers
    modifier onlyLender() {
        require(msg.sender == lender, "LenderAdapter: only lender");
        _;
    }
    
    modifier validLoanAmount(uint256 amount) {
        require(amount >= minLoanAmount, "LenderAdapter: amount too low");
        require(amount <= maxLoanAmount, "LenderAdapter: amount too high");
        _;
    }
    
    modifier validThreshold(uint256 threshold) {
        require(threshold >= minScoreThreshold, "LenderAdapter: threshold too low");
        require(threshold <= 1000, "LenderAdapter: threshold too high");
        _;
    }
    
    constructor(
        address _scoreRegistry,
        address _scoreVerifier,
        address _lender
    ) {
        require(_scoreRegistry != address(0), "LenderAdapter: invalid registry");
        require(_scoreVerifier != address(0), "LenderAdapter: invalid verifier");
        require(_lender != address(0), "LenderAdapter: invalid lender");
        
        scoreRegistry = OnchainScoreRegistry(_scoreRegistry);
        scoreVerifier = ScoreVerifier(_scoreVerifier);
        lender = _lender;
    }
    
    /**
     * @dev Request a loan with ZK proof verification
     * @param borrower Address of the borrower
     * @param amount Loan amount requested
     * @param threshold Minimum credit score threshold
     * @param proof ZK proof bytes
     * @param merkleRoot Merkle root from score registry
     */
    function requestLoan(
        address borrower,
        uint256 amount,
        uint256 threshold,
        bytes calldata proof,
        bytes32 merkleRoot
    ) external validLoanAmount(amount) validThreshold(threshold) {
        require(borrower != address(0), "LenderAdapter: invalid borrower");
        require(borrower == msg.sender, "LenderAdapter: only borrower can request");
        
        // Check if proof was already processed
        bytes32 proofHash = keccak256(abi.encodePacked(proof, merkleRoot, threshold));
        require(!processedProofs[proofHash], "LenderAdapter: proof already processed");
        
        // Verify the ZK proof
        bool proofValid = scoreVerifier.verifyScoreProof(proof, merkleRoot, threshold);
        require(proofValid, "LenderAdapter: invalid proof");
        
        // Check if user has recent anchor in registry
        bool hasRecent = scoreRegistry.hasRecentAnchor(borrower);
        require(hasRecent, "LenderAdapter: no recent score anchor");
        
        // Mark proof as processed
        processedProofs[proofHash] = true;
        
        // Create loan record
        Loan memory newLoan = Loan({
            borrower: borrower,
            amount: amount,
            threshold: threshold,
            timestamp: block.timestamp,
            approved: true, // Auto-approve if proof is valid
            repaid: false
        });
        
        userLoans[borrower].push(newLoan);
        
        emit LoanRequested(borrower, amount, threshold, proofHash);
        emit LoanApproved(borrower, amount, threshold, block.timestamp);
    }
    
    /**
     * @dev Repay a loan (mock implementation)
     * @param loanIndex Index of the loan to repay
     */
    function repayLoan(uint256 loanIndex) external {
        require(loanIndex < userLoans[msg.sender].length, "LenderAdapter: invalid loan index");
        
        Loan storage loan = userLoans[msg.sender][loanIndex];
        require(!loan.repaid, "LenderAdapter: loan already repaid");
        require(loan.approved, "LenderAdapter: loan not approved");
        
        loan.repaid = true;
        
        emit LoanRepaid(msg.sender, loan.amount, block.timestamp);
    }
    
    /**
     * @dev Get all loans for a user
     * @param user Address of the user
     * @return loans Array of user's loans
     */
    function getUserLoans(address user) external view returns (Loan[] memory) {
        return userLoans[user];
    }
    
    /**
     * @dev Get loan count for a user
     * @param user Address of the user
     * @return count Number of loans
     */
    function getUserLoanCount(address user) external view returns (uint256) {
        return userLoans[user].length;
    }
    
    /**
     * @dev Check if user is eligible for a loan
     * @param user Address of the user
     * @param threshold Minimum score threshold
     * @return eligible True if user is eligible
     */
    function isEligibleForLoan(address user, uint256 threshold) external view returns (bool) {
        // Check if user has recent anchor
        bool hasRecent = scoreRegistry.hasRecentAnchor(user);
        if (!hasRecent) return false;
        
        // Check threshold requirements
        if (threshold < minScoreThreshold) return false;
        
        // Check if user has outstanding loans
        uint256 outstandingCount = 0;
        for (uint256 i = 0; i < userLoans[user].length; i++) {
            if (!userLoans[user][i].repaid) {
                outstandingCount++;
            }
        }
        
        // Limit to 3 outstanding loans
        return outstandingCount < 3;
    }
    
    /**
     * @dev Get loan statistics
     * @return totalLoans Total number of loans
     * @return activeLoans Number of active (unrepaid) loans
     * @return totalVolume Total loan volume
     */
    function getLoanStats() external view returns (
        uint256 totalLoans,
        uint256 activeLoans,
        uint256 totalVolume
    ) {
        for (uint256 i = 0; i < userLoans[msg.sender].length; i++) {
            totalLoans++;
            totalVolume += userLoans[msg.sender][i].amount;
            if (!userLoans[msg.sender][i].repaid) {
                activeLoans++;
            }
        }
    }
    
    // Admin functions
    function setLender(address newLender) external onlyLender {
        require(newLender != address(0), "LenderAdapter: invalid lender");
        address oldLender = lender;
        lender = newLender;
        emit LenderUpdated(oldLender, newLender);
    }
    
    function setLoanLimits(uint256 newMin, uint256 newMax) external onlyLender {
        require(newMin < newMax, "LenderAdapter: invalid limits");
        minLoanAmount = newMin;
        maxLoanAmount = newMax;
    }
    
    function setMinScoreThreshold(uint256 newThreshold) external onlyLender {
        require(newThreshold <= 1000, "LenderAdapter: threshold too high");
        minScoreThreshold = newThreshold;
    }
    
    /**
     * @dev Emergency function to pause loan processing
     * @param paused True to pause, false to resume
     */
    function setPaused(bool paused) external onlyLender {
        // This would integrate with a pausable pattern
        // For demo purposes, just emit an event
        emit LoanRequested(address(0), 0, 0, bytes32(0)); // Dummy event for demo
    }
}