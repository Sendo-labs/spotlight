use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;

#[derive(Accounts)]
#[instruction(
	spot_id: String,
	auction_duration: u64,
)]
pub struct InitSpot<'info> {
	#[account(
		mut,
	)]
	pub fee_payer: Signer<'info>,

	#[account(
		init,
		space=8 + 4 + 32 + 32 + 8 + 8 + 8 + 1 + 32 + 8 + 8 + 1 + 1 + 4 + 32 + 4 + 32 + 4 + 32 + 4 + 32, // 337 bytes total
		payer=fee_payer,
		seeds = [
			b"spot_state",
			spot_id.as_bytes().as_ref(),
		],
		bump,
	)]
	pub spot_state: Account<'info, SpotState>,

	#[account(
		init,
		space=8 + 4 + 32 + 8 + 8 + 1, // discriminator + spot_id (4 + 32) + total_deposited + total_withdrawn + bump
		payer=fee_payer,
		seeds = [
			b"escrow_vault",
			spot_id.as_bytes().as_ref(),
		],
		bump,
	)]
	pub escrow_vault: Account<'info, EscrowVault>,

	pub admin: Signer<'info>,

	pub system_program: Program<'info, System>,
}

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
pub fn handler(
	ctx: Context<InitSpot>,
	spot_id: String,
	auction_duration: u64,
) -> Result<()> {
    // Validate spot_id
    if spot_id.is_empty() {
        return err!(SendoSpotlightError::InvalidSpotId);
    }

    // Set up spot state
    ctx.accounts.spot_state.spot_id = spot_id.clone();
    ctx.accounts.spot_state.admin = ctx.accounts.admin.key();
    ctx.accounts.spot_state.auction_start_time = Clock::get()?.unix_timestamp;
    ctx.accounts.spot_state.auction_end_time = Clock::get()?.unix_timestamp + auction_duration as i64;
    ctx.accounts.spot_state.current_bid = 0;
    ctx.accounts.spot_state.current_bidder = None;
    ctx.accounts.spot_state.total_bids = 0;
    ctx.accounts.spot_state.total_refunded = 0;
    ctx.accounts.spot_state.is_settled = false;
    ctx.accounts.spot_state.bump = ctx.bumps.spot_state;

    // Set up escrow vault
    ctx.accounts.escrow_vault.spot_id = spot_id;
    ctx.accounts.escrow_vault.total_deposited = 0;
    ctx.accounts.escrow_vault.total_withdrawn = 0;
    ctx.accounts.escrow_vault.bump = ctx.bumps.escrow_vault;

    Ok(())
}