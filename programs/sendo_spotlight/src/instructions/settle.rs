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

	/// CHECK: ElizaOS DAO wallet for receiving 15% of funds
	#[account(mut)]
	pub elizaos_dao_wallet: SystemAccount<'info>,

	/// CHECK: Contributor wallet for receiving 50% of funds
	#[account(mut)]
	pub contributor_wallet: SystemAccount<'info>,

	/// CHECK: Core team wallet for receiving 35% of funds
	#[account(mut)]
	pub core_team_wallet: SystemAccount<'info>,

	/// CHECK: System program for SOL transfers
	pub system_program: Program<'info, System>,
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

    // Verify that only the admin who created the spot can settle it
    require_keys_eq!(ctx.accounts.admin.key(), ctx.accounts.spot_state.admin, SendoSpotlightError::InvalidAdmin);

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

    // Validate wallet addresses for payout splits
    // 15% to elizaosDAO (5FzC7gETJdwwKL71w1VkCKEmFSTzhvtTAUPQsxYEHDTp)
    // 50% to Contributor (J9LT87vTYGpPCrr795PSYSwqXUfu6RmULj4hq5UzswHD)
    // 35% to Core Team (2zB6ySzH2PFKX3f9XZLUKJfP44fwyn69Bp6YaD6LEsqP)
    let expected_elizaos_dao_wallet = Pubkey::from_str(ELIZAOS_DAO_WALLET).map_err(|_| SendoSpotlightError::InvalidAdmin)?;
    let expected_contributor_wallet = Pubkey::from_str(CONTRIBUTOR_WALLET).map_err(|_| SendoSpotlightError::InvalidAdmin)?;
    let expected_core_team_wallet = Pubkey::from_str(CORE_TEAM_WALLET).map_err(|_| SendoSpotlightError::InvalidAdmin)?;

    // Verify the provided accounts match the expected addresses
    require_keys_eq!(ctx.accounts.elizaos_dao_wallet.key(), expected_elizaos_dao_wallet, SendoSpotlightError::InvalidAdmin);
    require_keys_eq!(ctx.accounts.contributor_wallet.key(), expected_contributor_wallet, SendoSpotlightError::InvalidAdmin);
    require_keys_eq!(ctx.accounts.core_team_wallet.key(), expected_core_team_wallet, SendoSpotlightError::InvalidAdmin);

    // Calculate amounts for each recipient
    let elizaos_dao_amount = (total_amount as u128 * 15u128 / 100u128) as u64;
    let contributor_amount = (total_amount as u128 * 50u128 / 100u128) as u64;
    let core_team_amount = (total_amount as u128 * 35u128 / 100u128) as u64;

    // Transfer funds using direct lamport manipulation
    // Transfer 15% to elizaosDAO
    if elizaos_dao_amount > 0 {
        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= elizaos_dao_amount;
        **ctx.accounts.elizaos_dao_wallet.try_borrow_mut_lamports()? += elizaos_dao_amount;
    }

    // Transfer 50% to Contributor
    if contributor_amount > 0 {
        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= contributor_amount;
        **ctx.accounts.contributor_wallet.try_borrow_mut_lamports()? += contributor_amount;
    }

    // Transfer 35% to Core Team
    if core_team_amount > 0 {
        **ctx.accounts.escrow_vault.to_account_info().try_borrow_mut_lamports()? -= core_team_amount;
        **ctx.accounts.core_team_wallet.try_borrow_mut_lamports()? += core_team_amount;
    }

    // Emit event
    emit!(SpotSettled {
        spot_id: spot_id.clone(),
        winner: ctx.accounts.spot_state.current_bidder,
        total_amount,
    });

    Ok(())
}