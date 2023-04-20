import { Connection, Keypair, PublicKey, TransactionInstruction } from "@solana/web3.js";
import { Metaplex } from '@metaplex-foundation/js';
export declare const wait: (ms: any) => Promise<unknown>;
export declare const isBlockhashExpired: (connection: Connection, lastValidBlockHeight: number) => Promise<boolean>;
export declare const confirmSignatureStatus: (signature: string, connection: Connection, lastValidHeight: number) => Promise<boolean>;
export declare const sendSolanaTransaction: any;
export declare const sendV0SolanaTransaction: any;
export declare const sendSolanaTransactionWithSigner: any;
export declare const createKeypair: (privateKey: string) => Keypair;
export declare const createMetaplex: (connection: Connection) => Metaplex;
export declare const createMetaplexWithKeypair: (connection: Connection, keypair: Keypair) => Metaplex;
export declare const splInstructionsUsingMetaplex: (metaplex: Metaplex, fromOwner: PublicKey, toOwner: PublicKey, amount: number, splToken: PublicKey) => Promise<TransactionInstruction[]>;
export declare const nftInstructionsUsingMetaplex: (metaplex: Metaplex, fromOwner: PublicKey, toOwner: PublicKey, splToken: PublicKey, amount?: number) => Promise<TransactionInstruction[]>;
export declare const solInstruction: (fromPubkey: PublicKey, toPubkey: PublicKey, amount: number) => TransactionInstruction;
export declare const splInstructions: (fromPubkey: PublicKey, toPubkey: PublicKey, amount: number, token: PublicKey, connection: Connection) => Promise<TransactionInstruction[]>;
