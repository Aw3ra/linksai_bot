// import { upload } from "./shadowUpload.js";
import { uniqueNamesGenerator, names, adjectives } from "unique-names-generator";
import * as fs from 'fs';
import { createNFT } from "./createImage.js";
import { upload } from "../merkle-tree/shadowUpload.js";

// Read in linksai-uri.json
const linksaiUri = "./crypto/solana/merkle-tree/linksai-uri.json";
const SHADOW_ACCOUNT = process.env.SHADOW_ACCOUNT;


export async function createMetadata(attributes) {
    // Load in the linksai-uri.json file as a string
    let linksaiUriString = fs.readFileSync(linksaiUri, 'utf8');
    // Parse the string into a json object
    let linksaiUriJson = JSON.parse(linksaiUriString);
    // Get the linksai uri from the json object
    // Create a random name, then if that exists create another random name. Continue until a unique name is found
    let randomName = uniqueNamesGenerator({ dictionaries: [names, adjectives], length: 2, separator: ' the ' });
    while (fs.existsSync("./crypto/solana/cnfts/nfts/createdNfts/" + randomName + ".png")) {
        randomName = uniqueNamesGenerator({ dictionaries: [names, adjectives], length: 2, separator: ' the ' });
    }
    // Check each provided attribute, if it is null, choose a random one from the right folder
    for (const attribute in attributes.attributes) {
        if (attributes.attributes[attribute] === null) {
            let newAttribute = randomAttribute(attribute);
            attributes.attributes[attribute] = newAttribute;
        }
    }

    const imageName = "./crypto/solana/cnfts/nfts/createdNfts/" + randomName + ".png";
    const imagePath = await createNFT(
        attributes.attributes, 
        imageName
        )
    .catch(err => console.error(err));
    // Convert image path to a string and send it to the upload function
    console.log(imagePath);
    const imageUri = await upload(SHADOW_ACCOUNT,imagePath);
    


    const metadata = {
        name: randomName,
        symbol: linksaiUriJson.symbol,
        description: linksaiUriJson.description,
        external_url: linksaiUriJson.external_url,
        image: imageUri,
        attributes: attributes.attributes
    };
    // Return the metadata and uri as a json object
    return {
        metadata: metadata,
        image: imageName,
    }
}


// Function to look in the attributes object and if an attribute is not provided, choose a random one from the right folder
function randomAttribute(attribute){
    const attributeFolder = "./crypto/solana/cnfts/attributes/"+attribute;
        
    // Read the names of files in the folder (assuming they are directly under the folder)
    const attributeList = fs.readdirSync(attributeFolder);
    
    // If no files were found, return null or handle it in some other way
    if (attributeList.length === 0) {
        return null;
    }

    // Select a random attribute from the list
    const randomAttribute = attributeList[Math.floor(Math.random() * attributeList.length)].split('.')[0];
    
    return randomAttribute;
}

