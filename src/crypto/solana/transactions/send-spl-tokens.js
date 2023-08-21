import {
    clusterApiUrl,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
} from '@solana/web3.js'
import {
    getOrCreateAssociatedTokenAccount,
    transfer,
    amountToUiAmount,
} from '@solana/spl-token'
import bs58 from 'bs58'


// Send SPL tokens
// fromSecretKeyStr: secret key of the sender
// toPublicKeyStr: public key of the receiver
// amount: amount of tokens to send
// token_acc: token account of the token to send, this is a public key
export async function send_token(fromSecretKeyStr, toPublicKeyStr, amount, token_acc) {
    // Variable for token size
    const decimals = 10000000000;

    // Connect to cluster
    const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');

    // Convert public key to Uint8Array
    const toPublicKey = new PublicKey(toPublicKeyStr);

    // Convert the secret key to a Uint8Array to create a Keypair
    const fromSecretKey = bs58.decode(fromSecretKeyStr);

    // Generate a new wallet to send token from a secret key
    const fromWallet = Keypair.fromSecretKey(fromSecretKey);

    // Create new token mint
    const mint = new PublicKey(token_acc);

    // Get the token account of the fromWallet address, and if it does not exist, create it
    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        mint,
        fromWallet.publicKey
    );

    // Get the token account of the toWallet address, and if it does not exist, create it
    const toTokenAccount = await getOrCreateAssociatedTokenAccount(connection, fromWallet, mint, toPublicKey);

    // Transfer the new token to the "toTokenAccount" we just created
    try{
        signature = await transfer(
            connection,
            fromWallet,
            fromTokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            amount*decimals
        );
    }
    catch(err){
        console.log(err);
    }

}
