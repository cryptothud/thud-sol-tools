# Thud's Solana Tools
Welcome to the Thud's Solana Tools package! This package provides a collection of tools that make interacting with the Solana blockchain easier using TypeScript modules.

## Installation
To install Thud's Solana Tools, run the following command:
```
npm install thud-sol-tools
```

or if you're using yarn:
```
yarn install thud-sol-tools
```

## Usage
The Thud's Solana Tools package includes a number of TypeScript modules that you can use to interact with the Solana blockchain. To use a module, simply import a function of your choice into your code as follows:
```
import { sendSolanaTransaction } from 'thud-sol-tools';
```

Once you have imported a module, you can use it to help you interact with the Solana blockchain. For example, you can use the following function to easily send NFTs to another address *(including support for pNFTs)*, as well as some SOL in the transaction
```
const wallet = useWallet()
const connection = useConnection()
await sendSolanaTransaction(
    wallet,
    connection,
    [...(await nftInstructionsUsingMetaplex(...)), ...solInstructionsUsingMetaplex(...)]
)
```

For more information and examples on the modules provided by Thud's Solana Tools, please review the source code.

## License
Thud's Solana Tools is licensed under the ISC License. See LICENSE for details.

Thank you for using Thud's Solana Tools! I hope that this package makes interacting with the Solana blockchain easier for you.