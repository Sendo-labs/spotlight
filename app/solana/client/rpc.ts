import BN from "bn.js";
import {
  AnchorProvider,
  type IdlAccounts,
  Program,
  web3,
} from "@coral-xyz/anchor";
import { MethodsBuilder } from "@coral-xyz/anchor/dist/cjs/program/namespace/methods";
import type { SendoSpotlight } from "../../../target/types/sendo_spotlight";
import idl from "../../../target/idl/sendo_spotlight.json";
import * as pda from "./pda";



let _program: Program<SendoSpotlight>;


export const initializeClient = (
    programId: web3.PublicKey,
    anchorProvider = AnchorProvider.env(),
) => {
    _program = new Program<SendoSpotlight>(
        idl as SendoSpotlight,
        anchorProvider,
    );


};

export type InitSpotArgs = {
  feePayer: web3.PublicKey;
  admin: web3.PublicKey;
  spotId: string;
  auctionDuration: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Initialize a new auction spot
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` spot_state: {@link SpotState} 
 * 2. `[writable]` escrow_vault: {@link EscrowVault} 
 * 3. `[signer]` admin: {@link PublicKey} Admin account with permission to initialize spots
 * 4. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - spot_id: {@link string} Identifier for the spot (e.g., "A" or "B")
 * - auction_duration: {@link BigInt} Duration of auction in seconds
 */
export const initSpotBuilder = (
	args: InitSpotArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<SendoSpotlight, never> => {
    const [spotStatePubkey] = pda.deriveSpotStatePDA({
        spotId: args.spotId,
    }, _program.programId);
    const [escrowVaultPubkey] = pda.deriveEscrowVaultPDA({
        spotId: args.spotId,
    }, _program.programId);

  return _program
    .methods
    .initSpot(
      args.spotId,
      new BN(args.auctionDuration.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      spotState: spotStatePubkey,
      escrowVault: escrowVaultPubkey,
      admin: args.admin,
      systemProgram: new web3.PublicKey("11111111111111111111111111111111"),
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Initialize a new auction spot
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` spot_state: {@link SpotState} 
 * 2. `[writable]` escrow_vault: {@link EscrowVault} 
 * 3. `[signer]` admin: {@link PublicKey} Admin account with permission to initialize spots
 * 4. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - spot_id: {@link string} Identifier for the spot (e.g., "A" or "B")
 * - auction_duration: {@link BigInt} Duration of auction in seconds
 */
export const initSpot = (
	args: InitSpotArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    initSpotBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Initialize a new auction spot
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` spot_state: {@link SpotState} 
 * 2. `[writable]` escrow_vault: {@link EscrowVault} 
 * 3. `[signer]` admin: {@link PublicKey} Admin account with permission to initialize spots
 * 4. `[]` system_program: {@link PublicKey} Auto-generated, for account initialization
 *
 * Data:
 * - spot_id: {@link string} Identifier for the spot (e.g., "A" or "B")
 * - auction_duration: {@link BigInt} Duration of auction in seconds
 */
export const initSpotSendAndConfirm = async (
  args: Omit<InitSpotArgs, "feePayer" | "admin"> & {
    signers: {
      feePayer: web3.Signer,
      admin: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return initSpotBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      admin: args.signers.admin.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.admin])
    .rpc();
}

export type PlaceBidArgs = {
  feePayer: web3.PublicKey;
  bidder: web3.PublicKey;
  spotId: string;
  amount: bigint;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Place a bid on an auction spot
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` spot_state: {@link SpotState} 
 * 2. `[writable]` escrow_vault: {@link EscrowVault} 
 * 3. `[signer]` bidder: {@link PublicKey} Account placing the bid
 *
 * Data:
 * - spot_id: {@link string} Identifier for the spot (e.g., "A" or "B")
 * - amount: {@link BigInt} Amount to bid in lamports
 */
export const placeBidBuilder = (
	args: PlaceBidArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<SendoSpotlight, never> => {
    const [spotStatePubkey] = pda.deriveSpotStatePDA({
        spotId: args.spotId,
    }, _program.programId);
    const [escrowVaultPubkey] = pda.deriveEscrowVaultPDA({
        spotId: args.spotId,
    }, _program.programId);

  return _program
    .methods
    .placeBid(
      args.spotId,
      new BN(args.amount.toString()),
    )
    .accountsStrict({
      feePayer: args.feePayer,
      spotState: spotStatePubkey,
      escrowVault: escrowVaultPubkey,
      bidder: args.bidder,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Place a bid on an auction spot
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` spot_state: {@link SpotState} 
 * 2. `[writable]` escrow_vault: {@link EscrowVault} 
 * 3. `[signer]` bidder: {@link PublicKey} Account placing the bid
 *
 * Data:
 * - spot_id: {@link string} Identifier for the spot (e.g., "A" or "B")
 * - amount: {@link BigInt} Amount to bid in lamports
 */
export const placeBid = (
	args: PlaceBidArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    placeBidBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Place a bid on an auction spot
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` spot_state: {@link SpotState} 
 * 2. `[writable]` escrow_vault: {@link EscrowVault} 
 * 3. `[signer]` bidder: {@link PublicKey} Account placing the bid
 *
 * Data:
 * - spot_id: {@link string} Identifier for the spot (e.g., "A" or "B")
 * - amount: {@link BigInt} Amount to bid in lamports
 */
export const placeBidSendAndConfirm = async (
  args: Omit<PlaceBidArgs, "feePayer" | "bidder"> & {
    signers: {
      feePayer: web3.Signer,
      bidder: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return placeBidBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      bidder: args.signers.bidder.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.bidder])
    .rpc();
}

export type SettleArgs = {
  feePayer: web3.PublicKey;
  admin: web3.PublicKey;
  spotId: string;
};

/**
 * ### Returns a {@link MethodsBuilder}
 * Settle an auction spot and distribute funds
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` spot_state: {@link SpotState} 
 * 2. `[writable]` escrow_vault: {@link EscrowVault} 
 * 3. `[signer]` admin: {@link PublicKey} Admin account with permission to settle spots
 *
 * Data:
 * - spot_id: {@link string} Identifier for the spot (e.g., "A" or "B")
 */
export const settleBuilder = (
	args: SettleArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): MethodsBuilder<SendoSpotlight, never> => {
    const [spotStatePubkey] = pda.deriveSpotStatePDA({
        spotId: args.spotId,
    }, _program.programId);
    const [escrowVaultPubkey] = pda.deriveEscrowVaultPDA({
        spotId: args.spotId,
    }, _program.programId);

  return _program
    .methods
    .settle(
      args.spotId,
    )
    .accountsStrict({
      feePayer: args.feePayer,
      spotState: spotStatePubkey,
      escrowVault: escrowVaultPubkey,
      admin: args.admin,
    })
    .remainingAccounts(remainingAccounts);
};

/**
 * ### Returns a {@link web3.TransactionInstruction}
 * Settle an auction spot and distribute funds
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` spot_state: {@link SpotState} 
 * 2. `[writable]` escrow_vault: {@link EscrowVault} 
 * 3. `[signer]` admin: {@link PublicKey} Admin account with permission to settle spots
 *
 * Data:
 * - spot_id: {@link string} Identifier for the spot (e.g., "A" or "B")
 */
export const settle = (
	args: SettleArgs,
	remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionInstruction> =>
    settleBuilder(args, remainingAccounts).instruction();

/**
 * ### Returns a {@link web3.TransactionSignature}
 * Settle an auction spot and distribute funds
 *
 * Accounts:
 * 0. `[writable, signer]` fee_payer: {@link PublicKey} 
 * 1. `[writable]` spot_state: {@link SpotState} 
 * 2. `[writable]` escrow_vault: {@link EscrowVault} 
 * 3. `[signer]` admin: {@link PublicKey} Admin account with permission to settle spots
 *
 * Data:
 * - spot_id: {@link string} Identifier for the spot (e.g., "A" or "B")
 */
export const settleSendAndConfirm = async (
  args: Omit<SettleArgs, "feePayer" | "admin"> & {
    signers: {
      feePayer: web3.Signer,
      admin: web3.Signer,
    },
  },
  remainingAccounts: Array<web3.AccountMeta> = [],
): Promise<web3.TransactionSignature> => {
  const preInstructions: Array<web3.TransactionInstruction> = [];


  return settleBuilder({
      ...args,
      feePayer: args.signers.feePayer.publicKey,
      admin: args.signers.admin.publicKey,
    }, remainingAccounts)
    .preInstructions(preInstructions)
    .signers([args.signers.feePayer, args.signers.admin])
    .rpc();
}

// Getters

export const getSpotState = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<SendoSpotlight>["spotState"]> => _program.account.spotState.fetch(publicKey, commitment);

export const getEscrowVault = (
    publicKey: web3.PublicKey,
    commitment?: web3.Commitment
): Promise<IdlAccounts<SendoSpotlight>["escrowVault"]> => _program.account.escrowVault.fetch(publicKey, commitment);
