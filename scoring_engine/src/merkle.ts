import { ethers } from 'ethers';

/**
 * Merkle Tree implementation for credit score verification
 * Uses Keccak256 hashing for compatibility with Ethereum
 */
export class MerkleTree {
  private readonly hashFunction = (left: string, right: string): string => {
    return ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'bytes32'],
        [left, right]
      )
    );
  };

  /**
   * Generate Merkle root from array of leaves
   */
  generateRoot(leaves: string[]): string {
    if (leaves.length === 0) {
      throw new Error('Cannot generate root from empty leaves array');
    }

    if (leaves.length === 1) {
      return leaves[0];
    }

    // Ensure even number of leaves by duplicating last leaf if needed
    const paddedLeaves = this.padLeaves(leaves);
    const tree = this.buildTree(paddedLeaves);
    
    return tree[tree.length - 1][0];
  }

  /**
   * Generate Merkle proof for a specific leaf
   */
  generateProof(leaves: string[], leafIndex: number): {
    leaf: string;
    path: string[];
    siblings: string[];
    indices: number[];
  } {
    if (leafIndex >= leaves.length) {
      throw new Error('Leaf index out of bounds');
    }

    const paddedLeaves = this.padLeaves(leaves);
    const tree = this.buildTree(paddedLeaves);
    
    const path: string[] = [];
    const siblings: string[] = [];
    const indices: number[] = [];
    
    let currentIndex = leafIndex;
    
    for (let level = 0; level < tree.length - 1; level++) {
      const levelSize = tree[level].length;
      const isRight = currentIndex % 2 === 1;
      const siblingIndex = isRight ? currentIndex - 1 : currentIndex + 1;
      
      if (siblingIndex < levelSize) {
        siblings.push(tree[level][siblingIndex]);
        path.push(tree[level][currentIndex]);
        indices.push(isRight ? 1 : 0);
      }
      
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return {
      leaf: leaves[leafIndex],
      path,
      siblings,
      indices
    };
  }

  /**
   * Verify Merkle proof
   */
  verifyProof(
    leaf: string,
    proof: string[],
    root: string,
    indices: number[]
  ): boolean {
    if (proof.length !== indices.length) {
      return false;
    }

    let currentHash = leaf;
    
    for (let i = 0; i < proof.length; i++) {
      const isRight = indices[i] === 1;
      const sibling = proof[i];
      
      if (isRight) {
        currentHash = this.hashFunction(sibling, currentHash);
      } else {
        currentHash = this.hashFunction(currentHash, sibling);
      }
    }
    
    return currentHash === root;
  }

  /**
   * Build complete Merkle tree from leaves
   */
  private buildTree(leaves: string[]): string[][] {
    const tree: string[][] = [leaves];
    let currentLevel = leaves;
    
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        if (i + 1 < currentLevel.length) {
          const hash = this.hashFunction(currentLevel[i], currentLevel[i + 1]);
          nextLevel.push(hash);
        } else {
          // Duplicate last element if odd number
          const hash = this.hashFunction(currentLevel[i], currentLevel[i]);
          nextLevel.push(hash);
        }
      }
      
      tree.push(nextLevel);
      currentLevel = nextLevel;
    }
    
    return tree;
  }

  /**
   * Pad leaves array to ensure even number of elements
   */
  private padLeaves(leaves: string[]): string[] {
    if (leaves.length % 2 === 0) {
      return leaves;
    }
    
    // Duplicate last leaf to make even
    return [...leaves, leaves[leaves.length - 1]];
  }

  /**
   * Get tree depth
   */
  getTreeDepth(leafCount: number): number {
    return Math.ceil(Math.log2(leafCount));
  }

  /**
   * Generate sample data for testing
   */
  static generateSampleLeaves(count: number): string[] {
    const leaves: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const data = ethers.utils.defaultAbiCoder.encode(
        ['uint256', 'string'],
        [i, Sample data ${i}]
      );
      leaves.push(ethers.utils.keccak256(data));
    }
    
    return leaves;
  }

  /**
   * Create a deterministic Merkle tree from credit score components
   */
  static createScoreTree(components: Array<{
    name: string;
    score: number;
    maxScore: number;
    userAddress: string;
  }>): {
    root: string;
    leaves: string[];
    proofs: Array<{
      leaf: string;
      path: string[];
      siblings: string[];
      indices: number[];
    }>;
  } {
    const tree = new MerkleTree();
    
    // Generate leaves from components
    const leaves = components.map(component => {
      const leafData = ethers.utils.defaultAbiCoder.encode(
        ['string', 'uint256', 'uint256', 'address'],
        [component.name, component.score, component.maxScore, component.userAddress]
      );
      return ethers.utils.keccak256(leafData);
    });
    
    // Generate root
    const root = tree.generateRoot(leaves);
    
    // Generate proofs for each leaf
    const proofs = components.map((_, index) => 
      tree.generateProof(leaves, index)
    );
    
    return {
      root,
      leaves,
      proofs
    };
  }

  /**
   * Verify a specific score component in the tree
   */
  static verifyScoreComponent(
    component: {
      name: string;
      score: number;
      maxScore: number;
      userAddress: string;
    },
    proof: {
      path: string[];
      siblings: string[];
      indices: number[];
    },
    root: string
  ): boolean {
    const tree = new MerkleTree();
    
    // Generate leaf hash
    const leafData = ethers.utils.defaultAbiCoder.encode(
      ['string', 'uint256', 'uint256', 'address'],
      [component.name, component.score, component.maxScore, component.userAddress]
    );
    const leaf = ethers.utils.keccak256(leafData);
    
    // Verify proof
    return tree.verifyProof(leaf, proof.siblings, root, proof.indices);
  }
}