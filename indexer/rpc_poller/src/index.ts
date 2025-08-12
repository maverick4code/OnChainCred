#!/usr/bin/env node

import { Command } from 'commander';
import { ethers } from 'ethers';
import { Pool } from 'pg';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface CanonicalEvent {
  type: string;
  chainId: number;
  timestamp: number;
  value: string;
  from: string;
  to?: string;
  txHash: string;
  blockNumber: number;
  protocol?: string;
  pool?: string;
  asset?: string;
  metadata?: any;
}

interface IndexerConfig {
  rpcUrls: { [chainId: number]: string };
  startBlocks: { [chainId: number]: number };
  batchSize: number;
  pollInterval: number;
  targetWallets: string[];
}

class RPCIndexer {
  private providers: { [chainId: number]: ethers.providers.JsonRpcProvider } = {};
  private config: IndexerConfig;
  private db?: Pool;

  constructor(config: IndexerConfig) {
    this.config = config;
    this.initializeProviders();
    this.initializeDatabase();
  }

  private initializeProviders() {
    for (const [chainId, rpcUrl] of Object.entries(this.config.rpcUrls)) {
      this.providers[parseInt(chainId)] = new ethers.providers.JsonRpcProvider(rpcUrl);
    }
  }

  private async initializeDatabase() {
    try {
      if (process.env.DATABASE_URL) {
        this.db = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
        await this.db.query(`
          CREATE TABLE IF NOT EXISTS canonical_events (
            id SERIAL PRIMARY KEY,
            wallet_address VARCHAR(42) NOT NULL,
            event_type VARCHAR(50) NOT NULL,
            chain_id INTEGER NOT NULL,
            timestamp BIGINT NOT NULL,
            value VARCHAR(100) NOT NULL,
            from_address VARCHAR(42),
            to_address VARCHAR(42),
            tx_hash VARCHAR(66) NOT NULL,
            block_number BIGINT NOT NULL,
            protocol VARCHAR(100),
            pool VARCHAR(100),
            asset VARCHAR(100),
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log('✅ Database initialized');
      }
    } catch (error) {
      console.log('⚠ Database connection failed, using file storage');
    }
  }

  async indexWallet(walletAddress: string, chainId: number): Promise<CanonicalEvent[]> {
    const provider = this.providers[chainId];
    if (!provider) {
      throw new Error(Provider not found for chain ${chainId});
    }

    const events: CanonicalEvent[] = [];
    const startBlock = this.config.startBlocks[chainId] || 0;
    const latestBlock = await provider.getBlockNumber();

    console.log(🔍 Indexing wallet ${walletAddress} on chain ${chainId});
    console.log(`   From block ${startBlock} to ${latestBlock}`);

    // Get ERC20 transfers
    const transferFilter = {
      fromBlock: startBlock,
      toBlock: latestBlock,
      topics: [
        ethers.utils.id("Transfer(address,address,uint256)"),
        null,
        ethers.utils.hexZeroPad(walletAddress, 32)
      ]
    };

    try {
      const transferLogs = await provider.getLogs(transferFilter);
      
      for (const log of transferLogs) {
        const parsed = ethers.utils.defaultAbiCoder.decode(
          ['address', 'address', 'uint256'],
          log.data
        );
        
        const block = await provider.getBlock(log.blockNumber);
        
        events.push({
          type: 'transfer',
          chainId,
          timestamp: block.timestamp,
          value: parsed[2].toString(),
          from: parsed[0],
          to: parsed[1],
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          metadata: {
            tokenAddress: log.address,
            logIndex: log.logIndex
          }
        });
      }
    } catch (error) {
      console.log(⚠ Error fetching transfers: ${error});
    }

    // Get native token transfers (ETH, MATIC, etc.)
    try {
      const balanceHistory = await this.getBalanceHistory(provider, walletAddress, startBlock, latestBlock);
      events.push(...balanceHistory);
    } catch (error) {
      console.log(⚠ Error fetching balance history: ${error});
    }

    // Mock staking and lending events for demo
    const mockEvents = this.generateMockEvents(walletAddress, chainId, startBlock, latestBlock);
    events.push(...mockEvents);

    console.log(✅ Indexed ${events.length} events for wallet ${walletAddress});
    return events;
  }

  private async getBalanceHistory(
    provider: ethers.providers.JsonRpcProvider,
    address: string,
    fromBlock: number,
    toBlock: number
  ): Promise<CanonicalEvent[]> {
    const events: CanonicalEvent[] = [];
    const step = 1000; // Check every 1000 blocks
    
    for (let block = fromBlock; block <= toBlock; block += step) {
      try {
        const balance = await provider.getBalance(address, block);
        if (balance.gt(0)) {
          const blockData = await provider.getBlock(block);
          events.push({
            type: 'balance_check',
            chainId: (await provider.getNetwork()).chainId,
            timestamp: blockData.timestamp,
            value: balance.toString(),
            from: address,
            txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
            blockNumber: block
          });
        }
      } catch (error) {
        // Skip failed blocks
        continue;
      }
    }
    
    return events;
  }

  private generateMockEvents(walletAddress: string, chainId: number, fromBlock: number, toBlock: number): CanonicalEvent[] {
    const events: CanonicalEvent[] = [];
    const protocols = ['Aave', 'Compound', 'Lido', 'Rocket Pool'];
    const pools = ['USDC', 'DAI', 'ETH', 'MATIC'];
    
    // Generate mock staking events
    for (let i = 0; i < 3; i++) {
      const blockNumber = fromBlock + Math.floor(Math.random() * (toBlock - fromBlock));
      events.push({
        type: 'stake',
        chainId,
        timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 30), // Last 30 days
        value: (Math.random() * 10).toFixed(18),
        from: walletAddress,
        txHash: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
        blockNumber,
        pool: pools[Math.floor(Math.random() * pools.length)]
      });
    }
    
    // Generate mock lending events
    for (let i = 0; i < 2; i++) {
      const blockNumber = fromBlock + Math.floor(Math.random() * (toBlock - fromBlock));
      events.push({
        type: 'lending_repay',
        chainId,
        timestamp: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400 * 30),
        value: (Math.random() * 1000).toFixed(18),
        from: walletAddress,
        txHash: ethers.utils.hexlify(ethers.utils.randomBytes(32)),
        blockNumber,
        protocol: protocols[Math.floor(Math.random() * protocols.length)]
      });
    }
    
    return events;
  }

  async saveEvents(walletAddress: string, events: CanonicalEvent[]) {
    if (this.db) {
      // Save to database
      for (const event of events) {
        await this.db!.query(`
          INSERT INTO canonical_events 
          (wallet_address, event_type, chain_id, timestamp, value, from_address, to_address, tx_hash, block_number, protocol, pool, asset, metadata)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `, [
          walletAddress,
          event.type,
          event.chainId,
          event.timestamp,
          event.value,
          event.from,
          event.to,
          event.txHash,
          event.blockNumber,
          event.protocol,
          event.pool,
          event.asset,
          JSON.stringify(event.metadata || {})
        ]);
      }
      console.log(💾 Saved ${events.length} events to database);
    } else {
      // Save to file
      const filename = canonical_events_${walletAddress}_${Date.now()}.json;
      const data = {
        user: walletAddress,
        events: events,
        indexedAt: new Date().toISOString(),
        chainIds: [...new Set(events.map(e => e.chainId))]
      };
      
      writeFileSync(filename, JSON.stringify(data, null, 2));
      console.log(💾 Saved ${events.length} events to ${filename});
    }
  }

  async exportCanonicalEvents(walletAddress: string): Promise<CanonicalEvent[]> {
    if (this.db) {
      const result = await this.db.query(`
        SELECT * FROM canonical_events 
        WHERE wallet_address = $1 
        ORDER BY timestamp DESC
      `, [walletAddress]);
      
      return result.rows.map(row => ({
        type: row.event_type,
        chainId: row.chain_id,
        timestamp: parseInt(row.timestamp),
        value: row.value,
        from: row.from_address,
        to: row.to_address,
        txHash: row.tx_hash,
        blockNumber: parseInt(row.block_number),
        protocol: row.protocol,
        pool: row.pool,
        asset: row.asset,
        metadata: row.metadata
      }));
    } else {
      // Read from most recent file
      const files = require('fs').readdirSync('.').filter(f => f.startsWith(canonical_events_${walletAddress}));
      if (files.length === 0) {
        throw new Error(No events found for wallet ${walletAddress});
      }
      
      const latestFile = files.sort().reverse()[0];
      const data = JSON.parse(readFileSync(latestFile, 'utf8'));
      return data.events;
    }
  }

  async startPolling() {
    console.log('🔄 Starting continuous polling...');
    
    setInterval(async () => {
      for (const wallet of this.config.targetWallets) {
        for (const chainId of Object.keys(this.config.rpcUrls).map(Number)) {
          try {
            const events = await this.indexWallet(wallet, chainId);
            await this.saveEvents(wallet, events);
          } catch (error) {
            console.error(❌ Error indexing wallet ${wallet} on chain ${chainId}:, error);
          }
        }
      }
    }, this.config.pollInterval);
  }
}

// CLI setup
const program = new Command();

program
  .name('rpc-indexer')
  .description('OnChainCred RPC-based indexer')
  .version('1.0.0');

program
  .command('index')
  .description('Index a specific wallet')
  .requiredOption('-w, --wallet <address>', 'Wallet address to index')
  .option('-c, --chain <id>', 'Chain ID to index', '1')
  .action(async (options) => {
    const config: IndexerConfig = {
      rpcUrls: {
        1: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo',
        137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
      },
      startBlocks: {
        1: parseInt(process.env.ETHEREUM_START_BLOCK || '17000000'),
        137: parseInt(process.env.POLYGON_START_BLOCK || '40000000')
      },
      batchSize: 1000,
      pollInterval: 60000,
      targetWallets: [options.wallet]
    };

    const indexer = new RPCIndexer(config);
    const events = await indexer.indexWallet(options.wallet, parseInt(options.chain));
    await indexer.saveEvents(options.wallet, events);
    
    console.log(✅ Indexing complete. Found ${events.length} events.);
  });

program
  .command('poll')
  .description('Start continuous polling')
  .option('-w, --wallets <addresses>', 'Comma-separated wallet addresses', '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
  .action(async (options) => {
    const wallets = options.wallets.split(',');
    
    const config: IndexerConfig = {
      rpcUrls: {
        1: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.alchemyapi.io/v2/demo',
        137: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com'
      },
      startBlocks: {
        1: parseInt(process.env.ETHEREUM_START_BLOCK || '17000000'),
        137: parseInt(process.env.POLYGON_START_BLOCK || '40000000')
      },
      batchSize: 1000,
      pollInterval: 60000,
      targetWallets: wallets
    };

    const indexer = new RPCIndexer(config);
    await indexer.startPolling();
  });

program
  .command('export')
  .description('Export canonical events for a wallet')
  .requiredOption('-w, --wallet <address>', 'Wallet address to export')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    const config: IndexerConfig = {
      rpcUrls: {},
      startBlocks: {},
      batchSize: 1000,
      pollInterval: 60000,
      targetWallets: []
    };

    const indexer = new RPCIndexer(config);
    const events = await indexer.exportCanonicalEvents(options.wallet);
    
    if (options.output) {
      writeFileSync(options.output, JSON.stringify({ user: options.wallet, events }, null, 2));
      console.log(💾 Exported ${events.length} events to ${options.output});
    } else {
      console.log(JSON.stringify({ user: options.wallet, events }, null, 2));
    }
  });

if (require.main === module) {
  program.parse();
}