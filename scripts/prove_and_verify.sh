#!/bin/bash

# OnChainCred ZK Proof Generation and Verification Script
# Compiles Circom circuits and generates proofs

set -e

echo "🔐 Starting OnChainCred ZK proof generation..."

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    echo "❌ Circom not found. Installing..."
    npm install -g circom
fi

# Check if snarkjs is installed
if ! command -v snarkjs &> /dev/null; then
    echo "❌ SnarkJS not found. Installing..."
    npm install -g snarkjs
fi

# Create build directory
mkdir -p circom/build

echo "🔨 Compiling Circom circuits..."

# Compile score leaf circuit
echo "  Compiling score_leaf.circom..."
circom circom/score_leaf.circom --r1cs --wasm --sym --c --output circom/build

# Compile merkle tree circuit
echo "  Compiling score_merkle.circom..."
circom circom/score_merkle.circom --r1cs --wasm --sym --c --output circom/build

echo "✅ Circuits compiled successfully!"

# Generate trusted setup (Powers of Tau)
echo "🎲 Generating trusted setup..."
if [ ! -f "circom/build/pot12_0000.ptau" ]; then
    echo "  Downloading Powers of Tau..."
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_12.ptau -O circom/build/pot12_0000.ptau
else
    echo "  Powers of Tau already exists"
fi

# Phase 2 setup for score leaf circuit
echo "  Phase 2 setup for score_leaf..."
snarkjs groth16 setup circom/build/score_leaf.r1cs circom/build/pot12_0000.ptau circom/build/score_leaf_0000.zkey

# Phase 2 setup for merkle circuit
echo "  Phase 2 setup for score_merkle..."
snarkjs groth16 setup circom/build/score_merkle.r1cs circom/build/pot12_0000.ptau circom/build/score_merkle_0000.zkey

# Contribute to phase 2
echo "  Contributing to phase 2..."
echo "random text" | snarkjs zkey contribute circom/build/score_leaf_0000.zkey circom/build/score_leaf_final.zkey
echo "random text" | snarkjs zkey contribute circom/build/score_merkle_0000.zkey circom/build/score_merkle_final.zkey

# Export verification keys
echo "  Exporting verification keys..."
snarkjs zkey export verificationkey circom/build/score_leaf_final.zkey circom/build/score_leaf_verification_key.json
snarkjs zkey export verificationkey circom/build/score_merkle_final.zkey circom/build/score_merkle_verification_key.json

# Export Solidity verifiers
echo "  Exporting Solidity verifiers..."
snarkjs zkey export solidityverifier circom/build/score_leaf_final.zkey circom/build/ScoreLeafVerifier.sol
snarkjs zkey export solidityverifier circom/build/score_merkle_final.zkey circom/build/ScoreMerkleVerifier.sol

echo "✅ Trusted setup complete!"

# Generate sample proof
echo "🔍 Generating sample proof..."

# Create sample input for score leaf circuit
cat > circom/build/score_leaf_input.json << EOF
{
  "score": 650,
  "threshold": 500
}
EOF

# Create sample input for merkle circuit
cat > circom/build/score_merkle_input.json << EOF
{
  "leaf": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "path": ["1111111111111111111111111111111111111111111111111111111111111111", "2222222222222222222222222222222222222222222222222222222222222222"],
  "root": "3333333333333333333333333333333333333333333333333333333333333333"
}
EOF

# Generate witness
echo "  Generating witness..."
cd circom/build
node score_leaf_js/generate_witness.js score_leaf_js/score_leaf.wasm ../score_leaf_input.json score_leaf_witness.wtns
node score_merkle_js/generate_witness.js score_merkle_js/score_merkle.wasm ../score_merkle_input.json score_merkle_witness.wtns

# Generate proofs
echo "  Generating proofs..."
snarkjs groth16 prove score_leaf_final.zkey score_leaf_witness.wtns score_leaf_proof.json score_leaf_public.json
snarkjs groth16 prove score_merkle_final.zkey score_merkle_witness.wtns score_merkle_proof.json score_merkle_public.json

# Verify proofs
echo "  Verifying proofs..."
snarkjs groth16 verify score_leaf_verification_key.json score_leaf_public.json score_leaf_proof.json
snarkjs groth16 verify score_merkle_verification_key.json score_merkle_public.json score_merkle_proof.json

cd ..

echo "✅ ZK proof generation and verification complete!"
echo ""
echo "📁 Generated files:"
echo "  - circom/build/ScoreLeafVerifier.sol"
echo "  - circom/build/ScoreMerkleVerifier.sol"
echo "  - circom/build/score_leaf_proof.json"
echo "  - circom/build/score_merkle_proof.json"
echo ""
echo "🔗 Copy the verifier contracts to your contracts/ directory"
echo "💡 Use the proof JSONs for testing your verifier contracts"