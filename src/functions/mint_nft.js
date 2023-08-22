import { upload } from "../crypto/solana/merkle-tree/shadowUpload.js";
import { createMetadata } from "../crypto/solana/cnfts/createMetadata.js";
import { mint } from "../crypto/solana/merkle-tree/mintNode.js";
import { createTipLink } from "../crypto/tiplink/createTipLink.js";
const shdwAccount = process.env.SHADOW_ACCOUNT;

export async function mint_nft(results) {
    const attributesObject = JSON.parse(results.arguments);
    const tipLink = await createTipLink();

    // Create the metadata string, if the attributes are not provided, use a random attribute
    console.log(attributesObject.attributes);
    const nftMetdata = {
        name: "linksai",
        symbol: "LINKSAI",
        description: "LINKSAI is a collection of 10,000 unique NFTs on the Solana blockchain.",
        external_url: "https://linksai.xyz",
        image: "https://linksai.xyz/images/linksai.png",
        attributes: {
            background: getValueOrNullOrString(attributesObject.attributes, 'background'),
            skin: getValueOrNullOrString(attributesObject.attributes, 'skin'),
            torso: getValueOrNullOrString(attributesObject.attributes, 'torso'),
            feet: getValueOrNullOrString(attributesObject.attributes, 'feet'),
            legs: getValueOrNullOrString(attributesObject.attributes, 'legs'),
            hair: getValueOrNullOrString(attributesObject.attributes, 'hair'),
            face: getValueOrNullOrString(attributesObject.attributes, 'face')
        }
    }
    console.log(nftMetdata);
    const nfttest = await createMetadata(nftMetdata);
    const metadataString = await upload(shdwAccount, nfttest.metadata);
    const mintTransaction = await mint(tipLink.pubkey, metadataString);
    

    // Return object containing the tiplink link and the xray embed
    return {
        link: tipLink.link,
        mintTransaction: mintTransaction,
        metadata: nfttest.metadata,
        image: nfttest.image,
        thumbnail: metadataString.replace(".json", ".png")
    }
}

function getValueOrNullOrString(parentObject, attributeKey) {
    if (!parentObject || parentObject[attributeKey] === undefined || parentObject[attributeKey] === ""||parentObject[attributeKey] === "default") {
      return null;
    }
    return parentObject[attributeKey];
  }
  
  