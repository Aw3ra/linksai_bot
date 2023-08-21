import * as fs from 'fs';
import { Keypair } from '@solana/web3.js';
import { ShdwDrive } from '@shadow-drive/sdk';
import * as anchor from "@coral-xyz/anchor";
import { Connection, clusterApiUrl } from '@solana/web3.js';
import key from './linksai.json' assert { type: "json" };

export async function upload(account, filePath) {
        // Assuming the secret key is an array in the JSON,
        // otherwise, you might need to access a property of the 'key' object
        let secretKey = Uint8Array.from(key.secretKey || key); 
        let keypair = Keypair.fromSecretKey(secretKey);

        
        const connection = new Connection(
            clusterApiUrl("mainnet-beta"),
            "confirmed"
        );
        const wallet = new anchor.Wallet(keypair);
        // Initialize the drive
        const drive = await new ShdwDrive(connection, wallet).init();

        // Prepare file for upload
        // If the file is a string, read it from the file system
        let fileBuff;
        let fileName;
        if (typeof filePath === "string"){
            fileBuff = fs.readFileSync(filePath);
            fileName = filePath.split("/").pop();
        }
        // If the file is a json, use the json as the file
        else if (typeof filePath === "object"){
            fileBuff = Buffer.from(JSON.stringify(filePath));
            fileName = filePath.name+".json";
        }
        // If neither, throw an error
        else {
            throw new Error("File must be a string or a json object");
        }
    
        const fileToUpload = {
            name: fileName,
            file: fileBuff,
        };
        // Upload the file to the drive
        const uploadFile = await drive.uploadFile(account, fileToUpload);
        // Return the finalized location of the file
        return uploadFile.finalized_locations[0];
  
}

