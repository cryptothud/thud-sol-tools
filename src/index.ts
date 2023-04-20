import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Signer, SystemProgram, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { keypairIdentity, Metaplex, sol, token, TokenMetadataAuthorityHolder, TokenMetadataAuthorityTokenDelegate } from '@metaplex-foundation/js';
import bs58 from "bs58";


export const wait = (ms: any) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export const isBlockhashExpired = async (connection: Connection, lastValidBlockHeight: number) => {
    let currentBlockHeight = (await connection.getBlockHeight('finalized'));
    return (currentBlockHeight > lastValidBlockHeight - 150); // If currentBlockHeight is greater than, blockhash has expired.
}


export const confirmSignatureStatus = async (signature: string, connection: Connection, lastValidHeight: number) => {
    let hashExpired = false;
    let txSuccess = false;
    while (!hashExpired && !txSuccess) {
        const { value: status } = await connection.getSignatureStatus(signature);

        // Break loop if transaction has succeeded
        if (status && ((status.confirmationStatus === 'confirmed' || 'finalized'))) {
            txSuccess = true;
            console.log(`Transaction Success. View on explorer: https://solscan.io/tx/${signature}`);
            break;
        }
        hashExpired = await isBlockhashExpired(connection, lastValidHeight);

        // Break loop if blockhash has expired
        if (hashExpired) {
            console.log(`Blockhash has expired.`);
            // (add your own logic to Fetch a new blockhash and resend the transaction or throw an error)
            return false
        }

        // Check again after 2.5 sec
        await wait(2500);
    }
    return txSuccess
}


/* 
  * most standard way to send a solana transaction
 
  * example:
  * const wallet = useWallet()
  * const connection = useConnection()
  * await sendSolanaTransaction(
  *   wallet,
  *   connection,
  *   [...(await splInstructions(...)), solInstruction(...)]
  * )
*/
export const sendSolanaTransaction: any = async (wallet: WalletContextState, connection: Connection, instructions: TransactionInstruction[], lastAttempt?: number) => {
    // starts at 0 to keep track and make sure it doesn't keep trying forever
    let attempt = (lastAttempt ?? 0) + 1
    const blockhashResponse = await connection.getLatestBlockhashAndContext('finalized');
    const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;

    // creates transaction, requests wallet to sign, and sends transaction
    const transaction = new Transaction().add(...instructions);
    transaction.feePayer = wallet.publicKey!
    transaction.recentBlockhash = blockhashResponse.value.blockhash
    const signedTx = await wallet.signTransaction?.(transaction)
    const signature = await connection.sendRawTransaction(signedTx?.serialize()!);

    // waits for transaction to confirm
    let confirmed = false
    confirmed = await confirmSignatureStatus(signature, connection, lastValidHeight)

    // handles dropped transactions, and will try up to 5 times
    if (attempt <= 5) {
        if (confirmed === false) {
            console.log("Transaction failed, please try again!")
            return await sendSolanaTransaction(wallet, connection, instructions, attempt)
        } else {
            return true
        }
    } else {
        console.log("Transaction failed after 5 tries.")
        return false
    }
}


/* 
  * used to send a v0 solana transaction
 
  * example:
  * const wallet = useWallet()
  * const connection = useConnection()
  * await sendV0SolanaTransaction(
  *   wallet,
  *   connection,
  *   [...(await splInstructions(...)), solInstruction(...)]
  * )
*/
export const sendV0SolanaTransaction: any = async (wallet: WalletContextState, connection: Connection, instructions: TransactionInstruction[], lastAttempt?: number) => {
    // starts at 0 to keep track and make sure it doesn't keep trying forever
    let attempt = (lastAttempt ?? 0) + 1
    const blockhashResponse = await connection.getLatestBlockhashAndContext('finalized');
    const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;

    // creates transaction, requests wallet to sign, and sends transaction
    const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey!,
        recentBlockhash: blockhashResponse.value.blockhash,
        instructions: instructions
    }).compileToV0Message();
    const transaction = new VersionedTransaction(messageV0);
    const signedTx = await wallet.signTransaction?.(transaction)
    const signature = await connection.sendRawTransaction(signedTx?.serialize()!);

    // waits for transaction to confirm
    let confirmed = false
    confirmed = await confirmSignatureStatus(signature, connection, lastValidHeight)

    // handles dropped transactions, and will try up to 5 times
    if (attempt <= 5) {
        if (confirmed === false) {
            console.log("Transaction failed, please try again!")
            return await sendV0SolanaTransaction(wallet, connection, instructions, attempt)
        } else {
            return true
        }
    } else {
        console.log("Transaction failed after 5 tries.")
        return false
    }
}


/* 
  * !! ONLY TO BE USED IN THE BACKEND !! this will typically expose the private key and is not meant for client side transactions
  * most standard way to send a solana transaction, but it is autosigned by a Keypair
 
  * example:
  * const wallet = createKeypair(...)
  * const connection = useConnection()
  * await sendSolanaTransactionWithSigner(
  *   wallet,
  *   connection,
  *   [...(await splInstructions(...)), solInstruction(...)]
  * )
*/
export const sendSolanaTransactionWithSigner: any = async (wallet: Signer, connection: Connection, instructions: TransactionInstruction[], lastAttempt?: number) => {
    // starts at 0 to keep track and make sure it doesn't keep trying forever
    let attempt = (lastAttempt ?? 0) + 1
    const blockhashResponse = await connection.getLatestBlockhashAndContext('finalized');
    const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;

    // creates transaction, requests wallet to sign, and sends transaction
    const transaction = new Transaction().add(...instructions);
    transaction.feePayer = wallet.publicKey
    transaction.recentBlockhash = blockhashResponse.value.blockhash
    transaction.sign(wallet)
    const signature = await connection.sendRawTransaction(transaction.serialize());

    // waits for transaction to confirm
    let confirmed = false
    confirmed = await confirmSignatureStatus(signature, connection, lastValidHeight)

    // handles dropped transactions, and will try up to 5 times
    if (attempt <= 5) {
        if (confirmed === false) {
            console.log("Transaction failed, trying again!")
            return await sendSolanaTransactionWithSigner(wallet, connection, instructions, attempt)
        } else {
            return true
        }
    } else {
        console.log("Transaction failed after 5 tries.")
        return false
    }
}


export const createKeypair = (privateKey: string) => {
    return Keypair.fromSecretKey(bs58.decode(privateKey));
}


export const createMetaplex = (connection: Connection, publicKey: PublicKey) => {
    const metaplex = Metaplex.make(connection);
    metaplex.identity().driver().publicKey = publicKey;
    return metaplex
}


export const createMetaplexWithKeypair = (connection: Connection, keypair: Keypair) => {
    const metaplex = Metaplex.make(connection);
    metaplex.use(keypairIdentity(keypair));
    return metaplex
}


export const splInstructionsUsingMetaplex = async (metaplex: Metaplex, fromOwner: PublicKey, toOwner: PublicKey, amount: number, splToken: PublicKey) => {
    return (await metaplex.tokens().builders().send({
        mintAddress: splToken,
        fromOwner,
        toOwner,
        amount: token(amount),
    })).getInstructions()
}


/* 
  * use this function to support transfer of pNFTs
*/
export const nftInstructionsUsingMetaplex = async (metaplex: Metaplex, fromOwner: PublicKey, toOwner: PublicKey, splToken: PublicKey, authority: Signer | TokenMetadataAuthorityTokenDelegate | TokenMetadataAuthorityHolder) => {
    const nftOrSft = await metaplex.nfts().findByMint({ mintAddress: splToken });

    let instructions = []

    // not sure if these instructions are needed yet. will find out :)
    // const dest = await getAssociatedTokenAddress(splToken, toOwner)
    // const accountInfo = await connection.getAccountInfo(dest)
    // if (accountInfo === null) {
    //     instructions.push(createAssociatedTokenAccountInstruction(fromOwner, dest, toOwner, splToken))
    // }

    if (nftOrSft.tokenStandard === 4) {
        instructions.push(...metaplex.nfts().builders().transfer({
            nftOrSft,
            fromOwner,
            toOwner,
            authorizationDetails: {
                rules: nftOrSft.programmableConfig.ruleSet
            },
            authority: authority
        }).getInstructions())
    } else {
        instructions.push(...metaplex.nfts().builders().transfer({
            nftOrSft,
            fromOwner,
            toOwner,
            authority: authority
        }).getInstructions())
    }

    return instructions
}


export const solInstruction = (fromPubkey: PublicKey, toPubkey: PublicKey, amount: number) => {
    return SystemProgram.transfer({
        fromPubkey: fromPubkey,
        toPubkey: toPubkey,
        lamports: Math.round(amount * LAMPORTS_PER_SOL)
    })
}


export const splInstructions = async (fromPubkey: PublicKey, toPubkey: PublicKey, amount: number, token: PublicKey, connection: Connection) => {
    let instructions: TransactionInstruction[] = []
    const source = await getAssociatedTokenAddress(token, fromPubkey)
    const dest = await getAssociatedTokenAddress(token, toPubkey)
    const supply = await connection.getTokenSupply(token)
    const accountInfo = await connection.getAccountInfo(dest)
    if (accountInfo === null) {
        instructions.push(createAssociatedTokenAccountInstruction(fromPubkey, dest, toPubkey, token))
    }
    instructions.push(createTransferInstruction(source, dest, fromPubkey, Math.round((amount) * (10 ** +supply.value.decimals))))
    return instructions
}