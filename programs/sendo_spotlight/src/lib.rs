pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod events;

use anchor_lang::prelude::*;
use std::str::FromStr;

pub use constants::*;
pub use instructions::*;
pub use state::*;
pub use events::*;
pub use error::*;

declare_id!("7DYhVLgmNUY4Lk27pZtZSghoixPG2ueCzBVarHHSF6ud");

#[program]
pub mod sendo_spotlight {
    use super::*;

    /// Initialize a new auction spot
    ///
    /// Accounts:
    /// 0. `[writable, signer]` fee_payer: [AccountInfo] 
    /// 1. `[writable]` spot_state: [SpotState] 
    /// 2. `[writable]` escrow_vault: [EscrowVault] 
    /// 3. `[signer]` admin: [AccountInfo] Admin account with permission to initialize spots
    /// 4. `[]` system_program: [AccountInfo] Auto-generated, for account initialization
    ///
    /// Data:
    /// - spot_id: [String] Identifier for the spot (e.g., "A" or "B")
    /// - auction_duration: [u64] Duration of auction in seconds
    pub fn init_spot(ctx: Context<InitSpot>, spot_id: String, auction_duration: u64) -> Result<()> {
        init_spot::handler(ctx, spot_id, auction_duration)
    }

    /// Place a bid on an auction spot
    ///
    /// Accounts:
    /// 0. `[writable, signer]` fee_payer: [AccountInfo] 
    /// 1. `[writable]` spot_state: [SpotState] 
    /// 2. `[writable]` escrow_vault: [EscrowVault] 
    /// 3. `[signer]` bidder: [AccountInfo] Account placing the bid
    ///
    /// Data:
    /// - spot_id: [String] Identifier for the spot (e.g., "A" or "B")
    /// - amount: [u64] Amount to bid in lamports
    pub fn place_bid(ctx: Context<PlaceBid>, spot_id: String, amount: u64) -> Result<()> {
        place_bid::handler(ctx, spot_id, amount)
    }

    /// Settle an auction spot and distribute funds
    ///
    /// Accounts:
    /// 0. `[writable, signer]` fee_payer: [AccountInfo] 
    /// 1. `[writable]` spot_state: [SpotState] 
    /// 2. `[writable]` escrow_vault: [EscrowVault] 
    /// 3. `[signer]` admin: [AccountInfo] Admin account with permission to settle spots
    ///
    /// Data:
    /// - spot_id: [String] Identifier for the spot (e.g., "A" or "B")
    pub fn settle(ctx: Context<Settle>, spot_id: String) -> Result<()> {
        settle::handler(ctx, spot_id)
    }
}