import { useState, useEffect } from 'react'
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ethers } from 'ethers'
import Head from 'next/head'

// Mock contract addresses - replace with deployed addresses
const ONCHAIN_SCORE_REGISTRY = '0x0000000000000000000000000000000000000000'
const LENDER_ADAPTER = '0x0000000000000000000000000000000000000000'

// Mock ABI - replace with actual deployed contract ABIs
const REGISTRY_ABI = [
  'function submitScore(address user, bytes32 merkleRoot, uint256 timestamp, bytes calldata indexerSig) external',
  'function getLatestAnchor(address user) external view returns (bytes32 root, uint256 timestamp)',
  'event ScoreAnchored(address indexed user, bytes32 indexed root, address indexed indexer, uint256 timestamp)'
]

const LENDER_ABI = [
  'function requestLoan(address borrower, bytes calldata proof, uint256 threshold) external returns (bool)',
  'event LoanApproved(address indexed borrower, uint256 amount, uint256 timestamp)'
]

interface ScoreBundle {
  user: string
  score: number
  inputs: Array<{ key: string; value: number; reason: string }>
  merkleRoot: string
  leaves: string[]
  proofLeaves: string[]
  timestamp: number
  indexerSignature?: string
  indexerAddress?: string
}

export default function Home() {
  const { address, isConnected } = useAccount()
  const [scoreBundle, setScoreBundle] = useState<ScoreBundle | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loanAmount, setLoanAmount] = useState('1000')

  // Mock score computation - replace with actual scoring engine call
  const computeScore = async () => {
    setIsLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockScore = Math.floor(Math.random() * 400) + 300 // 300-700 range
    const mockInputs = [
      { key: 'repayment_history', value: 40, reason: 'On-time repayments' },
      { key: 'staking_amount', value: 25, reason: 'Active staking participation' },
      { key: 'transaction_volume', value: 20, reason: 'High transaction volume' },
      { key: 'attestations', value: 15, reason: 'Community attestations' }
    ]
    
    const mockBundle: ScoreBundle = {
      user: address || '0x0000000000000000000000000000000000000000',
      score: mockScore,
      inputs: mockInputs,
      merkleRoot: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
      leaves: mockInputs.map(() => ethers.utils.hexlify(ethers.utils.randomBytes(32))),
      proofLeaves: mockInputs.map(() => ethers.utils.hexlify(ethers.utils.randomBytes(32))),
      timestamp: Math.floor(Date.now() / 1000)
    }
    
    setScoreBundle(mockBundle)
    setIsLoading(false)
    setCurrentStep(2)
  }

  const anchorScore = async () => {
    if (!scoreBundle || !address) return
    
    try {
      setIsLoading(true)
      
      // Mock transaction - replace with actual contract call
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      console.log('Score anchored on-chain!')
      setCurrentStep(3)
    } catch (error) {
      console.error('Error anchoring score:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateProof = async () => {
    if (!scoreBundle) return
    
    try {
      setIsLoading(true)
      
      // Mock proof generation - replace with actual ZK proof generation
      await new Promise(resolve => setTimeout(resolve, 4000))
      
      console.log('ZK proof generated!')
      setCurrentStep(4)
    } catch (error) {
      console.error('Error generating proof:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const requestLoan = async () => {
    if (!scoreBundle || !address) return
    
    try {
      setIsLoading(true)
      
      // Mock loan request - replace with actual contract call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Loan approved!')
      setCurrentStep(5)
    } catch (error) {
      console.error('Error requesting loan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const resetDemo = () => {
    setScoreBundle(null)
    setCurrentStep(1)
  }

  return (
    <>
      <Head>
        <title>OnChainCred - Privacy-Preserving Credit Scores</title>
        <meta name="description" content="OnChainCred - Privacy-preserving, verifiable crypto credit score protocol" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold text-gray-900">OnChainCred</h1>
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  MVP
                </span>
              </div>
              <ConnectButton />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!isConnected ? (
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to OnChainCred
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Connect your wallet to start building your privacy-preserving credit score
              </p>
              <div className="inline-block">
                <ConnectButton />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Progress Steps */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Demo Progress</h2>
                <div className="flex items-center justify-between">
                  {[1, 2, 3, 4, 5].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= currentStep 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step}
                      </div>
                      {step < 5 && (
                        <div className={`w-16 h-1 mx-2 ${
                          step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>Connect</span>
                  <span>Score</span>
                  <span>Anchor</span>
                  <span>Proof</span>
                  <span>Loan</span>
                </div>
              </div>

              {/* Step 1: Score Computation */}
              {currentStep === 1 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Step 1: Compute Credit Score</h2>
                  <p className="text-gray-600 mb-4">
                    Your wallet address: <code className="bg-gray-100 px-2 py-1 rounded">{address}</code>
                  </p>
                  <button
                    onClick={computeScore}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Computing...' : 'Compute Score'}
                  </button>
                </div>
              )}

              {/* Step 2: Score Display & Anchoring */}
              {currentStep >= 2 && scoreBundle && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Step 2: Credit Score & On-Chain Anchoring</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Score Display */}
                    <div>
                      <h3 className="font-medium mb-3">Your Credit Score</h3>
                      <div className="text-4xl font-bold text-blue-600 mb-4">
                        {scoreBundle.score}
                      </div>
                      <div className="space-y-2">
                        {scoreBundle.inputs.map((input, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-600">{input.key.replace(/_/g, ' ')}:</span>
                            <span className="font-medium">+{input.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Anchoring */}
                    <div>
                      <h3 className="font-medium mb-3">On-Chain Anchoring</h3>
                      <div className="space-y-3">
                        <div className="text-sm">
                          <span className="text-gray-600">Merkle Root:</span>
                          <code className="block bg-gray-100 p-2 rounded text-xs break-all">
                            {scoreBundle.merkleRoot}
                          </code>
                        </div>
                        <button
                          onClick={anchorScore}
                          disabled={isLoading}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {isLoading ? 'Anchoring...' : 'Anchor Score On-Chain'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: ZK Proof Generation */}
              {currentStep >= 3 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Step 3: Generate Zero-Knowledge Proof</h2>
                  <p className="text-gray-600 mb-4">
                    Generate a ZK proof that your score meets the threshold without revealing the actual score
                  </p>
                  <button
                    onClick={generateProof}
                    disabled={isLoading}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Generating Proof...' : 'Generate ZK Proof'}
                  </button>
                </div>
              )}

              {/* Step 4: Loan Request */}
              {currentStep >= 4 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-semibold mb-4">Step 4: Request Loan with ZK Proof</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Loan Amount (USDC)
                      </label>
                      <input
                        type="number"
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="1000"
                      />
                    </div>
                    
                    <button
                      onClick={requestLoan}
                      disabled={isLoading}
                      className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Request Loan'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Success */}
              {currentStep === 5 && (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-green-600 mb-4">Loan Approved!</h2>
                  <p className="text-gray-600 mb-6">
                    Congratulations! Your loan of {loanAmount} USDC has been approved using your privacy-preserving credit score.
                  </p>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">
                      ✅ Score computed and anchored on-chain<br/>
                      ✅ ZK proof generated and verified<br/>
                      ✅ Loan approved without revealing personal data
                    </p>
                  </div>
                  <button
                    onClick={resetDemo}
                    className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                  >
                    Run Demo Again
                  </button>
                </div>
              )}

              {/* Demo Info */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-blue-900 mb-2">About This Demo</h3>
                <p className="text-blue-800 text-sm">
                  This is a working MVP of OnChainCred. The demo simulates the complete flow from score computation 
                  to loan approval using zero-knowledge proofs. In production, this would integrate with real 
                  blockchain networks and ZK proof systems.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}