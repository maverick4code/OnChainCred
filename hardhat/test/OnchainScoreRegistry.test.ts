import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, ContractFactory, Signer, BigNumber } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("OnchainScoreRegistry", function () {
  let OnchainScoreRegistry: ContractFactory;
  let registry: Contract;
  let owner: SignerWithAddress;
  let indexer: SignerWithAddress;
  let user: SignerWithAddress;
  let otherUser: SignerWithAddress;

  beforeEach(async function () {
    [owner, indexer, user, otherUser] = await ethers.getSigners();

    OnchainScoreRegistry = await ethers.getContractFactory("OnchainScoreRegistry");
    registry = await OnchainScoreRegistry.deploy();
    await registry.deployed();

    // Grant indexer role to the indexer address
    await registry.grantRole(await registry.INDEXER_ROLE(), indexer.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await registry.hasRole(await registry.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.true;
    });

    it("Should grant indexer role to the specified address", async function () {
      expect(await registry.hasRole(await registry.INDEXER_ROLE(), indexer.address)).to.be.true;
    });
  });

  describe("Role Management", function () {
    it("Should allow admin to grant indexer role", async function () {
      await registry.grantRole(await registry.INDEXER_ROLE(), otherUser.address);
      expect(await registry.hasRole(await registry.INDEXER_ROLE(), otherUser.address)).to.be.true;
    });

    it("Should allow admin to revoke indexer role", async function () {
      await registry.revokeRole(await registry.INDEXER_ROLE(), indexer.address);
      expect(await registry.hasRole(await registry.INDEXER_ROLE(), indexer.address)).to.be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      await expect(
        registry.connect(otherUser).grantRole(await registry.INDEXER_ROLE(), otherUser.address)
      ).to.be.revertedWith(
        AccessControl: account ${otherUser.address.toLowerCase()} is missing role ${await registry.DEFAULT_ADMIN_ROLE()}
      );
    });
  });

  describe("Score Submission", function () {
    const merkleRoot = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const timestamp = Math.floor(Date.now() / 1000);

    it("Should allow indexer to submit score", async function () {
      await expect(
        registry.connect(indexer).submitScore(user.address, merkleRoot, timestamp, "0x")
      ).to.emit(registry, "ScoreAnchored")
        .withArgs(user.address, merkleRoot, indexer.address, timestamp);
    });

    it("Should not allow non-indexer to submit score", async function () {
      await expect(
        registry.connect(otherUser).submitScore(user.address, merkleRoot, timestamp, "0x")
      ).to.be.revertedWith(
        AccessControl: account ${otherUser.address.toLowerCase()} is missing role ${await registry.INDEXER_ROLE()}
      );
    });

    it("Should update latest anchor for user", async function () {
      await registry.connect(indexer).submitScore(user.address, merkleRoot, timestamp, "0x");
      
      const [root, time] = await registry.getLatestAnchor(user.address);
      expect(root).to.equal(merkleRoot);
      expect(time).to.equal(timestamp);
    });

    it("Should allow multiple score updates for same user", async function () {
      const newMerkleRoot = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      const newTimestamp = timestamp + 3600;

      await registry.connect(indexer).submitScore(user.address, merkleRoot, timestamp, "0x");
      await registry.connect(indexer).submitScore(user.address, newMerkleRoot, newTimestamp, "0x");

      const [root, time] = await registry.getLatestAnchor(user.address);
      expect(root).to.equal(newMerkleRoot);
      expect(time).to.equal(newTimestamp);
    });

    it("Should handle signature verification correctly", async function () {
      // Create a valid signature
      const message = ethers.utils.defaultAbiCoder.encode(
        ["address", "bytes32", "uint256"],
        [user.address, merkleRoot, timestamp]
      );
      const messageHash = ethers.utils.keccak256(message);
      const signature = await indexer.signMessage(ethers.utils.arrayify(messageHash));

      await expect(
        registry.connect(otherUser).submitScore(user.address, merkleRoot, timestamp, signature)
      ).to.emit(registry, "ScoreAnchored")
        .withArgs(user.address, merkleRoot, otherUser.address, timestamp);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero address user", async function () {
      const merkleRoot = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      const timestamp = Math.floor(Date.now() / 1000);

      await expect(
        registry.connect(indexer).submitScore(ethers.constants.AddressZero, merkleRoot, timestamp, "0x")
      ).to.emit(registry, "ScoreAnchored")
        .withArgs(ethers.constants.AddressZero, merkleRoot, indexer.address, timestamp);
    });

    it("Should handle zero merkle root", async function () {
      const timestamp = Math.floor(Date.now() / 1000);

      await expect(
        registry.connect(indexer).submitScore(user.address, ethers.constants.HashZero, timestamp, "0x")
      ).to.emit(registry, "ScoreAnchored")
        .withArgs(user.address, ethers.constants.HashZero, indexer.address, timestamp);
    });

    it("Should handle future timestamps", async function () {
      const merkleRoot = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // 24 hours in future

      await expect(
        registry.connect(indexer).submitScore(user.address, merkleRoot, futureTimestamp, "0x")
      ).to.emit(registry, "ScoreAnchored")
        .withArgs(user.address, merkleRoot, indexer.address, futureTimestamp);
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for score submission", async function () {
      const merkleRoot = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      const timestamp = Math.floor(Date.now() / 1000);

      const tx = await registry.connect(indexer).submitScore(user.address, merkleRoot, timestamp, "0x");
      const receipt = await tx.wait();
      
      // Gas should be reasonable (less than 100k)
      expect(receipt.gasUsed).to.be.lt(100000);
    });
  });
});