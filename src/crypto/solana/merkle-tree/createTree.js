import {
    createAllocTreeIx,
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression";

import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
    sendAndConfirmTransaction,
} from "@solana/web3.js";

import {
    createCreateTreeInstruction,
    PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
} from "@metaplex-foundation/mpl-bubblegum";


import fs from "fs";

const keypair_json = "./crypto/solana/merkle-tree/linksai.json";
const treepair_json = "./crypto/solana/merkle-tree/treePair.json";

const treeKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(treepair_json).toString())));
const payerKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(keypair_json).toString())));

const connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");

const ixAllocateTreeAccount = async ({
    maxDepth,
    maxBufferSize,
    canopyDepth,
}) => createAllocTreeIx(
    connection,
    treeKeypair.publicKey,
    payerKeypair.publicKey,
    {
        maxDepth,
        maxBufferSize,
    },
    canopyDepth,
);

const ixCreateTree = async ({
    maxBufferSize,
    maxDepth,
}) => {
    const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
        [treeKeypair.publicKey.toBuffer()],
        BUBBLEGUM_PROGRAM_ID
    );

    return createCreateTreeInstruction(
        {
          merkleTree: treeKeypair.publicKey,
          treeAuthority,
          treeCreator: payerKeypair.publicKey,
          payer: payerKeypair.publicKey,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        },
        {
          maxBufferSize,
          maxDepth,
          public: false,
        },
        BUBBLEGUM_PROGRAM_ID
    );
}

export const createTree = async () => {
    const [
        _,
        __,
        maxDepth = 14,
        maxBufferSize = 64,
        canopyDepth = 5,
    ] = process.argv;

    if(!maxBufferSize || !maxDepth) {
        throw new Error("Must specify maxBufferSize and maxDepth");
    }

    console.log("Allocating tree...")
    
    const allocTreeIx = await ixAllocateTreeAccount({
        maxDepth,
        maxBufferSize,
        canopyDepth
    });

    console.log("Create tree...")

    const createTreeIx = await ixCreateTree({
        maxBufferSize,
        maxDepth,
    });

    console.log("Create transaction...")

    const tx =
        new Transaction()
        .add(allocTreeIx)
        .add(createTreeIx);

    tx.feePayer = payerKeypair.publicKey;

    const signature = await sendAndConfirmTransaction(
        connection,
        tx,
        [
            treeKeypair,
            payerKeypair
        ],
        {
            commitment: "finalized",
            skipPreflight: true,
        }
    );

    fs.writeFileSync(".treeconfig", JSON.stringify({
        treePublicKey: treeKeypair.publicKey.toBase58(),
        createTreeTransaction: signature,
        maxBufferSize,
        maxDepth,
    }, null, 2));

    console.log("Tree creation success. See ./treeconfig.", signature);
};
