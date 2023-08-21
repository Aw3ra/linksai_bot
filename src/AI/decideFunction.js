import { Configuration, OpenAIApi } from "openai";
// Get the openai key from the .env file
// Load all the file name insisde the attributes folder into an object to provide as enums for the function calling

import fs from 'fs';
import path from 'path';

const attributeNames = [
    'backgrounds', 'Skin', 'Torso', 'Feet', 'Legs', 'Hair', 'Faces'
];

const attributes = {};


attributeNames.forEach(attributeName => {
    attributes[attributeName] = [];
    const directoryPath = path.join('./crypto/solana/cnfts/attributes', attributeName);
    const files = fs.readdirSync(directoryPath);
    
    files.forEach(file => {
        attributes[attributeName].push(file.split('.')[0]);
    });
});



// Import the openai key from .env
const OPENAI_KEY = process.env.OPENAI_KEY;

const configuration = new Configuration({
  apiKey: OPENAI_KEY,
});
const openai = new OpenAIApi(configuration);


export async function decideFunction(message) {
    console.log(message);
    const chatCompletion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        temperature: 0,
        messages: [
            {
                role: "user", 
                content: message
            }
        ],
        functions: [
            {
                name: "send_tip",
                description: "Send a tip to the user",
                parameters: {
                    type: "object",
                    properties: {
                        name:{
                            type: "string",
                            description: "The name of the user to send the tip to"
                        },
                        amount:{
                            type: "number",
                            description: "The amount of money to send to the user"
                        }  
                    },
                },
                required: ["name", "amount"]

            },
            {
                name: "recieve_tip",
                description: "Recieve a tip from the user",
                parameters: {
                    type: "object",
                    properties: {
                        name:{
                            type: "string",
                            description: "The name of the user to recieve the tip from"
                        },
                        link:{
                            type: "string",
                            description: "The link containing the tip",
                            format: "url"
                        }
                    },
                },
                required: ["name", "link"]
            },
            {
                name: "reply",
                description: "Reply to the user",
                parameters: {
                    type: "object",
                    properties: {
                        name:{
                            type: "string",
                            description: "The users name"
                        },
                    }
                },
                required: ["name"]
            },
            {
                name: "mint-nft",
                description: "Mints a new nft and sends it to the user, only use provided attributes.",
                parameters: {
                    type: "object",
                    properties: {
                        name:{
                            type: "string",
                            description: "The users name"
                        },
                        attributes:{
                            type: "object",
                            description: "The attributes of the nft",
                            properties: {
                                background:{
                                    type: "string",
                                    description: "The background of the nft",
                                    enum: attributes.backgrounds
                                },
                                faces:{
                                    type: "string",
                                    description: "The face of the nft",
                                    enum: attributes.Faces
                                },
                                feet:{
                                    type: "string",
                                    description: "The feet of the nft",
                                    enum: attributes.Feet
                                },
                                hair:{
                                    type: "string",
                                    description: "The hair of the nft",
                                    enum: attributes.Hair
                                },
                                legs:{
                                    type: "string",
                                    description: "The legs of the nft",
                                    enum: attributes.Legs
                                },
                                skin:{
                                    type: "string",
                                    description: "The skin of the nft",
                                    enum: attributes.Skin
                                },
                                torso:{
                                    type: "string",
                                    description: "The torso of the nft",
                                    enum: attributes.Torso
                                }
                            }
                        }
                    }
                },
                required: ["name"]
            }
        ],
      });
      return chatCompletion.data.choices[0].message.function_call;
}
