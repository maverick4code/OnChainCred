# OnChainCred: Decentralized, Privacy-Preserving Crypto Credit Score

Hey everyone, thanks for checking out our project! I'm incredibly proud of what we've built here, and I'm excited to walk you through it. OnChainCred started with a simple question: why does the DeFi world still rely on over-collateralized loans? The answer, of course, is that there's no trust layer. There's no way for a lender to know if a borrower is a reliable actor without a privacy-invading, deep dive into their entire transaction history.

Our project, OnChainCred, is our answer to that problem. We've built an end-to-end protocol that takes a user's rich, on-chain history—their transactions, their staking, their DeFi habits—and turns it into a verifiable credit score. The truly innovative part? We use zero-knowledge proofs (ZKPs) so a user can prove to a lender that their score is, say, above 700, without ever revealing their actual score or their personal financial history. It's the best of both worlds: accountability without sacrificing privacy.

We've designed this from the ground up for a hackathon, so every piece is modular, the code is as clean as we could make it, and the entire flow is demonstrable in a live, interactive demo. We hope you love it as much as we do.

## What We Built: The Core Idea

Our goal was to create a full-stack, trust-minimized system. We didn't want to just make a new scoring algorithm; we wanted to build a foundational primitive for the decentralized economy. Here's the high-level breakdown of what we accomplished:

* **A Smart Indexer:** Our off-chain indexer is the engine that drives everything. It's built to grab all the important on-chain events for a wallet, from transfers to loan repayments, and normalize it into a clean, canonical format.
* **The Scoring Engine:** This is our TypeScript service that processes all that indexed data. It's where the magic happens, calculating a deterministic score based on a multi-pillar model. Crucially, it also builds a **Merkle tree** of all the inputs, giving us a cryptographic fingerprint of the score.
* **An On-Chain Anchor:** This is where we touch the blockchain. We deploy a tiny, gas-efficient smart contract called the `OnchainScoreRegistry` that does one job: it stores the cryptographic fingerprint (the Merkle root) of a user's score on-chain. This is the immutable, auditable proof that their score exists and is tied to a specific point in time.
* **Privacy with ZKPs:** We wrote a ZK circuit using Circom that allows a user to prove a single, powerful statement: "My score is a valid leaf in this on-chain Merkle tree AND my score is greater than or equal to a specific threshold." This is the key that unlocks trust without data exposure.
* **A Polished Frontend:** Our Next.js app is the face of the project. It's a clean, step-by-step walkthrough that lets you connect your wallet, see a score get computed, watch the anchor transaction get submitted, and then generate and use a ZK proof to get a mock loan approved.

## How It All Works: The Journey of a Score

Imagine you're a user wanting to prove your creditworthiness. Here's the journey your data takes, from raw on-chain events to a trustless loan approval:

1.  **The Indexer gets to work:** Our indexer service starts listening for events for your wallet on a couple of testnets (we're using Sepolia and Polygon Mumbai). It picks up everything from your token transfers to your successful loan repayments and normalizes it all.
2.  **The Score is Computed:** That clean, normalized data is fed into our scoring engine. The engine meticulously calculates your score, giving you a detailed breakdown of how each activity contributed. It also creates a Merkle tree of all these inputs and signs a bundle of the data.
3.  **An Anchor is Dropped On-Chain:** A trusted entity (for this demo, our indexer) takes that signed score bundle and submits a transaction to our `OnchainScoreRegistry` contract. This transaction anchors the Merkle root on-chain, creating an immutable record of your score's existence at that specific time.
4.  **You Generate a ZK Proof:** Now you, the user, want a loan. You go to our app and click "Generate ZK Proof." Our app takes the private inputs (your score and its place in the Merkle tree) and the public inputs (the Merkle root and the loan's score threshold) and generates a cryptographic proof right in your browser. This proof is tiny and contains no private data.
5.  **The Lender Approves Your Loan:** Finally, you send a transaction to our mock `LenderAdapter` contract. This contract checks two things: is the score anchor recent and valid? And does the ZK proof verify? If both checks pass, it instantly approves your mock loan, all without ever seeing your raw financial history.

It's a beautiful, elegant flow that we believe is a huge step forward for the decentralized credit space.

## Quickstart: A 5-Minute Demo

We designed this project to be easy to get up and running. You can get the entire stack working on your machine and run our live demo in minutes.

### Prerequisites
* [Node.js](https://nodejs.org/en) (v18+)
* [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
* [Hardhat](https://hardhat.org/)
* [Circom](https://docs.circom.io/) & [snarkjs](https://docs.circom.io/getting-started/installation/#snarkjs)

### Installation

```bash
# Clone the repository
git clone [https://github.com/yourname/onchaincred.git](https://github.com/yourname/onchaincred.git)
cd onchaincred

# Install dependencies for all services
npm install
npm install --prefix ./scoring_engine
npm install --prefix ./web
npm install --prefix ./indexer/rpc_poller

# Spin up the local development environment with Docker
docker-compose up -d
```

### Running the Demo
1.  **Compile & Deploy Contracts:**
    ```bash
    npx hardhat run scripts/deploy.ts --network sepolia
    ```
2.  **Generate Score Bundle:**
    ```bash
    node scoring_engine/src/scoreEngine.js --input ./sample_inputs/walletA_events.json --output ./sample_inputs/score_bundle.json
    ```
3.  **Run the Frontend:**
    ```bash
    npm run dev --prefix ./web
    ```
4.  Open your browser to `http://localhost:3000/demo` and follow the steps on the screen to see the full flow in action.

## Under the Hood: The Components

This project is a testament to the power of a full-stack, modular approach. Here's a brief look at the individual components we built.

### **`contracts/` (Solidity)**
This is the heart of our on-chain logic. We wrote three minimal, gas-efficient contracts:
* `OnchainScoreRegistry.sol`: This contract is the on-chain database for our Merkle roots. It's so small and efficient it barely costs anything to use. It validates signatures from our trusted indexer to prevent anyone from submitting a fake score.
* `ScoreVerifier.sol`: This contract is auto-generated by the Circom toolchain. Its only purpose is to verify a ZK proof on-chain. We don't have to trust anyone; we just trust the math.
* `LenderAdapter.sol`: This is a simple, mock contract to show the real-world utility of our score. It's a template for how any lending protocol could integrate with OnChainCred. It simply calls our verifier to confirm a score threshold and then approves a loan.

### **`scoring_engine/` (TypeScript)**
Our off-chain brain. This is where we defined our scoring model and built the logic to process the data. It's entirely off-chain to keep gas costs to zero and make our logic easily updatable.

### **`circom/` (Zero-Knowledge Circuits)**
We custom-built a couple of Circom circuits to prove our core claim. These circuits are designed to prove that a specific credit score is a valid leaf in a Merkle tree and that this score meets a certain threshold—all without revealing any of the private data.

### **`web/` (Next.js & Tailwind)**
We used Next.js, Wagmi, and RainbowKit to create a seamless user experience. The app is clean, responsive, and guides the user through the entire complex flow with simple button clicks, making the magic of ZKPs feel intuitive.

## What's Next?

This is just the beginning. Our architecture is designed to be extensible. If we had more time, we would have added:
* **Multi-chain Indexing:** To truly capture a user's full reputation across multiple chains.
* **Anonymous Attestations:** Using a protocol like Semaphore to allow other users to vouch for a user anonymously.
* **Account Abstraction:** A demo with a Paymaster to show gasless onboarding, making the experience even more seamless for new users.

Thanks again for checking out our project. We're incredibly proud of the foundation we've laid and can't wait to see what comes next.

---

