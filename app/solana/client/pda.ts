import {PublicKey} from "@solana/web3.js";
import BN from "bn.js";

export type SpotStateSeeds = {
    spotId: string, 
};

export const deriveSpotStatePDA = (
    seeds: SpotStateSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("spot_state"),
            Buffer.from(seeds.spotId, "utf8"),
        ],
        programId,
    )
};

export type EscrowVaultSeeds = {
    spotId: string, 
};

export const deriveEscrowVaultPDA = (
    seeds: EscrowVaultSeeds,
    programId: PublicKey
): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
        [
            Buffer.from("escrow_vault"),
            Buffer.from(seeds.spotId, "utf8"),
        ],
        programId,
    )
};

