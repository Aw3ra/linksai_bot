// Require send-spl-tokens.js from crypto\solana\transactions\ when this file is in crypto\solana\.
import {send_token} from './transactions/send-spl-tokens.js';

const token_acc = process.env.LINKSAI_TOKEN_ACCOUNT;
const private_key = process.env.LINKSAI_PRIVATE_KEY;

export async function transfer_tokens( toPublicKeyStr ) {
    const amount = 10;
    try{
        await send_token(private_key, toPublicKeyStr, amount, token_acc);
    }
    catch(err){
        console.log(err);
    }
}
