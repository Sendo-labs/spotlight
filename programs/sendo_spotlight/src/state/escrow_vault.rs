use anchor_lang::prelude::*;

#[account]
pub struct EscrowVault {
	pub spot_id: String,
	pub total_deposited: u64,
	pub total_withdrawn: u64,
	pub bump: u8,
}