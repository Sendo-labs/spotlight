import { AnchorProvider } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  type AccountMeta,
  type TransactionInstruction,
  type TransactionSignature,
} from "@solana/web3.js";
import { useCallback, useState, useEffect } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import * as programClient from "~/solana/client";

// Props interface for the useProgram hook
export interface UseProgramProps {
  // Optional override for the VITE_SOLANA_PROGRAM_ID env var
  programId?: string;
}

// Error structure returned from sendAndConfirmTx if transaction fails
type SendAndConfirmTxError = {
  message: string;
  logs: string[];
  stack: string | undefined;
};

// Result structure returned from sendAndConfirmTx
type SendAndConfirmTxResult = {
  // Signature of successful transaction
  signature?: string;

  // Error details if transaction fails
  error?: SendAndConfirmTxError;
};

// Helper function to send and confirm a transaction, with error handling
const sendAndConfirmTx = async (
  fn: () => Promise<TransactionSignature>,
): Promise<SendAndConfirmTxResult> => {
  try {
    const signature = await fn();
    return {
      signature,
    };
  } catch (e: any) {
    let message = `An unknown error occurred: ${e}`;
    let logs = [];
    let stack = "";

    if ("logs" in e && e.logs instanceof Array) {
      logs = e.logs;
    }

    if ("stack" in e) {
      stack = e.stack;
    }

    if ("message" in e) {
      message = e.message;
    }

    return {
      error: {
        logs,
        stack,
        message,
      },
    };
  }
};

const useProgram = (props?: UseProgramProps | undefined) => {
  const [programId, setProgramId] = useState<PublicKey|undefined>(undefined)
  const { connection } = useConnection();

  useEffect(() => {
    let prgId = import.meta.env.VITE_SOLANA_PROGRAM_ID as string | undefined;

    if (props?.programId) {
      prgId = props.programId;
    }

    if (!prgId) {
      throw new Error(
        "the program id must be provided either by the useProgram props or the env var VITE_SOLANA_PROGRAM_ID",
      );
    }

    const pid = new PublicKey(prgId)
    setProgramId(pid)
    programClient.initializeClient(pid, new AnchorProvider(connection));
  }, [props?.programId, connection.rpcEndpoint]);

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const initSpot = useCallback(programClient.initSpot, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const initSpotSendAndConfirm = useCallback(async (
    args: Omit<programClient.InitSpotArgs, "feePayer" | "admin"> & {
    signers: {
        feePayer: Keypair,
        admin: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.initSpotSendAndConfirm(args, remainingAccounts)), [])

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const placeBid = useCallback(programClient.placeBid, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const placeBidSendAndConfirm = useCallback(async (
    args: Omit<programClient.PlaceBidArgs, "feePayer" | "bidder"> & {
    signers: {
        feePayer: Keypair,
        bidder: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.placeBidSendAndConfirm(args, remainingAccounts)), [])

  /**
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
   *
   * @returns {@link TransactionInstruction}
   */
  const settle = useCallback(programClient.settle, [])

  /**
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
   *
   * @returns {@link SendAndConfirmTxResult}
   */
  const settleSendAndConfirm = useCallback(async (
    args: Omit<programClient.SettleArgs, "feePayer" | "admin"> & {
    signers: {
        feePayer: Keypair,
        admin: Keypair,
    }}, 
    remainingAccounts: Array<AccountMeta> = []
  ): Promise<SendAndConfirmTxResult> => sendAndConfirmTx(() => programClient.settleSendAndConfirm(args, remainingAccounts)), [])


  const getSpotState = useCallback(programClient.getSpotState, [])
  const getEscrowVault = useCallback(programClient.getEscrowVault, [])

  const deriveSpotState = useCallback(programClient.deriveSpotStatePDA,[])
  const deriveEscrowVault = useCallback(programClient.deriveEscrowVaultPDA,[])

  return {
	programId,
    initSpot,
    initSpotSendAndConfirm,
    placeBid,
    placeBidSendAndConfirm,
    settle,
    settleSendAndConfirm,
    getSpotState,
    getEscrowVault,
    deriveSpotState,
    deriveEscrowVault,
  };
};

export { useProgram };