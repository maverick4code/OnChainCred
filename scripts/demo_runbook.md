# 🎭 OnChainCred Demo Runbook

## 🎯 Demo Overview
*Duration*: 5 minutes  
*Audience*: Hackathon judges and attendees  
*Goal*: Demonstrate end-to-end privacy-preserving credit scoring with ZK proofs

## 🚀 Pre-Demo Setup (5 minutes before)

### 1. Environment Check
bash
# Verify all services are running
npm run health:check
# Expected output: ✅ All services healthy


### 2. Testnet Status
bash
# Check Sepolia and Mumbai testnet status
npm run testnet:status
# Expected: Both networks operational


### 3. Sample Data Preparation
bash
# Generate sample wallet data
npm run demo:prepare-data
# Creates: sample_wallet_0x123.json with mock transactions


## 🎬 Live Demo Script (5 minutes)

### Step 1: Project Introduction (30 seconds)
*🎤 Script*: "OnChainCred is a privacy-preserving credit scoring protocol that lets users prove their creditworthiness without revealing transaction history. Let me show you how it works."

*🖥 Action*: Open browser to http://localhost:3000

### Step 2: Wallet Connection (30 seconds)
*🎤 Script*: "First, let's connect a wallet. This simulates a user onboarding to the platform."

*🖥 Action*: 
- Click "Connect Wallet" button
- Select MetaMask
- Choose Sepolia testnet
- Show connected address: 0x1234...5678

*✅ Expected*: Wallet connects, address displays, balance shows

### Step 3: Score Computation (1 minute)
*🎤 Script*: "Now the system analyzes on-chain data to compute a credit score. Notice it's deterministic - same inputs always produce the same score."

*🖥 Action*:
- Click "Compute Score" button
- Show loading indicator
- Display computed score: *750/1000*
- Expand score breakdown:
  - Base Score: 100
  - Activity Bonus: 180 (high transaction volume)
  - Staking Bonus: 250 (long-term staking)
  - Repayment Bonus: 150 (on-time payments)
  - Attestation Bonus: 70 (verified references)

*✅ Expected*: Score appears within 3 seconds, breakdown is clear

### Step 4: On-Chain Anchoring (1 minute)
*🎤 Script*: "The score gets anchored on-chain as a Merkle root. This creates a tamper-proof record without storing raw data."

*🖥 Action*:
- Click "Anchor Score Onchain" button
- Show transaction in MetaMask
- Confirm transaction
- Display success: "Score anchored! Merkle Root: 0xabcd..."
- Show blockchain confirmation

*✅ Expected*: Transaction confirms within 15 seconds, success message appears

### Step 5: ZK Proof Generation (1 minute)
*🎤 Script*: "Now the magic happens. We generate a zero-knowledge proof that proves the score is above a threshold without revealing the actual score."

*🖥 Action*:
- Set threshold to 700
- Click "Generate & Verify Proof" button
- Show proof generation progress
- Display proof hash: 0xproof123...
- Verify proof on-chain

*✅ Expected*: Proof generates in 5-10 seconds, verification succeeds

### Step 6: Loan Request Demo (1 minute)
*🎤 Script*: "Finally, let's simulate a loan request. The lender verifies the proof and approves the loan without seeing the user's data."

*🖥 Action*:
- Click "Request Mock Loan" button
- Show loan amount: $10,000
- Display approval: "✅ Loan Approved! Score threshold met via ZK proof"
- Show loan details in smart contract

*✅ Expected*: Loan approval appears immediately, contract state updates

## 🔄 Fallback Scenarios

### If Testnet is Slow
*🎤 Script*: "The testnet is experiencing high traffic. Let me show you the recorded demo while we wait for confirmation."

*🖥 Action*: Play pre-recorded demo video

### If ZK Proof Fails
*🎤 Script*: "Let me demonstrate with a pre-generated proof to show the flow."

*🖥 Action*: Use npm run demo:use-fallback-proof

### If Frontend Crashes
*🎤 Script*: "Let me show you the command-line version of the same flow."

*🖥 Action*: Run npm run demo:cli-version

## 📱 Demo Commands Reference

### Quick Commands
bash
# Start demo environment
npm run demo:start

# Reset demo state
npm run demo:reset

# Show demo status
npm run demo:status

# Emergency fallback
npm run demo:fallback


### Demo Data
bash
# Generate fresh sample data
npm run demo:generate-data

# View current demo state
npm run demo:view-state

# Export demo results
npm run demo:export


## 🎯 Key Demo Points

### 1. *Privacy Preservation* 
- User's raw transaction data never leaves their wallet
- Only Merkle roots and ZK proofs are shared

### 2. *Verifiability*
- Scores are deterministic and auditable
- Blockchain provides tamper-proof anchoring

### 3. *Efficiency*
- Heavy computation happens off-chain
- On-chain verification is fast and cheap

### 4. *Interoperability*
- Works across multiple EVM chains
- Standard interfaces for easy integration

## 🚨 Troubleshooting

### Common Issues
- *MetaMask not connecting*: Check network selection (Sepolia)
- *Transaction pending*: Wait 15-30 seconds for confirmation
- *Proof generation slow*: Normal for first run, subsequent runs are faster
- *Score not updating*: Refresh page, check indexer status

### Emergency Commands
bash
# Restart all services
npm run demo:restart-all

# Use mock data
npm run demo:use-mocks

# Skip to final step
npm run demo:skip-to-end


## 🎉 Demo Conclusion

*🎤 Script*: "OnChainCred demonstrates how blockchain can enable privacy-preserving financial services. Users maintain control of their data while proving creditworthiness through cryptographic proofs. This opens new possibilities for DeFi lending, identity verification, and reputation systems."

*🖥 Action*: Show final state with all steps completed, highlight the privacy and verifiability achieved

---

*⏰ Time Check*: Total demo should complete in 4-5 minutes, leaving time for Q&A