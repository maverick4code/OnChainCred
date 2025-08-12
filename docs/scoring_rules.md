# 📊 OnChainCred Scoring Rules & Algorithm

## 🎯 Overview

The OnChainCred scoring system computes a deterministic credit score from on-chain user behavior. The algorithm is designed to be transparent, fair, and resistant to gaming while providing meaningful creditworthiness signals.

## 🧮 Scoring Formula

### Base Formula

Total Score = Base Score + Activity Bonus + Staking Bonus + Repayment Bonus + Attestation Bonus + Risk Penalty


*Maximum Score*: 1000 points  
*Minimum Score*: 100 points  
*Score Range*: 100-1000

### Component Breakdown

#### 1. Base Score (100 points)
- *Fixed*: Every user starts with 100 points
- *Purpose*: Ensures minimum creditworthiness for all users
- *Logic*: baseScore = 100

#### 2. Activity Bonus (0-200 points)
- *Transaction Volume*: 0-100 points
- *Transaction Frequency*: 0-100 points

*Transaction Volume Scoring*:
typescript
function calculateVolumeScore(totalVolume: number): number {
    if (totalVolume >= 100000) return 100;        // $100k+ = 100 points
    if (totalVolume >= 50000) return 80;          // $50k+ = 80 points
    if (totalVolume >= 10000) return 60;          // $10k+ = 60 points
    if (totalVolume >= 5000) return 40;           // $5k+ = 40 points
    if (totalVolume >= 1000) return 20;           // $1k+ = 20 points
    return 0;                                     // <$1k = 0 points
}


*Transaction Frequency Scoring*:
typescript
function calculateFrequencyScore(avgTxPerMonth: number): number {
    if (avgTxPerMonth >= 50) return 100;          // 50+ tx/month = 100 points
    if (avgTxPerMonth >= 30) return 80;           // 30+ tx/month = 80 points
    if (avgTxPerMonth >= 20) return 60;           // 20+ tx/month = 60 points
    if (avgTxPerMonth >= 10) return 40;           // 10+ tx/month = 40 points
    if (avgTxPerMonth >= 5) return 20;            // 5+ tx/month = 20 points
    return 0;                                     // <5 tx/month = 0 points
}


#### 3. Staking Bonus (0-300 points)
- *Stake Amount*: 0-150 points
- *Stake Duration*: 0-150 points

*Stake Amount Scoring*:
typescript
function calculateStakeAmountScore(stakeAmount: number): number {
    if (stakeAmount >= 10000) return 150;         // 10+ ETH = 150 points
    if (stakeAmount >= 5000) return 120;          // 5+ ETH = 120 points
    if (stakeAmount >= 2000) return 90;           // 2+ ETH = 90 points
    if (stakeAmount >= 1000) return 60;           // 1+ ETH = 60 points
    if (stakeAmount >= 500) return 30;            // 0.5+ ETH = 30 points
    return 0;                                     // <0.5 ETH = 0 points
}


*Stake Duration Scoring*:
typescript
function calculateStakeDurationScore(stakeDuration: number): number {
    if (stakeDuration >= 365) return 150;         // 1+ year = 150 points
    if (stakeDuration >= 180) return 120;         // 6+ months = 120 points
    if (stakeDuration >= 90) return 90;           // 3+ months = 90 points
    if (stakeDuration >= 30) return 60;           // 1+ month = 60 points
    if (stakeDuration >= 7) return 30;            // 1+ week = 30 points
    return 0;                                     // <1 week = 0 points
}


#### 4. Repayment Bonus (0-200 points)
- *On-Time Repayments*: 0-150 points
- *Repayment Amount*: 0-50 points

*On-Time Repayment Scoring*:
typescript
function calculateRepaymentScore(repayments: Repayment[]): number {
    const onTimeRepayments = repayments.filter(r => r.isOnTime).length;
    const totalRepayments = repayments.length;
    
    if (totalRepayments === 0) return 0;
    
    const onTimeRate = onTimeRepayments / totalRepayments;
    
    if (onTimeRate >= 0.95) return 150;           // 95%+ on-time = 150 points
    if (onTimeRate >= 0.90) return 120;           // 90%+ on-time = 120 points
    if (onTimeRate >= 0.80) return 90;            // 80%+ on-time = 90 points
    if (onTimeRate >= 0.70) return 60;            // 70%+ on-time = 60 points
    if (onTimeRate >= 0.50) return 30;            // 50%+ on-time = 30 points
    return 0;                                     // <50% on-time = 0 points
}


*Repayment Amount Scoring*:
typescript
function calculateRepaymentAmountScore(totalRepaid: number): number {
    if (totalRepaid >= 50000) return 50;          // $50k+ repaid = 50 points
    if (totalRepaid >= 20000) return 40;          // $20k+ repaid = 40 points
    if (totalRepaid >= 10000) return 30;          // $10k+ repaid = 30 points
    if (totalRepaid >= 5000) return 20;           // $5k+ repaid = 20 points
    if (totalRepaid >= 1000) return 10;           // $1k+ repaid = 10 points
    return 0;                                     // <$1k repaid = 0 points
}


#### 5. Attestation Bonus (0-200 points)
- *Verified Attestations*: 0-150 points
- *Attester Reputation*: 0-50 points

*Verified Attestation Scoring*:
typescript
function calculateAttestationScore(attestations: Attestation[]): number {
    const verifiedAttestations = attestations.filter(a => a.isVerified).length;
    
    if (verifiedAttestations >= 10) return 150;    // 10+ attestations = 150 points
    if (verifiedAttestations >= 7) return 120;     // 7+ attestations = 120 points
    if (verifiedAttestations >= 5) return 90;      // 5+ attestations = 90 points
    if (verifiedAttestations >= 3) return 60;      // 3+ attestations = 60 points
    if (verifiedAttestations >= 1) return 30;      // 1+ attestation = 30 points
    return 0;                                     // 0 attestations = 0 points
}


*Attester Reputation Scoring*:
typescript
function calculateAttesterReputationScore(attestations: Attestation[]): number {
    const avgAttesterScore = attestations.reduce((sum, a) => sum + a.attesterScore, 0) / attestations.length;
    
    if (avgAttesterScore >= 800) return 50;       // Avg attester score 800+ = 50 points
    if (avgAttesterScore >= 700) return 40;       // Avg attester score 700+ = 40 points
    if (avgAttesterScore >= 600) return 30;       // Avg attester score 600+ = 30 points
    if (avgAttesterScore >= 500) return 20;       // Avg attester score 500+ = 20 points
    if (avgAttesterScore >= 400) return 10;       // Avg attester score 400+ = 10 points
    return 0;                                     // Avg attester score <400 = 0 points
}


#### 6. Risk Penalty (0 to -200 points)
- *Liquidations*: 0 to -100 points
- *Late Payments*: 0 to -100 points

*Liquidation Penalty*:
typescript
function calculateLiquidationPenalty(liquidations: Liquidation[]): number {
    const recentLiquidations = liquidations.filter(l => 
        Date.now() - l.timestamp < 365 * 24 * 60 * 60 * 1000 // Last year
    ).length;
    
    if (recentLiquidations === 0) return 0;       // No liquidations = 0 penalty
    if (recentLiquidations === 1) return -25;     // 1 liquidation = -25 points
    if (recentLiquidations === 2) return -50;     // 2 liquidations = -50 points
    if (recentLiquidations === 3) return -75;     // 3 liquidations = -75 points
    return -100;                                  // 4+ liquidations = -100 points
}


*Late Payment Penalty*:
typescript
function calculateLatePaymentPenalty(latePayments: LatePayment[]): number {
    const recentLatePayments = latePayments.filter(l => 
        Date.now() - l.timestamp < 365 * 24 * 60 * 60 * 1000 // Last year
    ).length;
    
    if (recentLatePayments === 0) return 0;       // No late payments = 0 penalty
    if (recentLatePayments === 1) return -20;     // 1 late payment = -20 points
    if (recentLatePayments === 2) return -40;     // 2 late payments = -40 points
    if (recentLatePayments === 3) return -60;     // 3 late payments = -60 points
    if (recentLatePayments === 4) return -80;     // 4 late payments = -80 points
    return -100;                                  // 5+ late payments = -100 points
}


## ⚖ Anti-Gaming Measures

### 1. Time Decay
Recent activity is weighted more heavily than old activity:
typescript
function applyTimeDecay(score: number, eventAge: number): number {
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
    const timeWeight = Math.max(0.1, 1 - (eventAge / maxAge));
    return score * timeWeight;
}


### 2. Diversity Requirements
Users must have activity across multiple categories:
typescript
function checkDiversity(events: Event[]): boolean {
    const categories = new Set(events.map(e => e.category));
    const requiredCategories = ['transactions', 'staking', 'lending', 'attestations'];
    return categories.size >= requiredCategories.length * 0.75;
}


### 3. Minimum Activity Thresholds
Prevents gaming with minimal activity:
typescript
function checkMinimumActivity(events: Event[]): boolean {
    const totalVolume = events.reduce((sum, e) => sum + e.volume, 0);
    const totalCount = events.length;
    
    return totalVolume >= 1000 && totalCount >= 10; // $1k+ volume, 10+ events
}


### 4. Stake Lock Requirements
Staking bonuses require minimum lock periods:
typescript
function checkStakeLock(stake: Stake): boolean {
    const minLockPeriod = 30 * 24 * 60 * 60 * 1000; // 30 days
    return (Date.now() - stake.startTime) >= minLockPeriod;
}


## 🔄 Score Updates

### Update Frequency
- *Real-time*: Activity and staking scores update immediately
- *Daily*: Repayment and attestation scores recalculate
- *Weekly*: Full score recalculation with time decay
- *Monthly*: Risk penalty reassessment

### Update Triggers
1. *New transaction*: Immediate activity score update
2. *Stake change*: Immediate staking score update
3. *Repayment event*: Daily repayment score update
4. *New attestation*: Daily attestation score update
5. *Liquidation/late payment*: Immediate risk penalty update

## 📈 Score Interpretation

### Score Ranges
- *900-1000*: Excellent credit (top 5%)
- *800-899*: Very good credit (top 15%)
- *700-799*: Good credit (top 30%)
- *600-699*: Fair credit (top 50%)
- *500-599*: Below average (top 70%)
- *400-499*: Poor credit (top 85%)
- *300-399*: Very poor credit (top 95%)
- *100-299*: Minimal credit (bottom 5%)

### Lending Thresholds
- *Uncollateralized loans*: 800+ score
- *Low collateral loans*: 700+ score
- *Standard loans*: 600+ score
- *High collateral loans*: 500+ score
- *No loans*: <500 score

## 🛠 Customization & Extensions

### Parameter Tuning
All scoring parameters can be adjusted:
typescript
interface ScoringConfig {
    baseScore: number;
    maxActivityBonus: number;
    maxStakingBonus: number;
    maxRepaymentBonus: number;
    maxAttestationBonus: number;
    maxRiskPenalty: number;
    timeDecayRate: number;
    diversityThreshold: number;
}


### Custom Scoring Rules
Protocols can implement custom scoring:
typescript
interface CustomScoringRule {
    name: string;
    weight: number;
    calculate: (events: Event[]) => number;
    validate: (events: Event[]) => boolean;
}


## 📊 Example Calculations

### Example 1: High-Activity User
typescript
const user = {
    baseScore: 100,
    activityBonus: 180,      // High volume + frequency
    stakingBonus: 250,       // Large stake + long duration
    repaymentBonus: 150,     // Perfect repayment history
    attestationBonus: 120,   // Good attestations
    riskPenalty: 0           // No liquidations or late payments
};

const totalScore = 100 + 180 + 250 + 150 + 120 + 0 = 800;
// Result: 800/1000 (Good credit)


### Example 2: New User
typescript
const user = {
    baseScore: 100,
    activityBonus: 40,       // Low volume + frequency
    stakingBonus: 0,         // No staking
    repaymentBonus: 0,       // No repayment history
    attestationBonus: 30,    // Basic attestations
    riskPenalty: 0           // No risk events
};

const totalScore = 100 + 40 + 0 + 0 + 30 + 0 = 170;
// Result: 170/1000 (Minimal credit)


### Example 3: Risky User
typescript
const user = {
    baseScore: 100,
    activityBonus: 120,      // Moderate activity
    stakingBonus: 100,       // Small stake
    repaymentBonus: 50,      // Some late payments
    attestationBonus: 60,    // Few attestations
    riskPenalty: -80         // Multiple late payments
};

const totalScore = 100 + 120 + 100 + 50 + 60 + (-80) = 350;
// Result: 350/1000 (Poor credit)


---

## 🔮 Future Enhancements

### Planned Improvements
1. *Machine Learning*: Adaptive scoring based on user patterns
2. *Cross-chain scoring*: Unified scores across multiple chains
3. *Social scoring*: Reputation from community interactions
4. *Dynamic weights*: Adjustable scoring based on market conditions

### Research Areas
1. *Privacy-preserving ML*: Score computation without data exposure
2. *Decentralized identity*: Enhanced attestation systems
3. *Quantum-resistant scoring*: Future-proof cryptographic methods
4. *Cross-protocol integration*: Scores usable across DeFi platforms