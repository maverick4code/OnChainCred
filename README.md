# OnChainCred - Privacy-Preserving Crypto Credit Score Protocol

**TL;DR**: Zero-knowledge credit scoring that aggregates on-chain behavior into verifiable scores without revealing transaction history.

## 🚀 Quick Start (2 minutes)

```bash
# 1. Clone and install
git clone <repo> && cd onchaincred
npm install && cd contracts && npm install && cd ../web && npm install

# 2. Set environment variables
cp .env.example .env
# Edit .env with your keys: PRIVATE_KEY, ALCHEMY_API_KEY

# 3. Deploy contracts
cd scripts && ./deploy.sh sepolia

# 4. Run scoring engine
cd ../scoring_engine && npm run score -- --input sample_inputs/sample_wallet.json

# 5. Start frontend
cd ../web && npm run dev
# Visit http://localhost:3000
```

## Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Indexer   │───▶│ Scoring      │───▶│ ZK Proof        │
│ (RPC/Graph) │    │ Engine       │    │ Generation      │
└─────────────┘    └──────────────┘    └─────────────────┘
       │                    │                     │
       ▼                    ▼                     ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│ Canonical   │    │ Score +      │    │ Proof + Public  │
│ Events JSON │    │ Merkle Root  │    │ Inputs          │
└─────────────┘    └──────────────┘    └─────────────────┘
                           │                     │
                           ▼                     ▼
                  ┌──────────────┐    ┌─────────────────┐
                  │ OnChain      │    │ Verifier        │
                  │ Registry     │    │ Contract        │
                  └──────────────┘    └─────────────────┘
```

## Components

**Indexer**: Collects wallet events from multiple chains (transactions, staking, DeFi interactions)
**Scoring Engine**: Computes deterministic credit scores with explainable factors
**ZK Circuits**: Proves "score ≥ threshold" without revealing raw score
**Smart Contracts**: Anchors score commitments and verifies proofs on-chain
**Frontend**: Interactive demo showing complete user flow

## Demo Flow

1. **Connect Wallet** - RainbowKit integration
2. **Compute Score** - Analyze on-chain history 
3. **Anchor Score** - Submit Merkle root to registry
4. **Generate Proof** - ZK proof that score ≥ threshold
5. **Get Loan** - Lender verifies proof and approves

## Testnet Deployments

### Sepolia
- OnchainScoreRegistry: `0x...` 
- ScoreVerifier: `0x...`
- LenderAdapter: `0x...`

### Polygon Mumbai  
- OnchainScoreRegistry: `0x...`
- ScoreVerifier: `0x...`  
- LenderAdapter: `0x...`

## Technology Stack

- **Contracts**: Solidity ^0.8.20, Hardhat
- **ZK**: Circom 2, snarkjs, Groth16
- **Backend**: TypeScript, Node.js, PostgreSQL
- **Frontend**: Next.js, Tailwind, Wagmi, RainbowKit
- **Indexing**: The Graph + RPC fallback

## Security Features

- ✅ Anti-replay protection with timestamps
- ✅ Signature verification for score anchors  
- ✅ Fresh anchor requirements (24h window)
- ✅ Merkle tree commitment schemes
- ✅ Zero-knowledge score verification

## File Structure

```
onchaincred/
├─ contracts/           # Solidity contracts
├─ circom/             # ZK circuits  
├─ indexer/            # Data collection
├─ scoring_engine/     # Score computation
├─ web/                # Next.js frontend
├─ scripts/            # Deployment & demo
└─ docs/               # Documentation
```

Built for hackathons - optimized for rapid deployment and impressive demos! 🏆
