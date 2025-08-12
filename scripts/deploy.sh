#!/bin/bash

# OnChainCred Deployment Script
# Deploys contracts to Sepolia and Mumbai testnets

set -e

echo "🚀 Starting OnChainCred deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with:"
    echo "PRIVATE_KEY=your_private_key"
    echo "SEPOLIA_RPC_URL=your_sepolia_rpc_url"
    echo "MUMBAI_RPC_URL=your_mumbai_rpc_url"
    echo "ETHERSCAN_API_KEY=your_etherscan_key"
    echo "POLYGONSCAN_API_KEY=your_polygonscan_key"
    exit 1
fi

# Load environment variables
source .env

# Check required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not set in .env"
    exit 1
fi

if [ -z "$SEPOLIA_RPC_URL" ] || [ -z "$MUMBAI_RPC_URL" ]; then
    echo "❌ RPC URLs not set in .env"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Compile contracts
echo "🔨 Compiling contracts..."
npx hardhat compile

# Deploy to Sepolia
echo "🌊 Deploying to Sepolia..."
npx hardhat run scripts/deploy-sepolia.js --network sepolia

# Deploy to Mumbai
echo "🏙 Deploying to Mumbai..."
npx hardhat run scripts/deploy-mumbai.js --network mumbai

echo "✅ Deployment complete!"
echo ""
echo "📋 Contract Addresses:"
echo "Sepolia:"
cat .deployed-sepolia.json 2>/dev/null || echo "  No addresses found"
echo ""
echo "Mumbai:"
cat .deployed-mumbai.json 2>/dev/null || echo "  No addresses found"
echo ""
echo "🔗 Update your frontend .env with these addresses"