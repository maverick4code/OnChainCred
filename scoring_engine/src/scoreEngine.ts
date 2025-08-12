import { ethers } from 'ethers';
import { MerkleTree } from './merkle';

// Types for credit scoring
export interface CreditEvent {
  type: 'transaction' | 'staking' | 'lending' | 'attestation' | 'risk';
  timestamp: number;
  value: number;
  metadata: Record<string, any>;
  weight: number;
}

export interface ScoreComponent {
  name: string;
  score: number;
  weight: number;
  reason: string;
  maxScore: number;
}

export interface CreditScore {
  totalScore: number;
  components: ScoreComponent[];
  timestamp: number;
  userAddress: string;
  merkleRoot: string;
  proofLeaves: string[];
  indexerSignature: string;
}

export interface CanonicalEvents {
  userAddress: string;
  events: CreditEvent[];
  timestamp: number;
}

/**
 * Credit Score Engine
 * Computes deterministic credit scores from on-chain behavior
 */
export class CreditScoreEngine {
  private readonly maxScore = 1000;
  private readonly weights = {
    repayment: 0.40,    // 40% - Repayment history
    staking: 0.25,      // 25% - Staking duration and amount
    activity: 0.20,     // 20% - Transaction activity
    attestations: 0.10, // 10% - Social attestations
    risk: 0.05          // 5% - Risk flags (negative)
  };

  constructor(private indexerPrivateKey: string) {}

  /**
   * Compute credit score from canonical events
   */
  async computeScore(events: CanonicalEvents): Promise<CreditScore> {
    const components = await this.computeComponents(events.events);
    const totalScore = this.calculateTotalScore(components);
    
    // Generate Merkle tree from score components
    const merkleTree = new MerkleTree();
    const leaves = this.generateLeaves(components, events.userAddress);
    const merkleRoot = merkleTree.generateRoot(leaves);
    
    // Sign the score bundle
    const signature = await this.signScoreBundle(events.userAddress, merkleRoot, events.timestamp);
    
    return {
      totalScore,
      components,
      timestamp: events.timestamp,
      userAddress: events.userAddress,
      merkleRoot,
      proofLeaves: leaves,
      indexerSignature: signature
    };
  }

  /**
   * Compute individual score components
   */
  private async computeComponents(events: CreditEvent[]): Promise<ScoreComponent[]> {
    const components: ScoreComponent[] = [];
    
    // Repayment Score (40% weight)
    const repaymentScore = this.computeRepaymentScore(events);
    components.push({
      name: 'Repayment History',
      score: repaymentScore,
      weight: this.weights.repayment,
      reason: this.getRepaymentReason(repaymentScore),
      maxScore: 400
    });

    // Staking Score (25% weight)
    const stakingScore = this.computeStakingScore(events);
    components.push({
      name: 'Staking Behavior',
      score: stakingScore,
      weight: this.weights.staking,
      reason: this.getStakingReason(stakingScore),
      maxScore: 250
    });

    // Activity Score (20% weight)
    const activityScore = this.computeActivityScore(events);
    components.push({
      name: 'Transaction Activity',
      score: activityScore,
      weight: this.weights.activity,
      reason: this.getActivityReason(activityScore),
      maxScore: 200
    });

    // Attestations Score (10% weight)
    const attestationScore = this.computeAttestationScore(events);
    components.push({
      name: 'Social Attestations',
      score: attestationScore,
      weight: this.weights.attestations,
      reason: this.getAttestationReason(attestationScore),
      maxScore: 100
    });

    // Risk Score (5% weight, negative)
    const riskScore = this.computeRiskScore(events);
    components.push({
      name: 'Risk Assessment',
      score: riskScore,
      weight: this.weights.risk,
      reason: this.getRiskReason(riskScore),
      maxScore: 50
    });

    return components;
  }

  /**
   * Compute repayment score based on lending history
   */
  private computeRepaymentScore(events: CreditEvent[]): number {
    const lendingEvents = events.filter(e => e.type === 'lending');
    if (lendingEvents.length === 0) return 0;

    let totalBorrowed = 0;
    let totalRepaid = 0;
    let onTimePayments = 0;
    let latePayments = 0;

    for (const event of lendingEvents) {
      if (event.metadata.action === 'borrow') {
        totalBorrowed += event.value;
      } else if (event.metadata.action === 'repay') {
        totalRepaid += event.value;
        
        if (event.metadata.onTime) {
          onTimePayments++;
        } else {
          latePayments++;
        }
      }
    }

    if (totalBorrowed === 0) return 0;

    // Base score from repayment ratio
    const repaymentRatio = totalRepaid / totalBorrowed;
    let score = Math.min(repaymentRatio * 300, 300);

    // Bonus for on-time payments
    const totalPayments = onTimePayments + latePayments;
    if (totalPayments > 0) {
      const onTimeRatio = onTimePayments / totalPayments;
      score += onTimeRatio * 100;
    }

    return Math.min(score, 400);
  }

  /**
   * Compute staking score based on staking behavior
   */
  private computeStakingScore(events: CreditEvent[]): number {
    const stakingEvents = events.filter(e => e.type === 'staking');
    if (stakingEvents.length === 0) return 0;

    let totalStaked = 0;
    let averageDuration = 0;
    let longTermStakes = 0;

    for (const event of stakingEvents) {
      if (event.metadata.action === 'stake') {
        totalStaked += event.value;
        const duration = event.metadata.duration || 0;
        averageDuration += duration;
        
        if (duration >= 180 * 24 * 60 * 60) { // 6 months
          longTermStakes++;
        }
      }
    }

    if (stakingEvents.length === 0) return 0;

    averageDuration /= stakingEvents.length;

    // Score based on amount staked (0-150 points)
    const amountScore = Math.min((totalStaked / 10) * 150, 150);
    
    // Score based on duration (0-100 points)
    const durationScore = Math.min((averageDuration / (365 * 24 * 60 * 60)) * 100, 100);

    return amountScore + durationScore;
  }

  /**
   * Compute activity score based on transaction history
   */
  private computeActivityScore(events: CreditEvent[]): number {
    const transactionEvents = events.filter(e => e.type === 'transaction');
    if (transactionEvents.length === 0) return 0;

    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60);
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60);

    let recentActivity = 0;
    let mediumActivity = 0;
    let totalVolume = 0;

    for (const event of transactionEvents) {
      totalVolume += event.value;
      
      if (event.timestamp >= thirtyDaysAgo) {
        recentActivity++;
      } else if (event.timestamp >= ninetyDaysAgo) {
        mediumActivity++;
      }
    }

    // Activity frequency score (0-100 points)
    const frequencyScore = Math.min((recentActivity * 10) + (mediumActivity * 5), 100);
    
    // Volume score (0-100 points)
    const volumeScore = Math.min((totalVolume / 100) * 100, 100);

    return frequencyScore + volumeScore;
  }

  /**
   * Compute attestation score based on social proof
   */
  private computeAttestationScore(events: CreditEvent[]): number {
    const attestationEvents = events.filter(e => e.type === 'attestation');
    
    // Each attestation is worth 20 points, max 100
    return Math.min(attestationEvents.length * 20, 100);
  }

  /**
   * Compute risk score based on negative indicators
   */
  private computeRiskScore(events: CreditEvent[]): number {
    const riskEvents = events.filter(e => e.type === 'risk');
    
    let riskScore = 0;
    
    for (const event of riskEvents) {
      if (event.metadata.riskType === 'late_payment') {
        riskScore += 20;
      } else if (event.metadata.riskType === 'high_leverage') {
        riskScore += 15;
      } else if (event.metadata.riskType === 'suspicious_activity') {
        riskScore += 25;
      }
    }

    // Risk score is negative (subtracted from total)
    return Math.min(riskScore, 50);
  }

  /**
   * Calculate total weighted score
   */
  private calculateTotalScore(components: ScoreComponent[]): number {
    let totalScore = 0;
    
    for (const component of components) {
      if (component.name === 'Risk Assessment') {
        totalScore -= component.score; // Risk is negative
      } else {
        totalScore += component.score;
      }
    }

    return Math.max(0, Math.min(totalScore, this.maxScore));
  }

  /**
   * Generate Merkle tree leaves from score components
   */
  private generateLeaves(components: ScoreComponent[], userAddress: string): string[] {
    const leaves: string[] = [];
    
    for (const component of components) {
      const leafData = ethers.utils.defaultAbiCoder.encode(
        ['string', 'uint256', 'uint256', 'address'],
        [component.name, component.score, component.maxScore, userAddress]
      );
      const leafHash = ethers.utils.keccak256(leafData);
      leaves.push(leafHash);
    }

    return leaves;
  }

  /**
   * Sign the score bundle with indexer private key
   */
  private async signScoreBundle(
    userAddress: string, 
    merkleRoot: string, 
    timestamp: number
  ): Promise<string> {
    const wallet = new ethers.Wallet(this.indexerPrivateKey);
    const messageHash = ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['address', 'bytes32', 'uint256'],
        [userAddress, merkleRoot, timestamp]
      )
    );
    
    const signature = await wallet.signMessage(ethers.utils.arrayify(messageHash));
    return signature;
  }

  // Helper methods for generating human-readable reasons
  private getRepaymentReason(score: number): string {
    if (score >= 350) return "Excellent repayment history with consistent on-time payments";
    if (score >= 250) return "Good repayment history with occasional late payments";
    if (score >= 150) return "Fair repayment history with some late payments";
    return "Poor repayment history with frequent late payments";
  }

  private getStakingReason(score: number): string {
    if (score >= 200) return "Strong staking behavior with long-term commitments";
    if (score >= 150) return "Good staking behavior with moderate duration";
    if (score >= 100) return "Fair staking behavior with short-term stakes";
    return "Limited staking activity";
  }

  private getActivityReason(score: number): string {
    if (score >= 150) return "High transaction activity with significant volume";
    if (score >= 100) return "Moderate transaction activity";
    if (score >= 50) return "Low transaction activity";
    return "Minimal transaction activity";
  }

  private getAttestationReason(score: number): string {
    if (score >= 80) return "Strong social attestations from trusted sources";
    if (score >= 60) return "Good social attestations";
    if (score >= 40) return "Some social attestations";
    return "Limited social attestations";
  }

  private getRiskReason(score: number): string {
    if (score <= 10) return "Low risk profile with clean history";
    if (score <= 25) return "Moderate risk with some concerns";
    if (score <= 40) return "High risk with multiple red flags";
    return "Very high risk profile";
  }
}