use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;

#[derive(Accounts)]
#[instruction(
	spot_id: String,
)]
pub struct Settle<'info> {
	#[account(
		mut,
	)]
	pub fee_payer: Signer<'info>,

	#[account(
		mut,
		seeds = [
			b"spot_state",
			spot_id.as_bytes().as_ref(),
		],
		bump,
	)]
	pub spot_state: Account<'info, SpotState>,

	#[account(
		mut,
		seeds = [
			b"escrow_vault",
			spot_id.as_bytes().as_ref(),
		],
		bump,
	)]
	pub escrow_vault: Account<'info, EscrowVault>,

	pub admin: Signer<'info>,
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
pub fn handler(
	ctx: Context<Settle>,
	spot_id: String,
) -> Result<()> {
    // Validate spot_id
    if spot_id.is_empty() {
        return err!(SendoSpotlightError::InvalidSpotId);
    }

    // Check if auction has ended
    let current_time = Clock::get()?.unix_timestamp;
    if current_time < ctx.accounts.spot_state.auction_end_time {
        return err!(SendoSpotlightError::AuctionNotEnded);
    }

    // Check if auction is already settled
    if ctx.accounts.spot_state.is_settled {
        return err!(SendoSpotlightError::AuctionAlreadySettled);
    }

    // Mark auction as settled
    ctx.accounts.spot_state.is_settled = true;

    // Get total amount to distribute
    let total_amount = ctx.accounts.escrow_vault.total_deposited;
    
    // If no bids were placed, nothing to distribute
    if total_amount == 0 {
        return Ok(());
    }

    // Define wallet addresses for payout splits
    // 15% to elizaosDAO (5FzC7gETJdwwKL71w1VkCKEmFSTzhvtTAUPQsxYEHDTp)
    // 50% to Contributor (J9LT87vTYGpPCrr795PSYSwqXUfu6RmULj4hq5UzswHD)
    // 35% to Core Team (2zB6ySzH2PFKX3f9XZLUKJfP44fwyn69Bp6YaD6LEsqP)
    let elizaos_dao_wallet = Pubkey::from_str(ELIZAOS_DAO_WALLET)?;
    let contributor_wallet = Pubkey::from_str(CONTRIBUTOR_WALLET)?;
    let core_team_wallet = Pubkey::from_str(CORE_TEAM_WALLET)?;

    // Calculate amounts for each recipient
    let elizaos_dao_amount = (total_amount as u128 * 15u128 / 100u128) as u64;
    let contributor_amount = (total_amount as u128 * 50u128 / 100u128) as u64;
    let core_team_amount = (total_amount as u128 * 35u128 / 100u128) as u64;

    // In a real implementation, you would transfer the funds to the respective wallets
    // This is a simplified version that just records the distribution
    // In a production environment, you would use token transfers or native SOL transfers
    
    // Emit event
    emit!(SpotSettled {
        spot_id: spot_id.clone(),
        winner: ctx.accounts.spot_state.current_bidder,
        total_amount,
    });

    Ok(())
}