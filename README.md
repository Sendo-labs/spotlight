# Sendo Spotlight MVP Smart Contract

## Project Overview

Sendo Spotlight is a Solana-based auction platform that enables users to participate in time-bound auctions with a unique payout distribution model. The smart contract implements a complete auction system with bid placement, auction timing, and automated fund distribution to specific wallet addresses.

## Key Features

- **Time-based Auctions**: Auctions have defined start and end times
- **Bid Management**: Users can place bids with automatic refund of previous bids
- **Automated Payouts**: Funds distributed according to specific 15%/50%/35% split
- **Immutable SOL-only**: Built on Solana with native SOL transactions only
- **Event-driven Architecture**: Comprehensive event emission for frontend integration

## Technical Architecture

The smart contract is built using the Anchor framework and follows a modular architecture:

- **Accounts**: 
  - `SpotState`: Stores auction information and bid details
  - `EscrowVault`: Manages funds for each auction
- **Instructions**:
  - `init_spot`: Initialize new auction spots
  - `place_bid`: Place bids on active auctions
  - `settle`: Distribute funds when auctions end
- **Events**:
  - `BidPlaced`: Emitted when a bid is successfully placed
  - `BidRefunded`: Emitted when previous bidders are refunded
  - `SpotSettled`: Emitted when an auction is settled

## Payout Split Configuration

The contract distributes funds according to the following split to specific wallet addresses:

- **15%** to: `5FzC7gETJdwwKL71w1VkCKEmFSTzhvtTAUPQsxYEHDTp` (elizaosDAO)
- **50%** to: `J9LT87vTYGpPCrr795PSYSwqXUfu6RmULj4hq5UzswHD` (Contributor)
- **35%** to: `2zB6ySzH2PFKX3f9XZLUKJfP44fwyn69Bp6YaD6LEsqP` (Core Team)

## Installation and Setup

### Quick Start

To get started quickly:

```bash
npm i
anchor build
anchor test
```

### Prerequisites

- Rust 1.60 or later
- Node.js 14 or later
- Anchor CLI
- Solana CLI

### Installation Steps

1. Clone the repository:
```bash
git clone <repository-url>
cd sendo_spotlight_program
```

2. Install dependencies:
```bash
npm install
```

3. Install Anchor dependencies:
```bash
anchor install
```

## Deployment Instructions

### Local Development

1. Start a local Solana validator:
```bash
solana-test-validator
```

2. Deploy the program:
```bash
anchor deploy
```

### Devnet/Mainnet Deployment

1. Configure your wallet:
```bash
solana config set --url <network-url>
solana config set --keypair <path-to-keypair>
```

2. Deploy to the network:
```bash
anchor deploy --provider.cluster <network>
```

## Usage Examples

### Initialize a New Auction Spot

```bash
anchor run init_spot --args <spot_id> <auction_duration>
```

### Place a Bid

```bash
anchor run place_bid --args <spot_id> <amount>
```

### Settle an Auction

```bash
anchor run settle --args <spot_id>
```

## Event Descriptions

### BidPlaced
- **Description**: Emitted when a successful bid is placed
- **Fields**:
  - `spot_id`: Identifier of the auction spot
  - `bidder`: Public key of the bidder
  - `amount`: Amount of the bid in lamports

### BidRefunded
- **Description**: Emitted when a previous bidder is refunded
- **Fields**:
  - `spot_id`: Identifier of the auction spot
  - `bidder`: Public key of the refunded bidder
  - `amount`: Amount refunded in lamports

### SpotSettled
- **Description**: Emitted when an auction is successfully settled
- **Fields**:
  - `spot_id`: Identifier of the auction spot
  - `winner`: Public key of the winning bidder
  - `total_amount`: Total amount distributed in lamports

## Security Considerations

1. **Access Control**: Only authorized admin can settle auctions
2. **Time Validation**: Auctions can only be settled after they end
3. **Bid Validation**: Bids must be higher than current bid
4. **Reentrancy Protection**: No reentrant calls in critical sections
5. **Input Validation**: All inputs are validated before processing
6. **Account Rent**: Proper account initialization with rent exemption

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For support, please open an issue in the repository or contact the development team.