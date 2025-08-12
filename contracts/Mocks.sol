// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Mocks
 * @dev Mock contracts for testing and demo purposes
 * @notice Provides simulated DeFi interactions for credit scoring
 */
contract Mocks {
    // Mock staking contract
    struct Stake {
        address user;
        uint256 amount;
        uint256 startTime;
        uint256 duration;
        bool active;
    }
    
    mapping(address => Stake[]) public userStakes;
    mapping(address => uint256) public totalStaked;
    
    // Mock lending contract
    struct LendingPosition {
        address user;
        uint256 borrowed;
        uint256 repaid;
        uint256 dueDate;
        bool active;
    }
    
    mapping(address => LendingPosition[]) public userPositions;
    
    // Events
    event Staked(address indexed user, uint256 amount, uint256 duration);
    event Unstaked(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount, uint256 dueDate);
    event Repaid(address indexed user, uint256 amount);
    
    // Mock staking functions
    function stake(uint256 duration) external payable {
        require(msg.value > 0, "Mocks: must stake some ETH");
        require(duration >= 30 days, "Mocks: minimum 30 days");
        
        Stake memory newStake = Stake({
            user: msg.sender,
            amount: msg.value,
            startTime: block.timestamp,
            duration: duration,
            active: true
        });
        
        userStakes[msg.sender].push(newStake);
        totalStaked[msg.sender] += msg.value;
        
        emit Staked(msg.sender, msg.value, duration);
    }
    
    function unstake(uint256 stakeIndex) external {
        require(stakeIndex < userStakes[msg.sender].length, "Mocks: invalid stake index");
        
        Stake storage stake = userStakes[msg.sender][stakeIndex];
        require(stake.active, "Mocks: stake already unstaked");
        require(block.timestamp >= stake.startTime + stake.duration, "Mocks: stake not matured");
        
        stake.active = false;
        totalStaked[msg.sender] -= stake.amount;
        
        // Return staked amount (in real contract, this would be actual tokens)
        payable(msg.sender).transfer(stake.amount);
        
        emit Unstaked(msg.sender, stake.amount);
    }
    
    // Mock lending functions
    function borrow(uint256 amount, uint256 dueDate) external {
        require(amount > 0, "Mocks: must borrow some amount");
        require(dueDate > block.timestamp, "Mocks: due date must be in future");
        require(dueDate <= block.timestamp + 365 days, "Mocks: max 1 year term");
        
        // Check if user has sufficient staking
        require(totalStaked[msg.sender] >= amount / 2, "Mocks: insufficient collateral");
        
        LendingPosition memory newPosition = LendingPosition({
            user: msg.sender,
            borrowed: amount,
            repaid: 0,
            dueDate: dueDate,
            active: true
        });
        
        userPositions[msg.sender].push(newPosition);
        
        emit Borrowed(msg.sender, amount, dueDate);
    }
    
    function repay(uint256 positionIndex, uint256 amount) external {
        require(positionIndex < userPositions[msg.sender].length, "Mocks: invalid position");
        
        LendingPosition storage position = userPositions[msg.sender][positionIndex];
        require(position.active, "Mocks: position not active");
        require(amount > 0, "Mocks: must repay some amount");
        require(amount <= position.borrowed - position.repaid, "Mocks: amount too high");
        
        position.repaid += amount;
        
        if (position.repaid >= position.borrowed) {
            position.active = false;
        }
        
        emit Repaid(msg.sender, amount);
    }
    
    // View functions
    function getUserStakes(address user) external view returns (Stake[] memory) {
        return userStakes[user];
    }
    
    function getUserPositions(address user) external view returns (LendingPosition[] memory) {
        return userPositions[user];
    }
    
    function getStakingScore(address user) external view returns (uint256) {
        uint256 score = 0;
        
        for (uint256 i = 0; i < userStakes[user].length; i++) {
            Stake memory stake = userStakes[user][i];
            if (stake.active) {
                // Score based on amount and duration
                uint256 timeScore = (block.timestamp - stake.startTime) * 100 / stake.duration;
                uint256 amountScore = stake.amount * 100 / 1 ether;
                score += (timeScore + amountScore) / 2;
            }
        }
        
        return score;
    }
    
    function getLendingScore(address user) external view returns (uint256) {
        uint256 score = 0;
        uint256 totalBorrowed = 0;
        uint256 totalRepaid = 0;
        
        for (uint256 i = 0; i < userPositions[user].length; i++) {
            LendingPosition memory position = userPositions[user][i];
            totalBorrowed += position.borrowed;
            totalRepaid += position.repaid;
        }
        
        if (totalBorrowed > 0) {
            // Score based on repayment ratio
            score = (totalRepaid * 100) / totalBorrowed;
        }
        
        return score;
    }
    
    // Mock attestation contract
    mapping(address => mapping(address => bool)) public attestations;
    mapping(address => uint256) public attestationCount;
    
    function giveAttestation(address user) external {
        require(user != msg.sender, "Mocks: cannot self-attest");
        require(!attestations[msg.sender][user], "Mocks: already attested");
        
        attestations[msg.sender][user] = true;
        attestationCount[user]++;
    }
    
    function getAttestationScore(address user) external view returns (uint256) {
        return attestationCount[user] * 50; // 50 points per attestation, max 500
    }
    
    // Mock risk assessment
    function getRiskFlags(address user) external view returns (uint256) {
        uint256 riskScore = 0;
        
        // Check for late payments
        for (uint256 i = 0; i < userPositions[user].length; i++) {
            LendingPosition memory position = userPositions[user][i];
            if (position.active && block.timestamp > position.dueDate) {
                riskScore += 100; // High risk for late payments
            }
        }
        
        // Check for excessive borrowing
        uint256 totalBorrowed = 0;
        for (uint256 i = 0; i < userPositions[user].length; i++) {
            if (userPositions[user][i].active) {
                totalBorrowed += userPositions[user][i].borrowed;
            }
        }
        
        if (totalBorrowed > totalStaked[user] * 2) {
            riskScore += 50; // Medium risk for high leverage
        }
        
        return riskScore;
    }
    
    // Utility functions for testing
    function resetUser(address user) external {
        // Clear all user data (for testing purposes)
        delete userStakes[user];
        delete userPositions[user];
        delete totalStaked[user];
        delete attestationCount[user];
        
        // Clear attestations
        // Note: This is simplified for demo purposes
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}