"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.splInstructions = exports.solInstruction = exports.nftInstructionsUsingMetaplex = exports.splInstructionsUsingMetaplex = exports.createMetaplexWithKeypair = exports.createMetaplex = exports.createKeypair = exports.sendSolanaTransactionWithSigner = exports.sendV0SolanaTransaction = exports.sendSolanaTransaction = exports.confirmSignatureStatus = exports.isBlockhashExpired = exports.wait = void 0;
const web3_js_1 = require("@solana/web3.js");
const spl_token_1 = require("@solana/spl-token");
const js_1 = require("@metaplex-foundation/js");
const bs58_1 = __importDefault(require("bs58"));
const wait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.wait = wait;
const isBlockhashExpired = (connection, lastValidBlockHeight) => __awaiter(void 0, void 0, void 0, function* () {
    let currentBlockHeight = (yield connection.getBlockHeight('finalized'));
    return (currentBlockHeight > lastValidBlockHeight - 150); // If currentBlockHeight is greater than, blockhash has expired.
});
exports.isBlockhashExpired = isBlockhashExpired;
const confirmSignatureStatus = (signature, connection, lastValidHeight) => __awaiter(void 0, void 0, void 0, function* () {
    let hashExpired = false;
    let txSuccess = false;
    while (!hashExpired && !txSuccess) {
        const { value: status } = yield connection.getSignatureStatus(signature);
        // Break loop if transaction has succeeded
        if (status && ((status.confirmationStatus === 'confirmed' || 'finalized'))) {
            txSuccess = true;
            console.log(`Transaction Success. View on explorer: https://solscan.io/tx/${signature}`);
            break;
        }
        hashExpired = yield (0, exports.isBlockhashExpired)(connection, lastValidHeight);
        // Break loop if blockhash has expired
        if (hashExpired) {
            console.log(`Blockhash has expired.`);
            // (add your own logic to Fetch a new blockhash and resend the transaction or throw an error)
            return false;
        }
        // Check again after 2.5 sec
        yield (0, exports.wait)(2500);
    }
    return txSuccess;
});
exports.confirmSignatureStatus = confirmSignatureStatus;
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
const sendSolanaTransaction = (wallet, connection, instructions, lastAttempt) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // starts at 0 to keep track and make sure it doesn't keep trying forever
    let attempt = (lastAttempt !== null && lastAttempt !== void 0 ? lastAttempt : 0) + 1;
    const blockhashResponse = yield connection.getLatestBlockhashAndContext('finalized');
    const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;
    // creates transaction, requests wallet to sign, and sends transaction
    const transaction = new web3_js_1.Transaction().add(...instructions);
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = blockhashResponse.value.blockhash;
    const signedTx = yield ((_a = wallet.signTransaction) === null || _a === void 0 ? void 0 : _a.call(wallet, transaction));
    const signature = yield connection.sendRawTransaction(signedTx === null || signedTx === void 0 ? void 0 : signedTx.serialize());
    // waits for transaction to confirm
    let confirmed = false;
    confirmed = yield (0, exports.confirmSignatureStatus)(signature, connection, lastValidHeight);
    // handles dropped transactions, and will try up to 5 times
    if (attempt <= 5) {
        if (confirmed === false) {
            console.log("Transaction failed, please try again!");
            return yield (0, exports.sendSolanaTransaction)(wallet, connection, instructions, attempt);
        }
        else {
            return true;
        }
    }
    else {
        console.log("Transaction failed after 5 tries.");
        return false;
    }
});
exports.sendSolanaTransaction = sendSolanaTransaction;
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
const sendV0SolanaTransaction = (wallet, connection, instructions, lastAttempt) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    // starts at 0 to keep track and make sure it doesn't keep trying forever
    let attempt = (lastAttempt !== null && lastAttempt !== void 0 ? lastAttempt : 0) + 1;
    const blockhashResponse = yield connection.getLatestBlockhashAndContext('finalized');
    const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;
    // creates transaction, requests wallet to sign, and sends transaction
    const messageV0 = new web3_js_1.TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhashResponse.value.blockhash,
        instructions: instructions
    }).compileToV0Message();
    const transaction = new web3_js_1.VersionedTransaction(messageV0);
    const signedTx = yield ((_b = wallet.signTransaction) === null || _b === void 0 ? void 0 : _b.call(wallet, transaction));
    const signature = yield connection.sendRawTransaction(signedTx === null || signedTx === void 0 ? void 0 : signedTx.serialize());
    // waits for transaction to confirm
    let confirmed = false;
    confirmed = yield (0, exports.confirmSignatureStatus)(signature, connection, lastValidHeight);
    // handles dropped transactions, and will try up to 5 times
    if (attempt <= 5) {
        if (confirmed === false) {
            console.log("Transaction failed, please try again!");
            return yield (0, exports.sendV0SolanaTransaction)(wallet, connection, instructions, attempt);
        }
        else {
            return true;
        }
    }
    else {
        console.log("Transaction failed after 5 tries.");
        return false;
    }
});
exports.sendV0SolanaTransaction = sendV0SolanaTransaction;
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
const sendSolanaTransactionWithSigner = (wallet, connection, instructions, lastAttempt) => __awaiter(void 0, void 0, void 0, function* () {
    // starts at 0 to keep track and make sure it doesn't keep trying forever
    let attempt = (lastAttempt !== null && lastAttempt !== void 0 ? lastAttempt : 0) + 1;
    const blockhashResponse = yield connection.getLatestBlockhashAndContext('finalized');
    const lastValidHeight = blockhashResponse.value.lastValidBlockHeight;
    // creates transaction, requests wallet to sign, and sends transaction
    const transaction = new web3_js_1.Transaction().add(...instructions);
    transaction.feePayer = wallet.publicKey;
    transaction.recentBlockhash = blockhashResponse.value.blockhash;
    transaction.sign(wallet);
    const signature = yield connection.sendRawTransaction(transaction.serialize());
    // waits for transaction to confirm
    let confirmed = false;
    confirmed = yield (0, exports.confirmSignatureStatus)(signature, connection, lastValidHeight);
    // handles dropped transactions, and will try up to 5 times
    if (attempt <= 5) {
        if (confirmed === false) {
            console.log("Transaction failed, trying again!");
            return yield (0, exports.sendSolanaTransactionWithSigner)(wallet, connection, instructions, attempt);
        }
        else {
            return true;
        }
    }
    else {
        console.log("Transaction failed after 5 tries.");
        return false;
    }
});
exports.sendSolanaTransactionWithSigner = sendSolanaTransactionWithSigner;
const createKeypair = (privateKey) => {
    return web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(privateKey));
};
exports.createKeypair = createKeypair;
const createMetaplex = (connection) => {
    const metaplex = new js_1.Metaplex(connection);
    return metaplex;
};
exports.createMetaplex = createMetaplex;
const createMetaplexWithKeypair = (connection, keypair) => {
    const metaplex = new js_1.Metaplex(connection);
    metaplex.use((0, js_1.keypairIdentity)(keypair));
    return metaplex;
};
exports.createMetaplexWithKeypair = createMetaplexWithKeypair;
const splInstructionsUsingMetaplex = (metaplex, fromOwner, toOwner, amount, splToken) => __awaiter(void 0, void 0, void 0, function* () {
    return (yield metaplex.tokens().builders().send({
        mintAddress: splToken,
        fromOwner,
        toOwner,
        amount: (0, js_1.token)(amount),
    })).getInstructions();
});
exports.splInstructionsUsingMetaplex = splInstructionsUsingMetaplex;
/*
  * use this function to support transfer of pNFTs
*/
const nftInstructionsUsingMetaplex = (metaplex, fromOwner, toOwner, splToken, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const rules = new web3_js_1.PublicKey("eBJLFYPxJmMGKuFwpDWkzxZeUrad92kZRC5BJLpzyT9");
    const nftOrSft = yield metaplex.nfts().findByMint({
        mintAddress: splToken,
    });
    return (nftOrSft.tokenStandard === 4 ?
        metaplex.nfts().builders().transfer({
            nftOrSft,
            fromOwner,
            toOwner,
            amount: (0, js_1.token)(1),
            authorizationDetails: {
                rules
            }
        }).getInstructions()
        :
            metaplex.nfts().builders().transfer({
                nftOrSft,
                fromOwner,
                toOwner,
                amount: (0, js_1.token)(amount !== null && amount !== void 0 ? amount : 1)
            }).getInstructions());
});
exports.nftInstructionsUsingMetaplex = nftInstructionsUsingMetaplex;
const solInstruction = (fromPubkey, toPubkey, amount) => {
    return web3_js_1.SystemProgram.transfer({
        fromPubkey: fromPubkey,
        toPubkey: toPubkey,
        lamports: Math.round(amount * web3_js_1.LAMPORTS_PER_SOL)
    });
};
exports.solInstruction = solInstruction;
const splInstructions = (fromPubkey, toPubkey, amount, token, connection) => __awaiter(void 0, void 0, void 0, function* () {
    let instructions = [];
    const source = yield (0, spl_token_1.getAssociatedTokenAddress)(token, fromPubkey);
    const dest = yield (0, spl_token_1.getAssociatedTokenAddress)(token, toPubkey);
    const supply = yield connection.getTokenSupply(token);
    const accountInfo = yield connection.getAccountInfo(dest);
    if (accountInfo === null) {
        instructions.push((0, spl_token_1.createAssociatedTokenAccountInstruction)(fromPubkey, dest, toPubkey, token));
    }
    instructions.push((0, spl_token_1.createTransferInstruction)(source, dest, fromPubkey, Math.round((amount) * (Math.pow(10, +supply.value.decimals)))));
    return instructions;
});
exports.splInstructions = splInstructions;
