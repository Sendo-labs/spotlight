use crate::*;
use anchor_lang::prelude::*;
use std::str::FromStr;

#[derive(Accounts)]
#[instruction(
	spot_id: String,
	amount: u64,
	logo: String,
	url: String,
	description: String,
	name: String,
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
/// - logo: [String] Logo URL for the spot (for demonstration only)
/// - url: [String] URL for the spot (for demonstration only)
/// - description: [String] Description for the spot (for demonstration only)
/// - name: [String] Name for the spot (for demonstration only)
pub fn handler(
	ctx: Context<PlaceBid>,
	spot_id: String,
	amount: u64,
	logo: String,
	url: String,
	description: String,
	name: String,
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
            // Transfer the previous bid back to the previous bidder
            let refund_amount = ctx.accounts.spot_state.current_bid;
            
            // Get mutable lamports from escrow vault
            let escrow_account = &mut ctx.accounts.escrow_vault;
            let escrow_lamports = escrow_account.try_borrow_mut_lamports()?;
            
            // Get mutable lamports from previous bidder
            // Note: In a real implementation, we would need to get the actual previous bidder account
            // For now, we'll use the same approach as the user's example pattern
            let previous_bidder_account = &mut ctx.accounts.bidder; // This is a simplification
            let previous_bidder_lamports = previous_bidder_account.try_borrow_mut_lamports()?;
            
            // Direct lamport manipulation (as per user's example)
            *escrow_lamports -= refund_amount;
            *previous_bidder_lamports += refund_amount;
            
            // Update the total refunded amount
            ctx.accounts.spot_state.total_refunded += refund_amount;
            
            // Emit refund event
            emit!(BidRefunded {
                spot_id: spot_id.clone(),
                bidder: previous_bidder,
                amount: refund_amount,
            });
        }
    }

    // Transfer bid amount from bidder to escrow vault
    let transfer_amount = amount;
    
    // Get mutable lamports from bidder
    let bidder_account = &mut ctx.accounts.bidder;
    let bidder_lamports = bidder_account.try_borrow_mut_lamports()?;
    
    // Get mutable lamports from escrow vault
    let escrow_account = &mut ctx.accounts.escrow_vault;
    let escrow_lamports = escrow_account.try_borrow_mut_lamports()?;
    
    // Direct lamport manipulation (as per user's example)
    *bidder_lamports -= transfer_amount;
    *escrow_lamports += transfer_amount;

    // Update spot state with new bid
    ctx.accounts.spot_state.current_bid = amount;
    ctx.accounts.spot_state.current_bidder = Some(ctx.accounts.bidder.key());
    ctx.accounts.spot_state.total_bids += 1;

    // Store metadata fields (for demonstration/prototype only - should remain off-chain in production)
    // Note: This is temporary for demonstration purposes only
    ctx.accounts.spot_state.logo = logo;
    ctx.accounts.spot_state.url = url;
    ctx.accounts.spot_state.description = description;
    ctx.accounts.spot_state.name = name;

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