import { TipLink } from '@tiplink/api';


// Write a function that uses the below code to create a TipLink and return it.
// The function should be called createTipLink and should be exported.
// The function should be async and should return a TipLink.
export async function createTipLink() {
    const tiplink = await TipLink.create();
    const publicKey = tiplink.keypair.publicKey.toBase58();
    return {link: tiplink.url.href, pubkey: publicKey};
    }





