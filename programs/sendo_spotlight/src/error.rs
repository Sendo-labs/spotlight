use anchor_lang::prelude::*;

#[error_code]
pub enum SendoSpotlightError {
	#[msg("Invalid spot identifier")]
	InvalidSpotId,
	#[msg("Auction is not currently active")]
	AuctionNotActive,
	#[msg("Auction has already been settled")]
	AuctionAlreadySettled,
	#[msg("Bid amount is insufficient")]
	InsufficientBid,
	#[msg("Only admin can settle auctions")]
	InvalidAdmin,
	#[msg("Auction has not ended yet")]
	AuctionNotEnded,
	#[msg("Bid amount must be greater than zero")]
	InvalidBidAmount,
}