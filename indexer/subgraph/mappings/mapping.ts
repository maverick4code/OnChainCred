import { BigInt, Address, ethereum } from "@graphprotocol/graph-ts"
import {
  Transfer,
  Staked,
  Borrowed,
  Repaid,
  AttestationAdded
} from "../generated/OnChainCred/OnChainCred"
import { User, Transaction, StakeEvent, LendingEvent, Attestation } from "../generated/schema"

export function handleTransfer(event: Transfer): void {
  let user = getUser(event.params.from);
  let transaction = new Transaction(event.transaction.hash.toHexString());
  
  transaction.user = user.id;
  transaction.type = "transfer";
  transaction.value = event.params.value;
  transaction.timestamp = event.block.timestamp;
  transaction.chainId = BigInt.fromI32(event.block.chainid);
  transaction.blockNumber = event.block.number;
  transaction.from = event.params.from;
  transaction.to = event.params.to;
  transaction.hash = event.transaction.hash;
  
  transaction.save();
  
  // Update user stats
  user.transactionCount = user.transactionCount.plus(BigInt.fromI32(1));
  user.lastUpdated = event.block.timestamp;
  user.save();
}

export function handleStaked(event: Staked): void {
  let user = getUser(event.params.user);
  let stakeEvent = new StakeEvent(event.transaction.hash.toHexString());
  
  stakeEvent.user = user.id;
  stakeEvent.amount = event.params.amount;
  stakeEvent.pool = event.params.pool;
  stakeEvent.timestamp = event.block.timestamp;
  stakeEvent.chainId = BigInt.fromI32(event.block.chainid);
  stakeEvent.txHash = event.transaction.hash;
  stakeEvent.blockNumber = event.block.number;
  
  stakeEvent.save();
  
  // Update user stats
  user.stakeAmount = user.stakeAmount.plus(event.params.amount);
  user.lastUpdated = event.block.timestamp;
  user.save();
}

export function handleBorrowed(event: Borrowed): void {
  let user = getUser(event.params.user);
  let lendingEvent = new LendingEvent(event.transaction.hash.toHexString());
  
  lendingEvent.user = user.id;
  lendingEvent.type = "borrow";
  lendingEvent.amount = event.params.amount;
  lendingEvent.protocol = event.params.protocol;
  lendingEvent.timestamp = event.block.timestamp;
  lendingEvent.chainId = BigInt.fromI32(event.block.chainid);
  lendingEvent.txHash = event.transaction.hash;
  lendingEvent.blockNumber = event.block.number;
  
  lendingEvent.save();
  
  // Update user stats
  user.lendingVolume = user.lendingVolume.plus(event.params.amount);
  user.lastUpdated = event.block.timestamp;
  user.save();
}

export function handleRepaid(event: Repaid): void {
  let user = getUser(event.params.user);
  let lendingEvent = new LendingEvent(event.transaction.hash.toHexString());
  
  lendingEvent.user = user.id;
  lendingEvent.type = "repay";
  lendingEvent.amount = event.params.amount;
  lendingEvent.protocol = event.params.protocol;
  lendingEvent.timestamp = event.block.timestamp;
  lendingEvent.chainId = BigInt.fromI32(event.block.chainid);
  lendingEvent.txHash = event.transaction.hash;
  lendingEvent.blockNumber = event.block.number;
  
  lendingEvent.save();
  
  // Update user stats
  user.lendingVolume = user.lendingVolume.plus(event.params.amount);
  user.lastUpdated = event.block.timestamp;
  user.save();
}

export function handleAttestationAdded(event: AttestationAdded): void {
  let user = getUser(event.params.user);
  let attestation = new Attestation(event.transaction.hash.toHexString());
  
  attestation.user = user.id;
  attestation.issuer = event.params.issuer;
  attestation.content = event.params.content;
  attestation.score = event.params.score;
  attestation.timestamp = event.block.timestamp;
  attestation.chainId = BigInt.fromI32(event.block.chainid);
  attestation.txHash = event.transaction.hash;
  attestation.blockNumber = event.block.number;
  
  attestation.save();
  
  // Update user stats
  user.attestationCount = user.attestationCount.plus(BigInt.fromI32(1));
  user.lastUpdated = event.block.timestamp;
  user.save();
}

function getUser(address: Address): User {
  let userId = address.toHexString();
  let user = User.load(userId);
  
  if (user == null) {
    user = new User(userId);
    user.address = address;
    user.totalScore = BigInt.fromI32(0);
    user.transactionCount = BigInt.fromI32(0);
    user.stakeAmount = BigInt.fromI32(0);
    user.lendingVolume = BigInt.fromI32(0);
    user.attestationCount = BigInt.fromI32(0);
    user.lastUpdated = BigInt.fromI32(0);
  }
  
  return user;
}