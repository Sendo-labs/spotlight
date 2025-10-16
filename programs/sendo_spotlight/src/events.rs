use anchor_lang::prelude::*;

#[event]
pub struct BidPlaced {
    pub spot_id: String,
    pub bidder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BidRefunded {
    pub spot_id: String,
    pub bidder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct SpotSettled {
    pub spot_id: String,
    pub winner: Option<Pubkey>,
    pub total_amount: u64,
}