import "./config.js";
import * as fs from 'fs';
import path from 'path';
import { Client, Events, GatewayIntentBits, Collection, DiscordAPIError, EmbedBuilder } from 'discord.js'

import { upload } from "./crypto/solana/merkle-tree/shadowUpload.js";
import { createMetadata } from "./crypto/solana/cnfts/createMetadata.js";
import { mint } from "./crypto/solana/merkle-tree/mintNode.js";
import { decideFunction } from "./AI/decideFunction.js";
import { createResponse } from "./AI/createResponse.js";
import { createTipLink } from "./crypto/tiplink/createTipLink.js";
import { transfer_tokens } from "./crypto/solana/transfer.js";

const config = JSON.parse(fs.readFileSync("./config.json", 'utf8'));
const { clientId, guildId, token, dms } = config;




// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// client.commands = new Collection();
// const foldersPath = path.join(__dirname, 'commands');
// const commandFolders = fs.readdirSync(foldersPath);

// for (const folder of commandFolders) {
// 	const commandsPath = path.join(foldersPath, folder);
// 	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
// 	for (const file of commandFiles) {
// 		const filePath = path.join(commandsPath, file);
// 		const command = require(filePath);
// 		if ('data' in command && 'execute' in command) {
// 			client.commands.set(command.data.name, command);
// 		} else {
// 			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
// 		}
// 	}
// }

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}
	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on("messageCreate", async message =>{
	if(message.author.bot) return;
	if(message.mentions.has(client.user.id)){
		const results = await decideFunction(message.author.id+": "+message.content.replace('<@!'+client.user.id+'>', ''));

		if(results.name=="reply"){
			const reply = await createResponse(message.content)
			await message.reply(reply);
		}
		else if(results.name=="send_tip"){
			if(dms==="on"){
				const tiplink = await createTipLink();
				//Function to mint NFT here 
		
				// Transfer tokens OR nft to the tiplink
				transfer_tokens(tiplink.pubkey);
				// Send the tiplink to the user in a DM, the user name is results.arguments.name
				let usr = await client.users.fetch(JSON.parse(results.arguments).name.replace('<@', '').replace('>', ''));
				try{
					await usr.send(tiplink.link);
				}
				catch(err){
					await message.reply("Sorry I can't send you a tip link, please enable DMs from server members"+err);
				}
			}
			else{
				await message.reply(tiplink.link);
			}
		}else if(results.name=="mint-nft"){
				// Turn attributes from a string into an object
				const attributesObject = JSON.parse(results.arguments);
				const tipLink = await createTipLink();
				let usr = await client.users.fetch(JSON.parse(results.arguments).name.replace('<@', '').replace('>', ''));
				// Create the metadata string, if the attributes are not provided, use a random attribute
				const nftMetdata = {
					name: "linksai",
					symbol: "LINKSAI",
					description: "LINKSAI is a collection of 10,000 unique NFTs on the Solana blockchain.",
					external_url: "https://linksai.xyz",
					image: "https://linksai.xyz/images/linksai.png",
					attributes: {
						backgrounds: attributesObject.backgrounds || null,
						Skin: attributesObject.Skin || null,
						Torso: attributesObject.Torso || null,
						Feet: attributesObject.Feet || null,
						Legs: attributesObject.Legs || null,
						Hair: attributesObject.Hair || null,
						Faces: attributesObject.Faces || null,
					}
				}
				const nfttest = await createMetadata(nftMetdata);
				const metadataString = await upload("4T974QUpAoe5kDdsBKQpV4rtTtm7qmSjNNyjSFc94X3X", nfttest.metadata);
				// const mintTransaction = await mint(tipLink.pubkey, metadataString);
				const xrayEmbed = new EmbedBuilder().setTitle("Xray").setDescription("View the mint here!").setURL("https://www.google.com").setColor(251, 206, 177);
				await message.reply({
					content: "I've just minted you an NFT!", 
					embeds: [xrayEmbed],
					files: [nfttest.image]
				});
		// Create a response with the tiplink
	}
	}
});

// Log in to Discord with your client's token
client.login(token);