use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;

#[derive(Accounts)]
#[instruction(
	spot_id: String,
	amount: u64,
)]
pub struct PlaceBid<'info> {
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

	pub bidder: Signer<'info>,
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
pub fn handler(
	ctx: Context<PlaceBid>,
	spot_id: String,
	amount: u64,
) -> Result<()> {
    // Validate spot_id
    if spot_id.is_empty() {
        return err!(SendoSpotlightError::InvalidSpotId);
    }

    // Validate bid amount
    if amount == 0 {
        return err!(SendoSpotlightError::InvalidBidAmount);
    }

    // Check if auction is active
    let current_time = Clock::get()?.unix_timestamp;
    if current_time < ctx.accounts.spot_state.auction_start_time {
        return err!(SendoSpotlightError::AuctionNotActive);
    }

    if current_time > ctx.accounts.spot_state.auction_end_time {
        return err!(SendoSpotlightError::AuctionNotActive);
    }

    // Check if auction is already settled
    if ctx.accounts.spot_state.is_settled {
        return err!(SendoSpotlightError::AuctionAlreadySettled);
    }

    // Check if bid amount is sufficient
    if amount <= ctx.accounts.spot_state.current_bid {
        return err!(SendoSpotlightError::InsufficientBid);
    }

    // Refund previous bidder if exists
    if let Some(previous_bidder) = ctx.accounts.spot_state.current_bidder {
        if previous_bidder != ctx.accounts.bidder.key() {
            // In a real implementation, you would transfer the previous bid back to the previous bidder
            // This is a simplified version that just records the refund
            ctx.accounts.spot_state.total_refunded += ctx.accounts.spot_state.current_bid;
            
            // Emit refund event
            emit!(BidRefunded {
                spot_id: spot_id.clone(),
                bidder: previous_bidder,
                amount: ctx.accounts.spot_state.current_bid,
            });
        }
    }

    // Update spot state with new bid
    ctx.accounts.spot_state.current_bid = amount;
    ctx.accounts.spot_state.current_bidder = Some(ctx.accounts.bidder.key());
    ctx.accounts.spot_state.total_bids += 1;

    // Update escrow vault
    ctx.accounts.escrow_vault.total_deposited += amount;

    // Emit event
    emit!(BidPlaced {
        spot_id: spot_id.clone(),
        bidder: ctx.accounts.bidder.key(),
        amount,
    });

    Ok(())
}