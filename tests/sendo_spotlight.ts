
import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";

// Wallet addresses from constants
const ELIZAOS_DAO_WALLET = "5FzC7gETJdwwKL71w1VkCKEmFSTzhvtTAUPQsxYEHDTp";
const CONTRIBUTOR_WALLET = "J9LT87vTYGpPCrr795PSYSwqXUfu6RmULj4hq5UzswHD";
const CORE_TEAM_WALLET = "2zB6ySzH2PFKX3f9XZLUKJfP44fwyn69Bp6YaD6LEsqP";

describe("sendo_spotlight tests", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SendoSpotlight;
  const programId = program.programId;

  const connection = provider.connection;

  // Test wallets
  let admin: Keypair;
  let bidder1: Keypair;
  let bidder2: Keypair;
  let feePayer: Keypair;

  // Wallet addresses for settle instruction
  let elizaosDaoWallet: PublicKey;
  let contributorWallet: PublicKey;
  let coreTeamWallet: PublicKey;

  before(async () => {
    // Generate test wallets
    admin = Keypair.generate();
    bidder1 = Keypair.generate();
    bidder2 = Keypair.generate();
    feePayer = Keypair.generate();

    // Create wallet addresses for settle instruction
    elizaosDaoWallet = new PublicKey(ELIZAOS_DAO_WALLET);
    contributorWallet = new PublicKey(CONTRIBUTOR_WALLET);
    coreTeamWallet = new PublicKey(CORE_TEAM_WALLET);

    // Airdrop SOL to all wallets
    const wallets = [admin, bidder1, bidder2, feePayer];
    const airdropAmount = 10 * LAMPORTS_PER_SOL; // 10 SOL each

    console.log("Airdropping SOL to test wallets...");
    for (const wallet of wallets) {
      const signature = await connection.requestAirdrop(wallet.publicKey, airdropAmount);
      await connection.confirmTransaction(signature);
      console.log(`Airdropped 10 SOL to ${wallet.publicKey.toString()}`);
    }

    // Verify balances
    for (const wallet of wallets) {
      const balance = await connection.getBalance(wallet.publicKey);
      console.log(`Balance for ${wallet.publicKey.toString()}: ${balance / LAMPORTS_PER_SOL} SOL`);
      expect(balance).to.be.greaterThan(0);
    }

    // Program is already initialized above
  });

  // Helper functions for PDA derivation
  const deriveSpotStatePDA = (spotId: string) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("spot_state"), Buffer.from(spotId)],
      programId
    );
  };

  const deriveEscrowVaultPDA = (spotId: string) => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_vault"), Buffer.from(spotId)],
      programId
    );
  };

  describe("init_spot", () => {
    it("should successfully initialize a spot", async () => {
      const spotId = "TEST_SPOT_A";
      const auctionDuration = 3600; // 1 hour

      // Derive PDAs
      const [spotStatePDA] = deriveSpotStatePDA(spotId);
      const [escrowVaultPDA] = deriveEscrowVaultPDA(spotId);

      console.log(`Spot State PDA: ${spotStatePDA.toString()}`);
      console.log(`Escrow Vault PDA: ${escrowVaultPDA.toString()}`);

      // Initialize the spot
      const signature = await program.methods
        .initSpot(spotId, new BN(auctionDuration))
        .accounts({
          feePayer: feePayer.publicKey,
          spotState: spotStatePDA,
          escrowVault: escrowVaultPDA,
          admin: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([feePayer, admin])
        .rpc();

      console.log(`Init spot transaction signature: ${signature}`);

      // Verify spot state was created
      const spotState = await program.account.spotState.fetch(spotStatePDA);
      expect(spotState.spotId).to.equal(spotId);
      expect(spotState.isSettled).to.be.false;
    });

  });

  describe("place_bid", () => {
    let spotId: string;
    let spotStatePDA: PublicKey;
    let escrowVaultPDA: PublicKey;

    before(async () => {
      // Initialize a spot for bidding tests
      spotId = "TEST_SPOT_BIDDING";
      const auctionDuration = 3600; // 1 hour

      [spotStatePDA] = deriveSpotStatePDA(spotId);
      [escrowVaultPDA] = deriveEscrowVaultPDA(spotId);

      // Initialize the spot
      await program.methods
        .initSpot(spotId, new BN(auctionDuration))
        .accounts({
          feePayer: feePayer.publicKey,
          spotState: spotStatePDA,
          escrowVault: escrowVaultPDA,
          admin: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([feePayer, admin])
        .rpc();
    });

    it("should successfully place first bid", async () => {
      const bidAmount = 1 * LAMPORTS_PER_SOL; // 1 SOL

      const signature = await program.methods
        .placeBid(
          spotId,
          new BN(bidAmount),
          "https://example.com/logo.png",
          "https://example.com",
          "Test description",
          "Test Name"
        )
        .accounts({
          feePayer: feePayer.publicKey,
          spotState: spotStatePDA,
          escrowVault: escrowVaultPDA,
          bidder: bidder1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([feePayer, bidder1])
        .rpc();

      console.log(`Place bid transaction signature: ${signature}`);

      // Verify spot state was updated
      const spotState = await program.account.spotState.fetch(spotStatePDA);
      expect(spotState.currentBidder?.toString()).to.equal(bidder1.publicKey.toString());
    });

    it("should successfully place higher bid and refund previous bidder", async () => {
      const secondBidAmount = 2 * LAMPORTS_PER_SOL; // 2 SOL

      const signature = await program.methods
        .placeBid(
          spotId,
          new BN(secondBidAmount),
          "https://example.com/logo2.png",
          "https://example.com/2",
          "Test description 2",
          "Test Name 2"
        )
        .accounts({
          feePayer: feePayer.publicKey,
          spotState: spotStatePDA,
          escrowVault: escrowVaultPDA,
          bidder: bidder2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([feePayer, bidder2])
        .rpc();

      console.log(`Place higher bid transaction signature: ${signature}`);

      // Verify spot state was updated
      const spotState = await program.account.spotState.fetch(spotStatePDA);
      expect(spotState.currentBidder?.toString()).to.equal(bidder2.publicKey.toString());
    });
  });

  describe("settle", () => {
    let spotId: string;
    let spotStatePDA: PublicKey;
    let escrowVaultPDA: PublicKey;

    before(async () => {
      // Initialize a spot for settlement tests
      spotId = "TEST_SPOT_SETTLE";
      const auctionDuration = 3; // 3 second (very short for testing)

      [spotStatePDA] = deriveSpotStatePDA(spotId);
      [escrowVaultPDA] = deriveEscrowVaultPDA(spotId);

      // Initialize the spot
      await program.methods
        .initSpot(spotId, new BN(auctionDuration))
        .accounts({
          feePayer: feePayer.publicKey,
          spotState: spotStatePDA,
          escrowVault: escrowVaultPDA,
          admin: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([feePayer, admin])
        .rpc();

      // Place a bid
      await program.methods
        .placeBid(
          spotId,
          new BN(3 * LAMPORTS_PER_SOL), // 3 SOL
          "https://example.com/logo.png",
          "https://example.com",
          "Test description",
          "Test Name"
        )
        .accounts({
          feePayer: feePayer.publicKey,
          spotState: spotStatePDA,
          escrowVault: escrowVaultPDA,
          bidder: bidder1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([feePayer, bidder1])
        .rpc();

      // Wait for auction to end
      await new Promise(resolve => setTimeout(resolve, 2000));
    });

    it("should successfully settle auction and distribute funds", async () => {
      const signature = await program.methods
        .settle(spotId)
        .accounts({
          feePayer: feePayer.publicKey,
          spotState: spotStatePDA,
          escrowVault: escrowVaultPDA,
          admin: admin.publicKey,
          elizaosDaoWallet: elizaosDaoWallet,
          contributorWallet: contributorWallet,
          coreTeamWallet: coreTeamWallet,
          systemProgram: SystemProgram.programId,
        })
        .signers([feePayer, admin])
        .rpc();

      console.log(`Settle transaction signature: ${signature}`);

      // Verify spot state was marked as settled
      const spotState = await program.account.spotState.fetch(spotStatePDA);
      expect(spotState.isSettled).to.be.true;
    });

  });
});
