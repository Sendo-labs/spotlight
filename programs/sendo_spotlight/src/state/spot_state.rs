use anchor_lang::prelude::*;

#[account]
pub struct SpotState {
	pub spot_id: String,
	pub auction_start_time: i64,
	pub auction_end_time: i64,
	pub current_bid: u64,
	pub current_bidder: Option<Pubkey>,
	pub total_bids: u64,
	pub total_refunded: u64,
	pub is_settled: bool,
	pub bump: u8,
}