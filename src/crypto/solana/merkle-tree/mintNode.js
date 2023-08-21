import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";

import {
    Connection,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
    Keypair,
} from "@solana/web3.js";

import {
    createMintToCollectionV1Instruction,
    PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
    TokenProgramVersion,
} from "@metaplex-foundation/mpl-bubblegum";

import {
    PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";

import * as fs from "fs";

const collection = JSON.parse(fs.readFileSync(".collection").toString());

const projectmetadata = JSON.parse(fs.readFileSync("./crypto/solana/merkle-tree/linksai-uri.json").toString());
const keypair_json = "./crypto/solana/merkle-tree/linksai.json";
const payerKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypair_json).toString())));
const RPC_URL = process.env.RPC_URL;
const merkleTree = new PublicKey(process.env.MERKLE_TREE);

const deriveAccounts = () => {

    const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
        [merkleTree.toBuffer()],
        BUBBLEGUM_PROGRAM_ID
    );

    const [bgumSigner, __] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection_cpi", "utf8")],
        BUBBLEGUM_PROGRAM_ID
    );

    return {
        treeAuthority,
        bgumSigner,
    }
}

const createMintInstruction = (destination, uri) => {
    if(!merkleTree) {
        throw new Error("TREE_KEYPAIR not found");
    } else if (!payerKeypair) {
        throw new Error("PAYER_KEYPAIR not found in environment");
    }
    const destinationKey = new PublicKey(destination);
    
    const {
        treeAuthority,
        bgumSigner,
    } = deriveAccounts();

    let newResponse;
    try{
        return newResponse = createMintToCollectionV1Instruction(
            {
                merkleTree: merkleTree,
                treeAuthority: treeAuthority,
                treeDelegate: payerKeypair.publicKey,
                payer: payerKeypair.publicKey,
                leafDelegate: payerKeypair.publicKey,
                leafOwner: destinationKey || payerKeypair.publicKey,
                compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
                logWrapper: SPL_NOOP_PROGRAM_ID,
                collectionAuthority: payerKeypair.publicKey,
                collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
                collectionMint: new PublicKey(collection.collectionMint),
                collectionMetadata: new PublicKey(collection.collectionMetadataAccount),
                editionAccount: new PublicKey(collection.collectionMasterEditionAccount),
                bubblegumSigner: bgumSigner,
                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
            },
            {
                metadataArgs: {
                    creators: [],
                    editionNonce: 0,
                    tokenProgramVersion: TokenProgramVersion.Original,
                    tokenStandard: 0, // NFT
                    uses: null,
                    primarySaleHappened: false,
                    sellerFeeBasisPoints: 0,
                    isMutable: false,
                    collection: {
                        key: new PublicKey(collection.collectionMint),
                        verified: false
                    },
                    uri: uri,
                    symbol: projectmetadata.symbol,
                    name: projectmetadata.name,
                },
            },
        );
    } catch (e) {
        console.log(e);
    }

}

export async function mint (destination, uri) {
    try {
        const connection = new Connection(RPC_URL, "confirmed");
        const mintIx = createMintInstruction(destination, uri);
        const tx = new Transaction().add(mintIx);
        tx.feePayer = payerKeypair.publicKey;
        const sig = await sendAndConfirmTransaction(
            connection,
            tx,
            [payerKeypair],
            {
                skipPreflight: false,
                commitment: "finalized",
            }
        );
    
        return "https://xray.helius.xyz/tx/"+sig;
    }
    catch (e) {
        console.log(e);
        return "";
    }

}